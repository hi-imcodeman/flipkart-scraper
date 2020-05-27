import axios from 'axios'
import { EventEmitter } from 'events'
import fastq from 'fastq'
import { sleep } from './util'

const eachDeep = require('deepdash/eachDeep')

interface ResponseObject {
    url: string
    statusCode: number
    statusText: string
    headers: object
    data: any
}
interface CompletedResponse {
    httpResponse: ResponseObject
    category: string
    pageNo: number
}

interface EnqueuePrams {
    url: string
    category: string
    pageNo: number
}

interface ScraperOptions {
    maxRequest?: number
    concurrency?: number
}

export default class FlipkartScraper extends EventEmitter {
    private _affiliateId: string
    private _affiliateToken: string
    private _baseUrl: string = 'https://affiliate-api.flipkart.net'
    private queue: fastq.queue
    private _maxRequest: number
    private _requestedCount: number = 0
    private _concurrency: number
    constructor(affiliateId: string, affiliateToken: string, options: ScraperOptions = {}) {
        super()
        this._affiliateId = affiliateId
        this._affiliateToken = affiliateToken
        this._maxRequest = options.maxRequest || 0
        this._concurrency = options.concurrency || 2
        this.queue = fastq(this._worker.bind(this), this._concurrency)
        this.emit('ready')
    }
    async start(categoriesToScrape: string[] = []): Promise<string> {
        return new Promise(async (resolve) => {
            const feedUrl = `${this._baseUrl}/affiliate/api/${this._affiliateId}.json`
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
            this.emit('completed')
            resolve('Completed')
        })
    }
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
    private _onComplete(error: any, response: CompletedResponse) {
        if (error === null) {
            const { data: apiData, url } = response.httpResponse
            this.emit('data', { url, apiData, category: response.category, pageNo: response.pageNo })
            if (apiData.nextUrl)
                this._enqueue({ url: apiData.nextUrl, category: response.category, pageNo: response.pageNo + 1 })
        } else {
            this.emit('error', error)
        }
    }
    private async _getData(url: string): Promise<ResponseObject> {
        return new Promise(async (resolve, reject) => {
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
                resolve(responseInfo)
            } catch (error) {
                reject(error)
            }
        })
    }
}