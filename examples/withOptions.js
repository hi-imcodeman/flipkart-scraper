// const { FlipkartScraper } = require('flipkart-scraper')
const {
    FlipkartScraper
} = require('../dist/index')


const scraper = new FlipkartScraper(
    process.env.FK_AFFILIATE_ID,
    process.env.FK_AFFILIATE_TOKEN, {
        concurrency: 5, // 5 parallel requests
        maxRequest: 1000, // only 1000 request to Flipkart affiliate server
        maxPage: 10 // only scarape 10 pages(max) per category
    }
)

scraper.on('data', (data) => {
    console.log({
        _time: new Date(),
        productsCount: data.apiData.products.length,
        category: data.category,
        pageNo: data.pageNo
    });
})
scraper.on('completed', info => {
    console.log('Completed:', info)
})
scraper.on('finished', info => {
    console.log('Scraping finished:', info)
})
scraper.on('error', error => {
    console.error(error);

})
scraper.start().catch(err => {})