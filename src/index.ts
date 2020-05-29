import axios from 'axios'
import { EventEmitter } from 'events'
import fastq from 'fastq'
import eachDeep from 'deepdash/eachDeep'
import { sleep } from './util'

/**
 * @internal
 */
interface ResponseObject {
    url: string
    statusCode: number
    statusText: string
    headers: any
    data: any
}
/**
 * @internal
 */
interface CompletedResponse {
    httpResponse: ResponseObject
    category: string
    pageNo: number
}

/**
 * @internal
 */
interface EnqueuePrams {
    url: string
    category: string
    pageNo: number
}

interface ScraperOptions {
    /**
     * Maximum request to Flipkart affliate server 
     */
    maxRequest?: number
    /**
     * Number for parallel processing in the queue
     */
    concurrency?: number
    /**
     * Maximum number of pages to scrape per category
     */
    maxPage?: number
}

// { url, apiData, category: response.category, pageNo: response.pageNo }

interface ScrapedData {
    url: string
    apiData: any,
    category: string
    pageNo: number
}

/** 
 Emitted when successful HTTP response from the Flipkart Affiliate server.
 * @memberof FlipkartScraper
 * @event
 */
declare function response(response: ResponseObject): void;

/** 
 * Emitted when products returned from Flipkart affiliate API.
 * @memberof FlipkartScraper
 * @event
 */
declare function data(data: ScrapedData): void;

/** 
 * Emitted if any errors occured.
 * @memberof FlipkartScraper
 * @event
 */
declare function error(error: any): void;

/** 
 * Emitted when all products scraped by category.
 * @memberof FlipkartScraper
 * @event
 */
declare function completed(info: any): void;

/** 
 * Emitted when scraper finished
 * @memberof FlipkartScraper
 * @event
 */
declare function finished(message: string): void;

/**
 * This the main class for Flipkart scraper
 */
export default class FlipkartScraper extends EventEmitter {
    private _affiliateId: string
    private _affiliateToken: string
    private _baseUrl = 'https://affiliate-api.flipkart.net'
    private queue: fastq.queue
    private _maxRequest: number
    private _requestedCount = 0
    private _processedCount = 0
    private _concurrency: number
    private _maxPage: number
    /**
     * This is constructor of FlipkartScraper
     * @param affiliateId 
     * @param affiliateToken 
     * @param options 
     */
    constructor(affiliateId: string, affiliateToken: string, options: ScraperOptions = {}) {
        super()
        this._affiliateId = affiliateId
        this._affiliateToken = affiliateToken
        this._maxRequest = options.maxRequest || 0
        this._concurrency = options.concurrency || 2
        this._maxPage = options.maxPage || 0
        this.queue = fastq(this._worker.bind(this), this._concurrency)
        this.emit('ready')
    }
    /**
     * 
     * @param categoriesToScrape 
     */
    async start(categoriesToScrape: string[] = []): Promise<string> {
        const feedUrl = `${this._baseUrl}/affiliate/api/${this._affiliateId}.json`
        try {
            const { data: feedListing } = await this._getData(feedUrl)
            const categoryListing: any = {}
            eachDeep(feedListing, (value: any, key: string, parent: { resourceName: string }) => {
                if (key === 'get') {
                    const resourceName: string = parent.resourceName
                    categoryListing[resourceName] = value
                    if (categoriesToScrape.length) {
                        if (categoriesToScrape.includes(resourceName))
                            this._enqueue({ url: value, pageNo: 1, category: resourceName })
                    } else {
                        this._enqueue({ url: value, pageNo: 1, category: resourceName })
                    }
                }
            })
            while (!this.queue.idle()) {
                await sleep(1000)
            }
            this.emit('finished', { message: 'Scraping Completed', totalRequest: this._processedCount })
            return Promise.resolve('finished')
        } catch (error) {
            this.emit('error', error)
            return Promise.reject(error)
        }
    }
    /**
     * 
     * @param params 
     */
    private async _enqueue(params: EnqueuePrams) {
        this._requestedCount++
        if (this._maxRequest === 0 || this._requestedCount <= this._maxRequest)
            this.queue.push(params, this._onComplete.bind(this))
    }
    private async _worker(params: EnqueuePrams, cb: any) {
        try {
            const { url, category, pageNo } = params
            const httpResponse = await this._getData(url)
            cb(null, { httpResponse, category, pageNo })
        } catch (error) {
            cb(error, null)
        }
    }
    /**
     * 
     * @param error 
     * @param response 
     */
    private _onComplete(error: any, response: CompletedResponse) {
        this._processedCount++
        if (error === null) {
            const { data: apiData, url } = response.httpResponse
            if (apiData.products.length)
                this.emit('data', { url, apiData, category: response.category, pageNo: response.pageNo })
            if (apiData.nextUrl) {
                if (this._maxPage === 0 || response.pageNo < this._maxPage)
                    this._enqueue({ url: apiData.nextUrl, category: response.category, pageNo: response.pageNo + 1 })
            }
            else {
                this.emit('completed', {
                    category: response.category,
                    noOfPages: response.pageNo,
                    totalProducts: apiData.products.length + ((response.pageNo - 1) * 500)
                })
            }
        } else {
            this.emit('error', error)
        }
    }
    /**
     * 
     * @param url 
     */
    private async _getData(url: string): Promise<ResponseObject> {
        try {
            const response = await axios.get(url, {
                headers: {
                    'Fk-Affiliate-Id': this._affiliateId,
                    'Fk-Affiliate-Token': this._affiliateToken,
                }
            })
            const { status: statusCode, statusText, headers, data } = response
            const responseInfo: ResponseObject = { url, statusCode, statusText, headers, data }
            this.emit('response', responseInfo)
            return Promise.resolve(responseInfo)
        } catch (error) {
            return Promise.reject(error)
        }
    }
}