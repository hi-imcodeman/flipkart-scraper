import { FlipkartScraper } from './index'
jest.setTimeout(999999)

describe('Flipkart Scraper', () => {
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
