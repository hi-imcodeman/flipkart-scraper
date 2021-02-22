import { ScraperStatus } from './enums'
import { StringOrNumber } from './typeAliases'

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
export interface CompletedResponse {
    httpResponse: ResponseObject
    category: string
    pageNo: number
    retryCount: number
}

/**
 * @internal
 */
export interface EnqueuePrams {
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

export interface CategoryInfo {
    category: string
    noOfPages: number
    totalProducts: number
    elapsed: number
}

export interface PendingCategoryInfo {
    category: string
    startTime: Date,
    noOfPages: number,
    elapsed: number,
    totalProducts: number
}
export interface FinishedInfo {
    message: string
    totalRequest: number
}

export interface RetryInfo extends EnqueuePrams {
    status: number
    statusText: string
    errorCode: undefined | string
}

export interface StatsInfo {
    pendingCategories: PendingCategoryInfo[]
    completedCategories: CategoryInfo[]
}

export interface StatsData {
    startTime: Date | undefined
    endTime: Date | undefined
    status: ScraperStatus
    concurrency: number
    waitingRequests: number
    productsCount: StringOrNumber
    elapsed: StringOrNumber
    durationPerMillionProducts: StringOrNumber
    productsPerSec: StringOrNumber
    avgResponseTime: StringOrNumber
    requestPerSec: StringOrNumber
    requestedCount: StringOrNumber
    processedCount: StringOrNumber
    errorCount: StringOrNumber
    retryCount: StringOrNumber
    retryHaltCount: StringOrNumber
    pendingCategory: number
    completedCategory: number
    downloadSize: StringOrNumber
    downloadedSpeed: StringOrNumber
    info: StatsInfo
}
