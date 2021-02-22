// const { FlipkartScraper } = require('flipkart-scraper')
const {
    FlipkartScraper
} = require('../dist/index')

const scraper = new FlipkartScraper(
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
scraper.on('categoryCompleted', info => {
    console.log('Completed:', info)
})
scraper.on('retry', retryInfo => {
    console.log('Retry:', retryInfo)
})
scraper.on('retryHalted', retryHaltedInfo => {
    console.log('Retry Halted:', retryHaltedInfo)
})
scraper.on('finished', info => {
    console.log('Scraping finished:', info)
})
scraper.on('error', error => {
    console.error(error);
})

scraper.start().catch(console.error)

// To get stats of the scraper
setInterval(() => {
    console.log(JSON.stringify(scraper.stats(), null, 2))
}, 1000)
