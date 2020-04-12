import * as functions from 'firebase-functions';
// import * as admin from 'firebase-admin';
import * as querystring from 'querystring';
import * as _ from 'lodash';
import * as Request from 'request';
const Utils = require('./utils');

const BASE_URL = 'http://newsapi.org/v2';
const API_KEY = 'b0eae7a462074c9a9e5611da91dd5f88';

const commonRequest = (request: any, response: any, endpoint: string) => {
    Utils.cors(request, response);
    _.set(request.query, 'apiKey', API_KEY);
    const url = `${BASE_URL}/${endpoint}?${querystring.stringify(request.query)}`;
    Request(url, function (error: any, res: any, body: any) {
        if (!_.isNil(error)) {
            response.send(error);
        }
        const data = JSON.parse(body);
        response.send(data);
    });
}

export const getEverythingNewsAPI = functions.runWith({ timeoutSeconds: 540, memory: '512MB' }).https.onRequest(async (request, response): Promise<any> => {
    // return response.send(require('./../mocks/news-api/get-everything-news-api.json'));
    commonRequest(request, response, 'everything');
});

export const getTopHeadlinesNewsAPI = functions.runWith({ timeoutSeconds: 540, memory: '512MB' }).https.onRequest(async (request, response): Promise<any> => {
    // return response.send(require('./../mocks/news-api/get-everything-news-api.json'));
    commonRequest(request, response, 'top-headlines');
});
