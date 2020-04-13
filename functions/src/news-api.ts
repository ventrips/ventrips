import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as querystring from 'querystring';
import * as _ from 'lodash';
import * as Request from 'request';
const db = admin.firestore();
const Sentiment = require('sentiment');
const isBullish = require('is-bullish');
const Utils = require('./utils');

const BASE_URL = 'http://newsapi.org/v2';
const API_KEY = 'b0eae7a462074c9a9e5611da91dd5f88';

const setSentiment = (data: any) => {
    _.forEach(_.get(data, ['articles']), (article: any) => {
        const newSentiment = new Sentiment();
        const bagOfWords = _.join(_.uniq(_.compact(_.split(_.toLower(`${_.get(article, ['title'])} ${_.get(article, ['description'])}`), ' '))), ' ');
        const sentiment = newSentiment.analyze(bagOfWords);
        article.sentiment = sentiment;
    });
    const overallSentiment = new Sentiment();
    data.overallSentiment = overallSentiment.analyze(_.join(_.uniq(_.reduce(_.get(data, ['articles']), (list, article: any) => _.concat(list, article.sentiment.tokens), [])), ' '));
}

const setIsBullish = (data: any) => {
    const sortedData = _.sortBy(_.get(data, ['articles']), ['publishedAt']);
    data.isBullish = isBullish(_.map(_.get(sortedData, ['articles']), (article) => _.get(article, ['sentiment', 'score'])));
}

const commonRequest = async (request: any, endpoint: string): Promise<any> => {
    return new Promise((resolve: any, reject: any) => {
        _.set(request.query, 'apiKey', API_KEY);
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
    setSentiment(data);
    setIsBullish(data);

    if (!sendToFirebase) {
        return response.send(data);
    }
    const final = _.assign(data, {updated: admin.firestore.FieldValue.serverTimestamp()});
    // USE POSTMAN - http://localhost:5001/ventrips-website/us-central1/trends?mock=false&local=true
    return db.doc(firebasePath).set(final).then(() => {
        return response.send(final);
    }).catch((error) => {
        return response.send(error);
    });
}

export const getEverythingNewsAPI = functions.runWith({ timeoutSeconds: 540, memory: '512MB' }).https.onRequest(async (request, response): Promise<any> => {
    Utils.cors(request, response);
    let data;
    /* Mock */
    // data = require('./../mocks/news-api/get-everything-news-api.json');
    // return setFirebase(request, response, data, 'trends/get-everything-news-api', false);
    /* Real */
    data = await commonRequest(request, 'everything');
    setFirebase(request, response, data, 'trends/get-everything-news-api', true);
});

export const getTopHeadlinesNewsAPI = functions.runWith({ timeoutSeconds: 540, memory: '512MB' }).https.onRequest(async (request, response): Promise<any> => {
    Utils.cors(request, response);
    let data;
    /* Mock */
    // data = require('./../mocks/news-api/get-everything-news-api.json');
    // return setFirebase(request, response, data, 'trends/get-top-headlines-news-api', false);
    /* Real */
    data = await commonRequest(request, 'top-headlines');
    setFirebase(request, response, data, 'trends/get-top-headlines-news-api', true);
});
