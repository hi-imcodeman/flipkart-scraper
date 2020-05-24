const categoryListing = require('./fixtures/categoryListing.json')
const c1p1 = require('./fixtures/c1p1.json')
const c1p2 = require('./fixtures/c1p2.json')
const c2p1 = require('./fixtures/c2p1.json')
const c2p2 = require('./fixtures/c2p2.json')
const axios: any = jest.genMockFromModule('axios')

axios.get = (url: string, config: object) => {
    let response = {
        status: 200,
        statusText: 'OK',
        data: null,
        headers: {},
        config,
    }
    switch (url) {
        case 'https://affiliate-api.flipkart.net/affiliate/api/hi-imcodeman.json':
            response.data = categoryListing
            return Promise.resolve(response)
        case 'https://affiliate-api.flipkart.net/affiliate/1.0/feeds/hi-imcodeman/category/c1p1.json':
            response.data = c1p1
            return Promise.resolve(response)
        case 'https://affiliate-api.flipkart.net/affiliate/1.0/feeds/hi-imcodeman/category/c1p2.json':
            response.data = c1p2
            return Promise.resolve(response)
        case 'https://affiliate-api.flipkart.net/affiliate/1.0/feeds/hi-imcodeman/category/c2p1.json':
            response.data = c2p1
            return Promise.resolve(response)
        case 'https://affiliate-api.flipkart.net/affiliate/1.0/feeds/hi-imcodeman/category/c2p2.json':
            response.data = c2p2
            return Promise.resolve(response)
        default:
            return Promise.reject('Network Error')
    }
}

export default axios
