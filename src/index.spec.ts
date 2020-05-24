import flipkartScraper from './index'
jest.setTimeout(999999)

describe('Flipkart Scraper', () => {
  it('should get response from the flipkart affiliate API', async (done) => {
    const scraper = new flipkartScraper(
      "hi-imcodeman",
      "f44755229c5f11eabb370242ac130002",
      {
        maxRequest: 100,
        concurrency: 5
      }
    );
    const responseSpy = jest.fn()
    scraper.on('response', responseSpy)
    scraper.on('products', (products) => {
      console.log(products.products.length);
    })
    scraper.on('error', (error) => {
      console.error(error);
    })
    await scraper.start();
    expect(responseSpy).toBeCalled()
    done()
  })
})
