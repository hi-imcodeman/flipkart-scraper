// const flipkartScraper = require('flipkart-scraper').default
const flipkartScraper = require('../dist/index').default

const scraper = new flipkartScraper(
    process.env.FK_AFFILIATE_ID,
    process.env.FK_AFFILIATE_TOKEN)

scraper.on('data', (data) => {
    console.log({
        _time: new Date(),
        productsCount: data.apiData.products.length,
        category: data.category,
        pageNo: data.pageNo
    });
})
scraper.on('response', response => {
    console.log('onResponse:', response.duration)
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