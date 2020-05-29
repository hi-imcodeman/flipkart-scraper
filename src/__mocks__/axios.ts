import categoryListing from './fixtures/categoryListing.json'
import c1p1 from './fixtures/c1p1.json'
import c1p2 from './fixtures/c1p2.json'
import c2p1 from './fixtures/c2p1.json'
import c2p2 from './fixtures/c2p2.json'
import axios, { AxiosRequestConfig } from 'axios'
const mockAxios: any = jest.genMockFromModule('axios')

mockAxios.get = (url: string, config: AxiosRequestConfig) => {
    const response = {
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
