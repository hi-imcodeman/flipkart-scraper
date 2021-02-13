[![NPM](https://nodei.co/npm/flipkart-scraper.png)](https://nodei.co/npm/flipkart-scraper/)

# Flipkart Scraper ![](https://github.com/hi-imcodeman/flipkart-scraper/workflows/CI/badge.svg)

This package will help us to scrape all Flipkart products through Flipkart affiliate API.

Please refer [API Documentation](https://hi-imcodeman.github.io/flipkart-scraper) here.

See the [Examples](https://github.com/hi-imcodeman/flipkart-scraper/tree/master/examples) here

## Installation

Install using 'npm'

```sh
npm i flipkart-scraper
```

Install using 'yarn'

```sh
yarn add flipkart-scraper
```

## Usage

```javascript
import { FlipkartScraper } from "flipkart-scraper";

const scraper = new FlipkartScraper(
  "<Affiliate-Id-Here>",
  "<Affiliate-Token-Here>"
);

// 'data' event handler
scraper.on("data", (data) => {
  console.log(data.products.length);
});

// Start the scraper
scraper.start();
```

## Class: FlipkartScraper

- extends [EventEmitter](https://nodejs.org/api/events.html#events_class_eventemitter)

This module will help us to scrape all the Flipkart products.

### constructor(affiliateId, affiliateToken, [options])

This will create instance of the `FlipkartScraper` class with required authentication params.

- options {object}
  - `concurrency?` {number} Number for parallel processing in the queue, Default set to `2`
  - `maxRequest?` {number} Maximum request to Flipkart affliate server, Default set to `0` - means unlimited
  - `maxPage?` {number} Maximum number of pages to scrape per category, Default set to `0` - means unlimited

**Example**

```javascript
const scraper = new FlipkartScraper(
  "<Affiliate-Id-Here>",
  "<Affiliate-Token-Here>",
  {
    /**
     * It will make 5 parallel request to Flipkart.
     * This is optional param, default is set to 2
     **/
    concurrency: 5,
    /**
     * It will make only 500 request to Flipkart. After that program ends.
     * This is optional param, default is set to 0 means unlimited
     **/
    maxRequest: 500,
    /**
     * Maximum 3 request per category
     **/
    maxPage: 3,
  }
);
```

### scraper.start([categoriesToScrape])

This method will start scraping through Flipkart affiliate API.

- `categoriesToScrape?` {string[]} Pass the list of categories that you want to scrape. Default set to `[]` which means all categories.

**Example**

```javascript
scraper.start(["telivision", "mobiles"]); // It will scrape only specified categories
```

### events: 'response'

Emitted when successful HTTP response from the Flipkart Affiliate server.

**Example**

```javascript
// 'response' event handler
scraper.on("response", (response) => {
  console.log(response);
});
```

### events: 'data'

Emitted when products returned from Flipkart affiliate API.

**Example**

```javascript
// 'data' event handler
scraper.on("data", (data) => {
  console.log(data.apiData.products);
});
```

### events: 'completed'

Emitted when all products scraped by category.

**Example**

```javascript
// 'completed' event handler
scraper.on("completed", (info) => {
  console.log(info);
});
```

### events: 'finished'

Emitted when scraper finished

**Example**

```javascript
// 'finished' event handler
scraper.on("finished", (info) => {
  console.log(info);
});
```

### events: 'error'

Emitted if any errors occured.

**Example**

```javascript
// Error handler
scraper.on("error", (error) => {
  console.error(error);
});
```
