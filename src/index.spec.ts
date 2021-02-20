import { FlipkartScraper } from './index'

jest.setTimeout(999999)

describe('Flipkart Scraper', () => {
  afterEach(() => {
    jest.clearAllMocks();
  })
  it('should get response from the flipkart affiliate API', async (done) => {
    const scraper = new FlipkartScraper(
      "hi-imcodeman",
      "f44755229c5f11eabb370242ac130002"
    );
    const responseSpy = jest.fn()
    const dataSpy = jest.fn()
    const errorSpy = jest.fn()
    scraper.on('response', responseSpy)
    scraper.on('data', dataSpy)
    scraper.on('error', errorSpy)
    await scraper.start();
    expect(responseSpy).toBeCalledTimes(6)
    expect(dataSpy).toBeCalledTimes(4)
    expect(errorSpy).toBeCalledTimes(23)
    done()
  })

  it('should throw error when stating the scraper while scraping inprogress', async (done) => {
    const scraper = new FlipkartScraper(
      "hi-imcodeman",
      "f44755229c5f11eabb370242ac130002"
    );
    const expectedErrorObj = {
      currentStaus: 'inprogress',
      message: 'Scraping already started. Check the status before start new scraping.'
    }
    const errorSpy = jest.fn()
    scraper.on('error', errorSpy)
    scraper.start();
    scraper.start().catch(error => {
      expect(error).toEqual(expectedErrorObj)
      done()
    });
  })

  it('should scrape only number of endpoints based on maxRequest', async (done) => {
    const scraper = new FlipkartScraper(
      "hi-imcodeman",
      "f44755229c5f11eabb370242ac130002",
      { maxRequest: 1 }
    );
    const responseSpy = jest.fn()
    const dataSpy = jest.fn()
    const errorSpy = jest.fn()
    scraper.on('response', responseSpy)
    scraper.on('data', dataSpy)
    scraper.on('error', errorSpy)
    await scraper.start();
    expect(responseSpy).toBeCalledTimes(2)
    expect(dataSpy).toBeCalledTimes(1)
    expect(errorSpy).not.toBeCalled()
    done()
  })

  it('should get response from the flipkart affiliate API only for specific category with maxPage', async (done) => {
    const scraper = new FlipkartScraper(
      "hi-imcodeman",
      "f44755229c5f11eabb370242ac130002",
      { maxPage: 2 }
    );
    const responseSpy = jest.fn()
    const dataSpy = jest.fn()
    const errorSpy = jest.fn()
    scraper.on('response', responseSpy)
    scraper.on('data', dataSpy)
    scraper.on('error', errorSpy)
    await scraper.start(['televisions']);
    expect(responseSpy).toBeCalledTimes(3)
    expect(dataSpy).toBeCalledTimes(2)
    expect(errorSpy).toBeCalledTimes(0)
    expect(dataSpy).toHaveBeenNthCalledWith(2, {
      url: expect.anything(),
      apiData: expect.anything(),
      category: 'televisions',
      pageNo: 2,
      retryCount: 0
    });
    done()
  })

  it('should throw error for page 3 of television category', async (done) => {
    const scraper = new FlipkartScraper(
      "hi-imcodeman",
      "f44755229c5f11eabb370242ac130002"
    );
    const responseSpy = jest.fn()
    const dataSpy = jest.fn()
    const errorSpy = jest.fn()
    const retrySpy = jest.fn()
    const retryHaltedSpy = jest.fn()
    scraper.on('response', responseSpy)
    scraper.on('data', dataSpy)
    scraper.on('error', errorSpy)
    scraper.on('retry', retrySpy)
    scraper.on('retryHalted', retryHaltedSpy)
    await scraper.start(['televisions']);
    expect(responseSpy).toBeCalledTimes(3)
    expect(dataSpy).toBeCalledTimes(2)
    expect(retrySpy).toBeCalledTimes(10)
    expect(errorSpy).toBeCalledTimes(11)
    expect(retryHaltedSpy).toBeCalledTimes(1)
    done()
  })
  it('should retries on 500 internal server error', async (done) => {
    const scraper = new FlipkartScraper(
      "hi-imcodeman",
      "f44755229c5f11eabb370242ac130002"
    );
    const responseSpy = jest.fn()
    const dataSpy = jest.fn()
    const errorSpy = jest.fn()
    const retrySpy = jest.fn()
    const retryHaltedSpy = jest.fn()
    scraper.on('response', responseSpy)
    scraper.on('data', dataSpy)
    scraper.on('error', errorSpy)
    scraper.on('retry', retrySpy)
    scraper.on('retryHalted', retryHaltedSpy)
    await scraper.start(['mobiles']);
    expect(responseSpy).toBeCalledTimes(1)
    expect(dataSpy).toBeCalledTimes(0)
    expect(retrySpy).toBeCalledTimes(10)
    expect(errorSpy).toBeCalledTimes(11)
    expect(retryHaltedSpy).toBeCalledTimes(1)
    done()
  })
  it('should not retry on 410 HTTP status', async (done) => {
    const scraper = new FlipkartScraper(
      "hi-imcodeman",
      "f44755229c5f11eabb370242ac130002"
    );
    const responseSpy = jest.fn()
    const dataSpy = jest.fn()
    const errorSpy = jest.fn()
    const retrySpy = jest.fn()
    const retryHaltedSpy = jest.fn()
    scraper.on('response', responseSpy)
    scraper.on('data', dataSpy)
    scraper.on('error', errorSpy)
    scraper.on('retry', retrySpy)
    scraper.on('retryHalted', retryHaltedSpy)
    await scraper.start(['laptops']);
    expect(responseSpy).toBeCalledTimes(1)
    expect(dataSpy).toBeCalledTimes(0)
    expect(retrySpy).toBeCalledTimes(0)
    expect(errorSpy).toBeCalledTimes(1)
    expect(retryHaltedSpy).toBeCalledTimes(1)
    done()
  })
  it('should return expected stats in readable format', async (done) => {
    const expectedStats = {
      "startTime": expect.any(Date),
      "endTime": expect.any(Date),
      "status": "finished",
      "concurrency": 2,
      "waitingRequests": 0,
      "productsCount": "20.00",
      "elapsed": expect.any(String),
      "durationPerMillionProducts": expect.any(String),
      "productsPerSec": "20.00 products/sec",
      "avgResponseTime": "36ms",
      "requestPerSec": "28/sec",
      "requestedCount": "28.00",
      "processedCount": "28.00",
      "errorCount": "23.0",
      "retryCount": "20.0",
      "retryHaltCount": "3.0",
      "pendingCategory": 3,
      "completedCategory": 1,
      "downloadSize": "61.10KB",
      "downloadedSpeed": expect.any(String),
      "info": {
        "pendingCategories": [
          "televisions",
          "mobiles",
          "laptops"
        ],
        "completedCategories": [
          {
            "category": "food_nutrition",
            "noOfPages": 3,
            "totalProducts": 1000
          }
        ]
      }
    }
    const scraper = new FlipkartScraper(
      "hi-imcodeman",
      "f44755229c5f11eabb370242ac130002"
    );
    scraper.on('finished', () => {
      const stats = scraper.stats()
      expect(stats).toEqual(expectedStats)
      done()
    })
    scraper.on('error', jest.fn)
    await scraper.start();
  })
  it('should return expected stats in numbers', async (done) => {
    const expectedStats = {
      "startTime": expect.any(Date),
      "endTime": expect.any(Date),
      "status": "finished",
      "concurrency": 2,
      "waitingRequests": 0,
      "productsCount": 20,
      "elapsed": expect.any(Number),
      "durationPerMillionProducts": expect.any(Number),
      "productsPerSec": 20,
      "avgResponseTime": 36,
      "requestPerSec": 28,
      "requestedCount": 28,
      "processedCount": 28,
      "errorCount": 23,
      "retryCount": 20,
      "retryHaltCount": 3,
      "pendingCategory": 3,
      "completedCategory": 1,
      "downloadSize": 61103,
      "downloadedSpeed": expect.any(Number),
      "info": {
        "pendingCategories": [
          "televisions",
          "mobiles",
          "laptops"
        ],
        "completedCategories": [
          {
            "category": "food_nutrition",
            "noOfPages": 3,
            "totalProducts": 1000
          }
        ]
      }
    }
    const scraper = new FlipkartScraper(
      "hi-imcodeman",
      "f44755229c5f11eabb370242ac130002"
    );
    scraper.on('finished', () => {
      const stats = scraper.stats(true)
      expect(stats).toEqual(expectedStats)
      done()
    })
    scraper.on('error', jest.fn)
    await scraper.start();
  })
  it('should return expected stats in numbers before finished', async (done) => {
    const expectedStats = {
      "startTime": expect.any(Date),
      "status": "inprogress",
      "concurrency": 2,
      "waitingRequests": 0,
      "productsCount": 20,
      "elapsed": expect.any(Number),
      "durationPerMillionProducts": expect.any(Number),
      "productsPerSec": expect.any(Number),
      "avgResponseTime": 4,
      "requestPerSec": expect.any(Number),
      "requestedCount": 28,
      "processedCount": 28,
      "errorCount": 23,
      "retryCount": 20,
      "retryHaltCount": 3,
      "pendingCategory": 3,
      "completedCategory": 1,
      "downloadSize": 61103,
      "downloadedSpeed": expect.any(Number),
      "info": {
        "pendingCategories": [
          "televisions",
          "mobiles",
          "laptops"
        ],
        "completedCategories": [
          {
            "category": "food_nutrition",
            "noOfPages": 3,
            "totalProducts": 1000
          }
        ]
      }
    }
    const scraper = new FlipkartScraper(
      "hi-imcodeman",
      "f44755229c5f11eabb370242ac130002"
    );
    scraper.on('error', jest.fn)
    const statsBeforeStart = scraper.stats()
    expect(statsBeforeStart.startTime).toBeUndefined()
    expect(statsBeforeStart.status).toBe('ready')
    scraper.start();
    setTimeout(() => {
      const stats = scraper.stats(true)
      expect(stats).toEqual(expectedStats)
      done()
    }, 100)
  })
  it('should throw 401 HTTP error on invalid affiliate id/token', async (done) => {
    const scraper = new FlipkartScraper(
      "invalidId",
      "someToken"
    );
    const responseSpy = jest.fn()
    const dataSpy = jest.fn()
    const errorSpy = jest.fn()
    scraper.on('response', responseSpy)
    scraper.on('data', dataSpy)
    scraper.on('error', errorSpy)
    try {
      await scraper.start();
    }
    catch (error) {
      expect(responseSpy).toBeCalledTimes(0)
      expect(dataSpy).toBeCalledTimes(0)
      expect(errorSpy).toBeCalledTimes(1)
      done()
    }
  })
})
