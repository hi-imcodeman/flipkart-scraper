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

### scraper.stats(showAsNumbers?=false)

This method will show the stats of scraper. By default stats will come as numerals like (3.1k, 1.45GB)

- `showAsNumbers?` {boolean} Stats will return as number instead of numerals.

**Sample Stats**

```javascript
/*
{
  "startTime": "2021-02-21T08:14:29.445Z",
  "endTime": undefined, // endTime will be available once scraping finished
  "status": "inprogress",
  "concurrency": 30,
  "waitingRequests": 0,
  "productsCount": "19.54k",
  "elapsed": "0:00:06 10ms",
  "durationPerMillionProducts": "0:05:08 558ms",
  "productsPerSec": "3.25k products/sec",
  "avgResponseTime": "147ms",
  "requestPerSec": "7/sec",
  "requestedCount": "43.00",
  "processedCount": "41.00",
  "errorCount": "0.0",
  "retryCount": "0.0",
  "retryHaltCount": "0.0",
  "pendingCategory": 2,
  "completedCategory": 1,
  "downloadSize": "84.78MB",
  "downloadedSpeed": "14.11MB/sec",
  "info": {
    "pendingCategories": [
      {
        "category": "mens_clothing",
        "startTime": "2021-02-21T08:14:29.602Z",
        "noOfPages": 18,
        "elapsed": 5668,
        "totalProducts": 9000
      },
      {
        "category": "mobiles",
        "startTime": "2021-02-21T08:14:29.603Z",
        "noOfPages": 13,
        "elapsed": 5771,
        "totalProducts": 6500
      }
    ],
    "completedCategories": [
      {
        "category": "laptops",
        "noOfPages": 10,
        "totalProducts": 4500,
        "elapsed": 3878
      }
    ]
  }
}
*/
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

### events: 'categoryCompleted'

Emitted when all products scraped for the category.

**Example**

```javascript
// 'categoryCompleted' event handler
scraper.on("categoryCompleted", (completedCategoryInfo) => {
  console.log(completedCategoryInfo);
});
```

### events: 'finished'

Emitted when scraper finished.

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
// Triggered if any error occured
scraper.on("error", (error) => {
  console.error(error);
});
```

### events: 'retry'

Emitted if any retry occured.

**Example**

```javascript
// Triggered if any retry occured
scraper.on("retry", (retryInfo) => {
  console.log(retryInfo);
});
```

### events: 'retryHalted'

Emitted if any retries failed for 10 times.

**Example**

```javascript
// Triggerd when retry failed 10 times
scraper.on("retryHalted", (retryHaltInfo) => {
  console.error(retryHaltInfo);
});
```
