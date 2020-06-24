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
        const tickerSymbolChunks: any = _.chunk(finnHubAllTickerSymbols, 2000);
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

        response.send(data);
    } catch {
        response.status(500).send('Internal Server Error');
    }
});