import * as functions from 'firebase-functions';
// import * as admin from 'firebase-admin';
import * as _ from 'lodash';
import { cors } from './utils';
const RequestPromise = require('request-promise');
const UserAgent = require('user-agents');

// import { getSingleYahooFinanceAPI } from './yahoo-finance-api';
// const db = admin.firestore();

export const getTrendingTickerSymbols = functions.runWith({ timeoutSeconds: 540, memory: '512MB' }).https.onRequest(async (request, response): Promise<any> => {
    cors(request, response);
    const defaultUserAgentOptions: object = {
        headers: {
            'User-Agent': ((new UserAgent()).data).toString()
        },
        json: true
    };
    try {
        let data: any;

        /* Step 1: Get all ticker symbols in US Exchange from Finn Hub */
        const finnHubOptions: object = _.assign({
            uri: 'https://finnhub.io/api/v1/stock/symbol',
            qs: {
                exchange: 'US',
                token: 'brno9hfrh5reu6jtc7k0'
            }
        }, defaultUserAgentOptions);
        const finnHubResponse = await RequestPromise(finnHubOptions);
        const finnHubAllTickerSymbols: Array<string> = _.map(finnHubResponse, (item: any) => item.symbol);

        /* Mock Data */
        // const finnHubAllTickerSymbols = ['SPXL', 'SPY'];
        // data = finnHubAllTickerSymbols;

        /* Step 2: Get all yahoo data stock information of every ticker symbol from Yahoo Finance */
        let yahooFinanceResponse: Array<object> = [];
        const tickerSymbolChunks: any = _.chunk(finnHubAllTickerSymbols, 1500);
        for (const tickerSymbolChunk of tickerSymbolChunks) {
            const yahooFinanceOptions: object = _.assign({
                uri: 'https://query2.finance.yahoo.com/v7/finance/quote',
                qs: {
                    symbols: _.toString(tickerSymbolChunk),
                }
            }, defaultUserAgentOptions);

            let yahooFinanceChunkResponse: Array<object> = await RequestPromise(yahooFinanceOptions);
            yahooFinanceChunkResponse = _.get(yahooFinanceChunkResponse, ['quoteResponse', 'result'], []);
            yahooFinanceResponse = _.concat(yahooFinanceResponse, yahooFinanceChunkResponse);
        };
        data = yahooFinanceResponse;

        /* Mock Data */
        // data = require('./../mocks/ventrips/yahoo-finance.json');

        /* Step 3: Filter stocks with custom logic */
        const minPrice: number = 2;
        const maxPrice: number = 10;
        const minFiftyTwoWeekHighChangePercent: number = -0.30;
        const minFiftyTwoWeekLow: number = 1;
        const minRegularMarketVolume: number = 5000000;
        const minThreshold: number = 0.75;
        const minMarketCap: number = 1000000000;

        data = _.filter(data, (item: object) => {
            const regularMarketPrice: number = _.get(item, ['regularMarketPrice']);

            const regularMarketVolume: number = _.get(item, ['regularMarketVolume']);
            const averageDailyVolume10Day: number = _.get(item, ['averageDailyVolume10Day']);
            const averageDailyVolume3Month: number = _.get(item, ['averageDailyVolume3Month']);

            const regularMarketChangePercent: number = _.get(item, ['regularMarketChangePercent']);
            const fiftyDayAverageChangePercent: number = _.get(item, ['fiftyDayAverageChangePercent']);
            const twoHundredDayAverageChangePercent: number = _.get(item, ['twoHundredDayAverageChangePercent']);

            const fiftyTwoWeekLowChangePercent: number = _.get(item, ['fiftyTwoWeekLowChangePercent']);
            const fiftyTwoWeekHighChangePercent: number = _.get(item, ['fiftyTwoWeekHighChangePercent']);

            const fiftyDayAverage: number = _.get(item, ['fiftyDayAverage']);
            const twoHundredDayAverage: number = _.get(item, ['twoHundredDayAverage']);

            const fiftyTwoWeekLow: number = _.get(item, ['fiftyTwoWeekLow']);
            const fiftyTwoWeekHigh: number = _.get(item, ['fiftyTwoWeekHigh']);

            const sharesOutstanding: number = _.get(item, ['sharesOutstanding']);

            const marketCap: number = _.get(item, ['marketCap']);

            // Condition #1: Price must be within target price range
            return (regularMarketPrice >= minPrice && regularMarketPrice <= maxPrice)
            // Condition #2: 10-Day Average Volume must be greater than 3-Month Average Volume
            && (averageDailyVolume10Day >= averageDailyVolume3Month)
            // Condition #3: 50-Day Average Change Percent, 200-Day Average Change Percent must be greater than 0
            && ((fiftyDayAverageChangePercent >= 0) && (twoHundredDayAverageChangePercent >= 0))
            // Condition #4: 50-Day Average must be higher than 200-Day Average
            && (fiftyDayAverage >= twoHundredDayAverage)
            // Condition #5: 52-Week High Change Percent must be greater than minFiftyTwoWeekHighChangePercent
            && (fiftyTwoWeekHighChangePercent >= minFiftyTwoWeekHighChangePercent)
            // Condition #6: 52-Week Low Price must be greater than minFiftyTwoWeekLow
            && (fiftyTwoWeekLow >= minFiftyTwoWeekLow)
            // Condition #7: All Volumes must be greater than minRegularMarketVolume
            && ((regularMarketVolume >= minRegularMarketVolume) && ((averageDailyVolume10Day >= minRegularMarketVolume) || (averageDailyVolume3Month >= minRegularMarketVolume)))
            // Condition #8: Regular Market Volume must be close to 10-Day Volume Average OR 3-Month Volume Average
            && (((regularMarketVolume * minThreshold) >= averageDailyVolume10Day) || ((regularMarketVolume * minThreshold) >= averageDailyVolume3Month))
            // // Condition #9: Market Cap must be greater than minMarketCap
            // && (marketCap >= minMarketCap)
        });

        response.send({
            results: _.get(data, ['length'], 0),
            symbols: _.map(data, (item: object) => _.get(item, ['symbol'])),
            data
        });
    } catch {
        response.status(500).send('Internal Server Error');
    }
});