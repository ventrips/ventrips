import * as puppeteer from 'puppeteer';
import * as moment from 'moment';
import * as _ from 'lodash';
const Utils = require('./utils');
const GoogleTrends = require('google-trends-api');

// Step 1: Get Tomorrow's Upcoming Stock Earnings
exports.getSeekingAlphaEarningsDate = async function(request: any, response: any, useMock: boolean = false): Promise<Array<any>>  {
    if (useMock) {
        return require('./../mocks/predict/seeking-alpha-earnings-date.json');
    }

    const results: Array<any> = [];
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.goto(`https://seekingalpha.com/earnings/earnings-calendar`, { waitUntil: 'networkidle0' })

    const sections = await page.$$('.earningsTable tbody tr');

    for (const section of sections) {
        const releaseDate = await section.$eval(
            '.release-date',
            (item: any) => item.innerText.trim().replace(/\n/g, ' '),
        );
        if (_.isEqual(releaseDate, moment(new Date()).add(1,'days').format('L'))) {
            const releaseTime = await section.$eval(
                '.release-time',
                (item: any) => item.innerText.trim().replace(/\n/g, ' '),
            );
            const url = await section.$eval(
                '.sym',
                (item: any) => `https://seekingalpha.com${item.getAttribute('href')}`
            );
            const symbol = await section.$eval(
                '.sym',
                (item: any) => item.innerText.trim().replace(/\n/g, ' '),
            );
            const company = await section.$eval(
                '.ticker-name',
                (item: any) => item.innerText.trim().replace(/\n/g, ' '),
            );
            const obj = {
                url,
                symbol,
                company,
                releaseDate,
                releaseTime,
                source: 'seeking-alpha'
            };
            results.push(obj);
        }
    }
    return results;
}

// Step 2: Get Trending Stocks
exports.getGoogleTrends = async function(request: any, response: any, tickers: Array<any> = [], useMock: boolean = false): Promise<Array<any>>  {
    const symbols: Array<string> = _.slice(_.map(tickers, (ticker) => _.get(ticker, ['symbol'])), 0, 5);

    let results;
    if (useMock) {
        results = require('./../mocks/predict/google-trends.json');
    } else {
        const unparsedResults = await GoogleTrends.interestOverTime({keyword: symbols, startTime: moment(new Date()).subtract(7, 'days').toDate() })
        results = JSON.parse(unparsedResults);
    }

    const timelineData = results.default.timelineData;
    const data: any = {
        symbols,
        timelineData
    };

    return data;
}

// Step 3: Get Trending StockTwits Stocks
exports.getStockTwitsTickers = function(request: any, response: any, useMock: boolean = false): Promise<any> {
    if (useMock) {
        return require('./../mocks/predict/stock-twits-tickers.json');
    }

    const Request = require('request');
    return new Promise((resolve,reject) => {
        Request('https://api.stocktwits.com/api/2/trending/symbols.json', (error: any, response: any, body: any) => {
          if (response) {
            return resolve(_.map(JSON.parse(body).symbols, (stock) => {
                stock.source = 'stock-twits';
                return stock;
            }));
          }
          if (error) {
            return reject(error);
          }
        });
    });
}

exports.getYahooTickers = async function(request: any, response: any, useMock: boolean = false): Promise<any> {
    if (useMock) {
        return require('./../mocks/predict/yahoo-tickers.json');
    }

    const yahooTrends = await Utils.puppeteerScrape(
        'yahoo',
        'https://finance.yahoo.com/trending-tickers',
        'https://finance.yahoo.com',
        'tr.BdT',
        {
            url: '.data-col0 a',
            company: '.data-col1',
            symbol: '.data-col0',
            change: '.data-col5'
        }
    );

    return yahooTrends;
}

exports.getSeekingAlphaEarningsNews = async function(request: any, response: any, useMock: boolean = false): Promise<any> {
    if (useMock) {
        return require('./../mocks/predict/seeking-alpha-earnings-news.json');
    }

    const seekingAlphaEarningsNews = await Utils.puppeteerScrape(
        'seeking-alpha',
        'https://seekingalpha.com/earnings/earnings-news',
        'https://seekingalpha.com/news',
        '.media-body',
        {
            url: '.article-link',
            title: '.article-link',
            date: '.article-desc',
            description: '.item-summary',
        }
    );

    return seekingAlphaEarningsNews;
}

exports.getBusinessInsiderNews = async function(request: any, response: any, useMock: boolean = false): Promise<any> {
    if (useMock) {
        return require('./../mocks/predict/business-insider-news.json');
    }

    const businessInsiderNews = await Utils.puppeteerScrape(
        'business-insider',
        'https://markets.businessinsider.com/stocks/news',
        'https://markets.businessinsider.com',
        '.further-news-container',
        {
            url: '.news-link',
            title: '.news-link',
            date: '.source-and-publishdate'
        }
    );

    return businessInsiderNews;
}