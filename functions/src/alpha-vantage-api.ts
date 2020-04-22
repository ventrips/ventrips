import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as querystring from 'querystring';
import * as _ from 'lodash';
import * as Request from 'request';
const db = admin.firestore();
// const Sentiment = require('sentiment');
// const isBullish = require('is-bullish');
const Utils = require('./utils');

// https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=SPY&interval=5min&outputsize=full&apikey=J5LLHCUPAQ0CR0IN
const BASE_URL = 'https://www.alphavantage.co/query';
const API_KEY = 'J5LLHCUPAQ0CR0IN';

const commonRequest = async (request: any, endpoint: string): Promise<any> => {
    return new Promise((resolve: any, reject: any) => {
        _.set(request.query, 'apikey', API_KEY);
        const url = `${BASE_URL}/${endpoint}?${querystring.stringify(request.query)}`;
        Request(url, function (error: any, res: any, body: any) {
            if (!_.isNil(error)) {
                reject(error);
            }
            const data = JSON.parse(body);
            resolve(data);
        });
    });
};

const setFirebase = (request: any, response: any, data: any, firebasePath: string, sendToFirebase: boolean) => {
    if (!sendToFirebase) {
        return response.send(data);
    }
    const final = _.assign(data, {updated: admin.firestore.FieldValue.serverTimestamp()});
    return db.doc(firebasePath).set(final).then(() => {
        return response.send(final);
    }).catch((error) => {
        return response.send(error);
    });
}

export const getAlphaVantageAPI = functions.runWith({ timeoutSeconds: 540, memory: '512MB' }).https.onRequest(async (request, response): Promise<any> => {
    Utils.cors(request, response);
    let data;
    /* Mock */
    data = require('./../mocks/alpha-vantage-api/alpha-vantage-api.json');
    return setFirebase(request, response, data, 'trends/alpha-vantage-api', false);
    /* Real */
    data = await commonRequest(request, 'query');
    setFirebase(request, response, data, 'trends/alpha-vantage-api', true);
});