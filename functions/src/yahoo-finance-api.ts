// const functions = require('firebase-functions');
import * as _ from 'lodash';
import { commonRequest } from './utils';

// https://query2.finance.yahoo.com/v7/finance/quote?symbols=SPY,AMZN,TSLA
const BASE_URL = 'https://query2.finance.yahoo.com/v7/finance/quote';

const formatYahooFinance = (data: any) => {
    const results = _.get(data, ['quoteResponse', 'result', 0]);
    return results;
};

export const getSingleYahooFinanceAPI = async (symbol: string): Promise<any> => {
    return new Promise(async (resolve: any, reject: any) => {
        try {
            const data = await commonRequest({symbols: [symbol]}, BASE_URL);
            const final = formatYahooFinance(data);
            return resolve(final);
        } catch {
            return reject({});
        }
    });
};

// export const getSingleYahooFinanceAPI = functions.runWith({ timeoutSeconds: 540, memory: '512MB' }).https.onRequest(async (request, response): Promise<any> => {
//     const symbol = _.toUpper(request.query.symbol);
//     const final = await getSingleYahooFinanceCall(symbol);
//     return response.send(final);
// });