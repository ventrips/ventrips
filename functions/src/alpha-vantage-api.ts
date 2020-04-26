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


const convertChartData = (intraData: any, dayData: any, interval: string) => {
    const fiveMinDates = Object.keys(intraData[`Time Series (${interval})`]).map(date => new Date(date).getTime());
    const minDate = `${((new Date(Math.min(...fiveMinDates))).toISOString()).substring(0, 10)} 09:30:00`;
    const maxDate = `${((new Date(Math.max(...fiveMinDates))).toISOString()).substring(0, 10)} 09:30:00`;

    _.forEach(dayData['Time Series (Daily)'], (value: any, key: any) => {
        _.set(dayData['Time Series (Daily)'], `${key} 09:30:00`, value);
        _.unset(dayData['Time Series (Daily)'], key);
    });
    _.forEach(dayData['Time Series (Daily)'], (value: any, key: any) => {
        if (((new Date(key).getTime()) >= (new Date(minDate).getTime())) && ((new Date(key).getTime()) <= (new Date(maxDate).getTime()))) {
            _.set(intraData[`Time Series (${interval})`], key, value);
        }
    });
    let dates: Array<any> = [];
    _.forEach(intraData[`Time Series (${interval})`], (value: any, key: any) => {
        dates.push(_.assign(value, { date: key }));
    });
    dates = _.sortBy(dates, 'date');

    const dateGroup = (item: any) => (item['date']).substring(0, 10);

    const groupedData = _.groupBy(dates, dateGroup);

    const chartData = {};
    _.forEach(groupedData, (value: any, key: any) => {
        const chartDatum = {
            date: _.map(value, (item: any) => item['date']),
            open: _.map(value, (item: any) => _.toNumber(item['1. open'])),
            high: _.map(value, (item: any) => _.toNumber(item['2. high'])),
            low: _.map(value, (item: any) => _.toNumber(item['3. low'])),
            close: _.map(value, (item: any) => _.toNumber(item['4. close'])),
            volume: _.map(value, (item: any) => _.toNumber(item['5. volume']))
        }
        _.set(chartData, key, chartDatum);
    });

    return {
        metaData: {
            information: intraData['Meta Data']['1. Information'],
            symbol: intraData['Meta Data']['2. Symbol'],
            lastRefreshed: intraData['Meta Data']['3. Last Refreshed'],
            interval: intraData['Meta Data']['4. Interval'],
            outputSize: intraData['Meta Data']['5. Output Size'],
            timeZone: intraData['Meta Data']['6. Time Zone'],
        },
        chartData
    }
};

export const getAlphaVantageAPI = functions.runWith({ timeoutSeconds: 540, memory: '512MB' }).https.onRequest(async (request, response): Promise<any> => {
    Utils.cors(request, response);
    const symbol = _.toUpper(request.query.symbol);
    const interval = _.toLower(request.query.interval);

    let data;
    let intraData;
    let dayData;
    /* Mock */
    // intraData = require('./../mocks/alpha-vantage-api/alpha-vantage-5-min-api.json');
    // dayData = require('./../mocks/alpha-vantage-api/alpha-vantage-1-day-api.json');
    // data = convertChartData(intraData, dayData, interval);
    // return setFirebase(request, response, data, 'trends/alpha-vantage-api', false);

    /* Real */
    intraData = await alphaVantageRequest({function: 'TIME_SERIES_INTRADAY', symbol, interval, outputsize: 'full'});
    dayData = await alphaVantageRequest({function: 'TIME_SERIES_DAILY', symbol, outputsize: 'compact'});
    data = convertChartData(intraData, dayData, interval);
    setFirebase(request, response, data, 'trends/get-alpha-vantage-api', true);
});