# Flipkart Scraper ![](https://github.com/hi-imcodeman/flipkart-scraper/workflows/CI/badge.svg)

This package will help us to scrape all Flipkart products through Flipkart affiliate API

# Installation

```sh
npm install flipkart-scraper
```
or
```sh
yarn add flipkart-scraper
```

# Usage

```javascript
import flipkartScraper from 'flipkart-scraper';

const scraper = new flipkartScraper(
    "<Affiliate-Id-Here>",
    "<Affiliate-Token-Here>"
);

// 'response' event handler
scraper.on('response', (response) => {
    console.log(products);
});

// 'products' event handler
scraper.on('products', (products) => {
    console.log(products.products.length);
});

// Error handler
scraper.on('error', (error) => {
    console.error(error);
});

// Start the scraper
scraper.start();
```
