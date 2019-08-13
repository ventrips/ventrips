import * as puppeteer from 'puppeteer';
import * as moment from 'moment';
import * as _ from 'lodash';
const GoogleTrends = require('google-trends-api');

// Step 1: Get Tomorrow's Upcoming Stock Earnings
exports.scrapeSeekingAlpha = async function(request: any, response: any, useMock = false): Promise<Array<any>>  {
    if (useMock) {
        const seekingAlphaJSON = require('./../mocks/seeking-alpha.json');
        return seekingAlphaJSON;
    }

    const results: Array<any> = [];
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.goto(`https://seekingalpha.com/earnings/earnings-calendar`, { waitUntil: 'networkidle0' })

    let sections = await page.$$('.earningsTable tbody tr');

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
            const name = await section.$eval(
                '.ticker-name',
                (item: any) => item.innerText.trim().replace(/\n/g, ' '),
            );
            const obj = {
                url,
                symbol,
                name,
                releaseDate,
                releaseTime
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
        results = require('./../mocks/google-trends.json');
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
