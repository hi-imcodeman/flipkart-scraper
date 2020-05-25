# Flipkart Scraper ![](https://github.com/hi-imcodeman/flipkart-scraper/workflows/CI/badge.svg)

This package will help us to scrape all Flipkart products through Flipkart affiliate API

# Installation

Install using 'npm'

```sh
npm i flipkart-scraper
```

Install using 'yarn'

```sh
yarn add flipkart-scraper
```

# Usage

```javascript
import flipkartScraper from "flipkart-scraper";

const scraper = new flipkartScraper(
  "<Affiliate-Id-Here>",
  "<Affiliate-Token-Here>"
);

// 'response' event handler
scraper.on("response", (response) => {
  console.log(response);
});

// 'products' event handler
scraper.on("products", (data) => {
  console.log(data.products.length);
});

// Error handler
scraper.on("error", (error) => {
  console.error(error);
});

// Start the scraper
scraper.start();
```
