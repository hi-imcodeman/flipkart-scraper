import flipkartScraper from './index'
jest.setTimeout(999999)

describe('Flipkart Scraper', () => {
  it('should get response from the flipkart affiliate API', async (done) => {
    const scraper = new flipkartScraper(
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
    expect(responseSpy).toBeCalledTimes(5)
    expect(dataSpy).toBeCalledTimes(4)
    done()
  })

  it('should scrape only number of endpoints based on maxRequest', async (done) => {
    const scraper = new flipkartScraper(
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

  it('should get response from the flipkart affiliate API only for specific category', async (done) => {
    const scraper = new flipkartScraper(
      "hi-imcodeman",
      "f44755229c5f11eabb370242ac130002"
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
    expect(dataSpy).toHaveBeenNthCalledWith(2, {
      url: expect.anything(),
      apiData: expect.anything(),
      category: 'televisions',
      pageNo: 2
    });
    done()
  })

  it('should throw error for page 3 of television category', async (done) => {
    const scraper = new flipkartScraper(
      "hi-imcodeman",
      "f44755229c5f11eabb370242ac130002"
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
    expect(errorSpy).toBeCalledTimes(1)
    done()
  })
})
