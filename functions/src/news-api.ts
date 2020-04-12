import * as functions from 'firebase-functions';
// import * as admin from 'firebase-admin';
import * as querystring from 'querystring';
import * as _ from 'lodash';
import * as Request from 'request';
const Sentiment = require('sentiment');
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

export const getEverythingNewsAPI = functions.runWith({ timeoutSeconds: 540, memory: '512MB' }).https.onRequest(async (request, response): Promise<any> => {
    Utils.cors(request, response);
    let data;
    /* Mock */
    data = require('./../mocks/news-api/get-everything-news-api.json');
    setSentiment(data);
    return response.send(data);
    /* Real */
    data = await commonRequest(request, 'everything');
    setSentiment(data);
    return response.send(data);
});

export const getTopHeadlinesNewsAPI = functions.runWith({ timeoutSeconds: 540, memory: '512MB' }).https.onRequest(async (request, response): Promise<any> => {
    Utils.cors(request, response);
    let data;
    /* Mock */
    data = require('./../mocks/news-api/get-everything-news-api.json');
    setSentiment(data);
    return response.send(data);
    /* Real */
    data = await commonRequest(request, 'top-headlines');
    setSentiment(data);
    return response.send(data);
});
