import axios, { AxiosError } from 'axios'
import { EventEmitter } from 'events'
import fastq from 'fastq'
import eachDeep from 'deepdash/eachDeep'
import { sleep } from './util'

export interface ResponseObject {
    /**
     * Requested URL
     */
    url: string
    /**
     * HTTP Status Code
     */
    status: number
    /**
     * HTTP Status text
     */
    statusText: string
    /**
     * Response Time in milliseconds(ms)
     */
    duration: number
    /**
     * Response Headers from Flipkart server
     */
    headers: any
    /**
     * Response content
     */
    data: any
}
/**
 * @internal
 */
interface CompletedResponse {
    httpResponse: ResponseObject
    category: string
    pageNo: number
    retryCount: number
}

/**
 * @internal
 */
interface EnqueuePrams {
    url: string
    category: string
    pageNo: number
    retryCount: number
}

export interface ScraperOptions {
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

export interface ScrapedData {
    url: string
    apiData: any
    category: string
    pageNo: number
    retryCount: number
}

/** 
 Emitted when successful HTTP response from the Flipkart Affiliate server.
 * @memberof FlipkartScraper
 * @event
 */
export declare function response(httpResponse: ResponseObject): void;

/** 
 * Emitted when products returned from Flipkart affiliate API.
 * @memberof FlipkartScraper
 * @event
 */
export declare function data(scrapedData: ScrapedData): void;

/** 
 * Emitted if any errors occured.
 * @memberof FlipkartScraper
 * @event
 */
export declare function error(errorObj: AxiosError): void;
export interface CompletedCategoryInfo {
    category: string
    noOfPages: number
    totalProducts: number
}
/** 
 * Emitted when all products scraped by category.
 * @memberof FlipkartScraper
 * @event
 */
export declare function completed(completedCategoryInfo: CompletedCategoryInfo): void;
export interface FinishedInfo {
    message: string
    totalRequest: number
}
/** 
 * Emitted when scraper finished
 * @memberof FlipkartScraper
 * @event
 */
export declare function finished(finishedInfo: FinishedInfo): void;
export interface RetryInfo extends EnqueuePrams {
    status: number
    statusText: string
    errorCode: undefined | string
}
/** 
 * Emitted when retry occurred
 * @memberof FlipkartScraper
 * @event
 */
export declare function retry(retryInfo: RetryInfo): void;

/** 
 * Emitted when retry failed 10 times
 * @memberof FlipkartScraper
 * @event
 */
export declare function retryHalted(retryHaltInfo: RetryInfo): void;

/**
 * This the main class for Flipkart scraper
 */
export class FlipkartScraper extends EventEmitter {
    private _affiliateId: string
    private _affiliateToken: string
    private _baseUrl = 'https://affiliate-api.flipkart.net'
    private _queue: fastq.queue
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
        this._queue = fastq(this._worker.bind(this), this._concurrency)
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
                            this._enqueue({ url: value, pageNo: 1, category: resourceName, retryCount: 0 })
                    } else {
                        this._enqueue({ url: value, pageNo: 1, category: resourceName, retryCount: 0 })
                    }
                }
            })
            while (!this._queue.idle()) {
                await sleep(1000)
            }
            const finishedInfo: FinishedInfo = { message: 'Scraping Completed', totalRequest: this._processedCount }
            this.emit('finished', finishedInfo)
            return Promise.resolve('Scraping Completed.')
        } catch (errorObj) {
            this.emit('error', errorObj)
            return Promise.reject(errorObj)
        }
    }
    /**
     * 
     * @param params 
     */
    private async _enqueue(params: EnqueuePrams) {
        this._requestedCount++
        if (this._maxRequest === 0 || this._requestedCount <= this._maxRequest)
            this._queue.push(params, this._onComplete.bind(this))
    }
    private async _worker(params: EnqueuePrams, cb: any) {
        try {
            const { url, category, pageNo, retryCount } = params
            const httpResponse = await this._getData(url)
            cb(null, { httpResponse, category, pageNo, retryCount })
        } catch (errorObj) {
            const { status, statusText } = errorObj.response || { status: -1, statusText: 'ERROR' }
            const { code: errorCode } = errorObj
            if (params.retryCount < 10 && (errorCode || status >= 500)) {
                const retryParams: EnqueuePrams = { ...params, retryCount: params.retryCount + 1 }
                this._enqueue(retryParams)
                const retryData: RetryInfo = { ...retryParams, status, statusText, errorCode }
                this.emit('retry', retryData)
            } else {
                const retryData: RetryInfo = { ...params, status, statusText, errorCode }
                this.emit('retryHalted', retryData)
            }
            cb(errorObj, null)
        }
    }
    /**
     * 
     * @param errorObj
     * @param completedResponse 
     */
    private _onComplete(errorObj: any, completedResponse: CompletedResponse) {
        this._processedCount++
        if (errorObj === null) {
            const { data: apiData, url } = completedResponse.httpResponse
            if (apiData.products.length)
                this.emit('data', {
                    url,
                    apiData,
                    category: completedResponse.category,
                    pageNo: completedResponse.pageNo,
                    retryCount: completedResponse.retryCount
                })
            if (apiData.nextUrl) {
                if (this._maxPage === 0 || completedResponse.pageNo < this._maxPage)
                    this._enqueue({ url: apiData.nextUrl, category: completedResponse.category, pageNo: completedResponse.pageNo + 1, retryCount: 0 })
            }
            else {
                const completedInfo: CompletedCategoryInfo = {
                    category: completedResponse.category,
                    noOfPages: completedResponse.pageNo,
                    totalProducts: apiData.products.length + ((completedResponse.pageNo - 1) * 500),
                }
                this.emit('completed', completedInfo)
            }
        } else {
            this.emit('error', errorObj)
        }
    }
    /**
     * 
     * @param url 
     */
    private async _getData(url: string): Promise<ResponseObject> {
        try {
            const startTs = new Date().getTime()
            const responseObj = await axios.get(url, {
                headers: {
                    'Fk-Affiliate-Id': this._affiliateId,
                    'Fk-Affiliate-Token': this._affiliateToken,
                }
            })
            const duration = new Date().getTime() - startTs
            const { status, statusText, headers, data: apiData } = responseObj
            const responseInfo: ResponseObject = { url, status, statusText, duration, headers, data: apiData }
            this.emit('response', responseInfo)
            return Promise.resolve(responseInfo)
        } catch (errorObj) {
            return Promise.reject(errorObj)
        }
    }
}