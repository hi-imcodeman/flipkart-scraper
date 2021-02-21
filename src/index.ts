import axios, { AxiosError } from 'axios'
import { EventEmitter } from 'events'
import fastq from 'fastq'
import eachDeep from 'deepdash/eachDeep'
import { sleep, durationFormatWithMs } from './util'
import numeral from 'numeral'
import {
    ResponseObject,
    CompletedResponse,
    EnqueuePrams,
    ScraperOptions,
    ScrapedData,
    CategoryInfo,
    PendingCategoryInfo,
    FinishedInfo,
    RetryInfo,
    StatsData,
} from './interfaces'
import { ScraperStatus } from './enums'
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

/** 
 * Emitted when all products scraped by category.
 * @memberof FlipkartScraper
 * @event
 */
export declare function categoryCompleted(completedCategoryInfo: CategoryInfo): void;

/** 
 * Emitted when scraper finished
 * @memberof FlipkartScraper
 * @event
 */
export declare function finished(finishedInfo: FinishedInfo): void;

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
    private _startTime: Date
    private _endTime: Date
    private _totalProductsCount = 0
    private _retryCount = 0
    private _errorCount = 0
    private _retryHaltCount = 0
    private _pendingCategory: PendingCategoryInfo[] = []
    private _completedCategory: CategoryInfo[] = []
    private _status: ScraperStatus
    private _downloadSize = 0

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
        this._status = ScraperStatus.READY
        this.emit('ready')
    }
    stats(showAsNumbers = false): StatsData {
        let elapsed = 1
        if (this._status === ScraperStatus.FINISHED) {
            elapsed = this._endTime.getTime() - this._startTime.getTime()
        } else if (this._startTime) {
            elapsed = new Date().getTime() - this._startTime.getTime()
        }
        const statsFormats = {
            productsCount: '0.00a',
            elapsed: durationFormatWithMs,
            durationPerMillionProducts: durationFormatWithMs,
            productsPerSec: (value: number) => `${numeral(value).format('0.00a')} products/sec`,
            avgResponseTime: (value: number) => `${value}ms`,
            requestPerSec: (value: number) => `${value}/sec`,
            requestedCount: '0.00a',
            processedCount: '0.00a',
            errorCount: '0.0a',
            retryCount: '0.0a',
            retryHaltCount: '0.0a',
            downloadSize: '0.00b',
            downloadedSpeed: (value: number) => `${numeral(value).format('0.00b')}/sec`
        }
        const stats: StatsData = {
            startTime: this._startTime,
            endTime: this._endTime,
            status: this._status,
            concurrency: this._concurrency,
            waitingRequests: this._queue.length(),
            productsCount: this._totalProductsCount,
            elapsed,
            durationPerMillionProducts: this._totalProductsCount ? Number(((elapsed / this._totalProductsCount) * 1000000).toFixed(0)) : 0,
            productsPerSec: Number((this._totalProductsCount / (elapsed / 1000)).toFixed(0)),
            avgResponseTime: Number((elapsed / (this._processedCount ? this._processedCount : 1)).toFixed(0)),
            requestPerSec: Number((this._requestedCount / (elapsed / 1000)).toFixed(0)),
            requestedCount: this._requestedCount,
            processedCount: this._processedCount,
            errorCount: this._errorCount,
            retryCount: this._retryCount,
            retryHaltCount: this._retryHaltCount,
            pendingCategory: this._pendingCategory.length,
            completedCategory: this._completedCategory.length,
            downloadSize: this._downloadSize,
            downloadedSpeed: Number((this._downloadSize / (elapsed / 1000)).toFixed(0)),
            info: {
                pendingCategories: this._pendingCategory,
                completedCategories: this._completedCategory
            }
        }
        if (!showAsNumbers) {
            Object.entries(stats).forEach(([key, value]) => {
                if (statsFormats[key]) {
                    if (typeof statsFormats[key] === 'function') {
                        stats[key] = statsFormats[key](value)
                    }
                    else
                        stats[key] = numeral(value).format(statsFormats[key])
                }
            })
        }
        return stats
    }
    /**
     * 
     * @param categoriesToScrape 
     */
    async start(categoriesToScrape: string[] = []): Promise<string> {
        if (this._status === ScraperStatus.INPROGRESS || this._status === ScraperStatus.PAUSED)
            return Promise.reject({
                currentStaus: this._status,
                message: 'Scraping already started. Check the status before start new scraping.'
            })
        this._startTime = new Date()
        this._status = ScraperStatus.INPROGRESS
        const feedUrl = `${this._baseUrl}/affiliate/api/${this._affiliateId}.json`

        try {
            const { data: feedListing } = await this._getData(feedUrl)
            const categoryListing: any = {}
            eachDeep(feedListing, (value: any, key: string, parent: { resourceName: string }) => {
                if (key === 'get') {
                    const resourceName: string = parent.resourceName
                    categoryListing[resourceName] = value
                    const pendingCategoryInfo: PendingCategoryInfo = {
                        category: resourceName,
                        startTime: new Date(),
                        noOfPages: 0,
                        elapsed: 0,
                        totalProducts: 0
                    }
                    if (categoriesToScrape.length) {
                        if (categoriesToScrape.includes(resourceName)) {
                            this._pendingCategory.push(pendingCategoryInfo)
                            this._enqueue({ url: value, pageNo: 1, category: resourceName, retryCount: 0 })
                        }
                    } else {
                        this._pendingCategory.push(pendingCategoryInfo)
                        this._enqueue({ url: value, pageNo: 1, category: resourceName, retryCount: 0 })
                    }
                }
            })
            while (!this._queue.idle()) {
                await sleep(1000)
            }
            this._endTime = new Date()
            this._status = ScraperStatus.FINISHED
            const finishedInfo: FinishedInfo = { message: 'Scraping Completed', totalRequest: this._processedCount }
            this.emit('finished', finishedInfo)
            return Promise.resolve('Scraping Completed.')
        } catch (errorObj) {
            this._errorCount++
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
            this._errorCount++
            const { status, statusText } = errorObj.response || { status: -1, statusText: 'ERROR' }
            const { code: errorCode } = errorObj
            if (params.retryCount < 10 && (errorCode || status >= 500)) {
                const retryParams: EnqueuePrams = { ...params, retryCount: params.retryCount + 1 }
                this._enqueue(retryParams)
                const retryData: RetryInfo = { ...retryParams, status, statusText, errorCode }
                this.emit('retry', retryData)
                this._retryCount++
            } else {
                const retryData: RetryInfo = { ...params, status, statusText, errorCode }
                this.emit('retryHalted', retryData)
                this._retryHaltCount++
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
            const categoryStats: PendingCategoryInfo = this._pendingCategory.filter(item => item.category === completedResponse.category)[0]
            if (apiData.products.length) {
                this._totalProductsCount += apiData.products.length
                this._pendingCategory.forEach((item: PendingCategoryInfo) => {
                    if (item.category === categoryStats.category) {
                        item.elapsed = new Date().getTime() - categoryStats.startTime.getTime()
                        item.totalProducts += apiData.products.length
                        item.noOfPages += 1
                    }
                })
                this.emit('data', {
                    url,
                    apiData,
                    category: completedResponse.category,
                    pageNo: completedResponse.pageNo,
                    retryCount: completedResponse.retryCount
                })
            }
            if (apiData.nextUrl) {
                if (this._maxPage === 0 || completedResponse.pageNo < this._maxPage)
                    this._enqueue({ url: apiData.nextUrl, category: completedResponse.category, pageNo: completedResponse.pageNo + 1, retryCount: 0 })
            }
            else {
                const elapsed = new Date().getTime() - categoryStats.startTime.getTime()
                const completedInfo: CategoryInfo = {
                    category: completedResponse.category,
                    noOfPages: completedResponse.pageNo,
                    totalProducts: apiData.products.length + ((completedResponse.pageNo - 1) * 500),
                    elapsed
                }
                this._pendingCategory = this._pendingCategory.filter(item => item.category !== completedResponse.category)
                this._completedCategory.push(completedInfo)
                this.emit('categoryCompleted', completedInfo)
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
            this._downloadSize += JSON.stringify(apiData).length + JSON.stringify(headers).length
            this.emit('response', responseInfo)
            return Promise.resolve(responseInfo)
        } catch (errorObj) {
            return Promise.reject(errorObj)
        }
    }
}
