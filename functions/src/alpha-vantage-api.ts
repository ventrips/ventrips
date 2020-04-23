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

const alphaVantageRequest = async (params: object): Promise<any> => {
    return new Promise((resolve: any, reject: any) => {
        _.set(params, 'apikey', API_KEY);
        const url = `${BASE_URL}?${querystring.stringify(params)}`;
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


const convertChartData = (fiveMinData: any, dayData: any) => {
    const fiveMinDates = Object.keys(fiveMinData['Time Series (5min)']).map(date => new Date(date).getTime());
    const minDate = `${((new Date(Math.min(...fiveMinDates))).toISOString()).substring(0, 10)} 09:30:00`;
    const maxDate = `${((new Date(Math.max(...fiveMinDates))).toISOString()).substring(0, 10)} 09:30:00`;

    _.forEach(dayData['Time Series (Daily)'], (value: any, key: any) => {
        _.set(dayData['Time Series (Daily)'], `${key} 09:30:00`, value);
        _.unset(dayData['Time Series (Daily)'], key);
    });
    _.forEach(dayData['Time Series (Daily)'], (value: any, key: any) => {
        if (((new Date(key).getTime()) >= (new Date(minDate).getTime())) && ((new Date(key).getTime()) <= (new Date(maxDate).getTime()))) {
            _.set(fiveMinData['Time Series (5min)'], key, value);
        }
    });
    let dates: Array<any> = [];
    _.forEach(fiveMinData['Time Series (5min)'], (value: any, key: any) => {
        dates.push(_.assign(value, { date: key }));
    });
    dates = _.sortBy(dates, 'date');

    const dateGroup = (item: any) => (item['date']).substring(0, 10);

    let groupedData = _.groupBy(dates, dateGroup);

    const chartData = {};
    _.forEach(groupedData, (value: any, key: any) => {
        const chartDatum = {
            date: _.map(value, (item: any) => item['date']),
            open: _.map(value, (item: any) => item['1. open']),
            high: _.map(value, (item: any) => item['2. high']),
            low: _.map(value, (item: any) => item['3. low']),
            close: _.map(value, (item: any) => item['4. close']),
            volume: _.map(value, (item: any) => item['5. volume'])
        }
        _.set(chartData, key, chartDatum);
    });

    return {
        metaData: {
            information: fiveMinData['Meta Data']['1. Information'],
            symbol: fiveMinData['Meta Data']['2. Symbol'],
            lastRefreshed: fiveMinData['Meta Data']['3. Last Refreshed'],
            interval: fiveMinData['Meta Data']['4. Interval'],
            outputSize: fiveMinData['Meta Data']['5. Output Size'],
            timeZone: fiveMinData['Meta Data']['6. Time Zone'],
        },
        chartData
    }
};

export const getAlphaVantageAPI = functions.runWith({ timeoutSeconds: 540, memory: '512MB' }).https.onRequest(async (request, response): Promise<any> => {
    Utils.cors(request, response);
    let data;
    let fiveMinData;
    let dayData;
    /* Mock */
    // fiveMinData = require('./../mocks/alpha-vantage-api/alpha-vantage-5-min-api.json');
    // dayData = require('./../mocks/alpha-vantage-api/alpha-vantage-1-day-api.json');
    // data = convertChartData(fiveMinData, dayData);
    // return setFirebase(request, response, data, 'trends/alpha-vantage-api', false);

    /* Real */
    fiveMinData = await alphaVantageRequest({function: 'TIME_SERIES_INTRADAY', symbol: request.query.symbol, interval: '5min', outputsize: 'full'});
    dayData = await alphaVantageRequest({function: 'TIME_SERIES_DAILY', symbol: request.query.symbol, outputsize: 'compact'});
    data = convertChartData(fiveMinData, dayData);
    setFirebase(request, response, data, 'trends/get-alpha-vantage-api', true);
});