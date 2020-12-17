import * as functions from 'firebase-functions';
// import * as admin from 'firebase-admin';
import * as _ from 'lodash';
import { cors } from './utils';
const RequestPromise = require('request-promise');
const UserAgent = require('user-agents');
const { ExploreTrendRequest } = require('g-trends');
const isBullish = require('is-bullish');

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
        data = _.map(yahooFinanceResponse, (datum: any) => { return { yahooFinance: datum } });

        /* Mock Data */
        // data = require('./../mocks/ventrips/yahoo-finance.json');

        /* Step 3: Filter stocks with custom logic */
        const minPrice: number = 1;
        const maxPrice: number = 20;
        const minFiftyTwoWeekHighChangePercent: number = -0.30;
        const minFiftyTwoWeekLow: number = 1;
        const minRegularMarketVolume: number = 5000000;
        const minThreshold: number = 0.75;
        const minMarketCap: number = 1000000000;

        data = _.filter(data, (item: object) => {
            const regularMarketPrice: number = _.get(item, ['yahooFinance', 'regularMarketPrice']);

            const regularMarketVolume: number = _.get(item, ['yahooFinance', 'regularMarketVolume']);
            const averageDailyVolume10Day: number = _.get(item, ['yahooFinance', 'averageDailyVolume10Day']);
            const averageDailyVolume3Month: number = _.get(item, ['yahooFinance', 'averageDailyVolume3Month']);

            const regularMarketChangePercent: number = _.get(item, ['yahooFinance', 'regularMarketChangePercent']);
            const fiftyDayAverageChangePercent: number = _.get(item, ['yahooFinance', 'fiftyDayAverageChangePercent']);
            const twoHundredDayAverageChangePercent: number = _.get(item, ['yahooFinance', 'twoHundredDayAverageChangePercent']);

            const fiftyTwoWeekLowChangePercent: number = _.get(item, ['yahooFinance', 'fiftyTwoWeekLowChangePercent']);
            const fiftyTwoWeekHighChangePercent: number = _.get(item, ['yahooFinance', 'fiftyTwoWeekHighChangePercent']);

            const fiftyDayAverage: number = _.get(item, ['yahooFinance', 'fiftyDayAverage']);
            const twoHundredDayAverage: number = _.get(item, ['yahooFinance', 'twoHundredDayAverage']);

            const fiftyTwoWeekLow: number = _.get(item, ['yahooFinance', 'fiftyTwoWeekLow']);
            const fiftyTwoWeekHigh: number = _.get(item, ['yahooFinance', 'fiftyTwoWeekHigh']);

            const sharesOutstanding: number = _.get(item, ['yahooFinance', 'sharesOutstanding']);

            const marketCap: number = _.get(item, ['yahooFinance', 'marketCap']);

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
            // TODO: GOOGLE TRENDS MUST BE >= 10
        });

        /* Step 4: Get Alpha Vantage Data */
        for (const datum of data) {
            const alphaVantageOptions: object = _.assign({
                uri: 'https://www.alphavantage.co/query',
                qs: {
                    function: 'TIME_SERIES_DAILY',
                    symbol: _.get(datum, ['yahooFinance', 'symbol']),
                    outputsize: 'compact',
                    apikey: 'J5LLHCUPAQ0CR0IN'
                }
            }, defaultUserAgentOptions);
            const alphaVantageResponse: any = await RequestPromise(alphaVantageOptions);
            const alphaVantageData: any = _.sortBy(_.map(_.get(alphaVantageResponse, ['Time Series (Daily)'], []), (value: any, key: string) => {
                return {
                    date: key,
                    open: _.toNumber(value['1. open']),
                    high: _.toNumber(value['2. high']),
                    low: _.toNumber(value['3. low']),
                    close: _.toNumber(value['4. close']),
                    volume: _.toNumber(value['5. volume']),
                }
            }), ['date']);
            _.set(datum, 'alphaVantage', alphaVantageData);
        };

        /* Step 5: Get Google Trends */
        for (const datum of data) {
            const googleTrends = new ExploreTrendRequest();
            const googleTrendsResponse = await googleTrends.past12Months().addKeyword(`${_.toLower(_.get(datum, ['yahooFinance', 'symbol']))} stock`, 'US').download()
            const googleTrendsData: Array<object> = _.compact(_.map(googleTrendsResponse, (item: any) => {
                const isNumeric: boolean = /^\d+$/.test(item[1]);
                if (!isNumeric) {
                    return null;
                }
                return { date: item[0], trend: _.toNumber(item[1]) }
            }));
            _.set(datum, 'googleTrends', googleTrendsData);
        };

        /* Step 6: Add Bullish Stats */
        for (const datum of data) {
            const stats: object = {
                isPriceBullish: isBullish(_.map(_.get(datum, ['alphaVantage'], []), (value) => _.get(value, ['open']))),
                isVolumeBullish: isBullish(_.map(_.get(datum, ['alphaVantage'], []), (value) => _.get(value, ['volume']))),
                isTrendBullish: isBullish(_.map(_.get(datum, ['googleTrends'], []), (value) => _.get(value, ['trend'])))
            };
            _.set(datum, 'stats', stats);
        }

        /* Step 7: Final Filter */
        data = _.filter(data, (datum: any) => {
            return _.get(datum, ['stats', 'isPriceBullish'], false)
            && _.get(datum, ['stats', 'isVolumeBullish'], false)
            && _.get(datum, ['stats', 'isTrendBullish'], false)
        });

        const final: object = {
            results: _.get(data, ['length'], 0),
            symbols: _.map(data, (item: object) => `${_.get(item, ['yahooFinance', 'symbol'])} @ ${_.get(item, ['yahooFinance', 'regularMarketPrice'])}`),
            data
        };
        console.log(JSON.stringify(final, null, 4));
        response.send(final);
    } catch (error) {
        console.log(JSON.stringify(error, null, 4));
        response.status(500).send(error);
    }
});