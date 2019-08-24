// import * as puppeteer from 'puppeteer';
import * as _ from 'lodash';
const Sentiment = require('sentiment');
const Utils = require('./utils');
const Predict = require('./predict');

exports.searchNews = function(request: any, response: any, useMock: boolean = false) {
    let data = {};

    if (useMock) {
        if (_.isEqual(_.toLower(request.query.q), 'aapl')) {
            data = require('./../mocks/aapl.json');
        } else if (_.isEqual(_.toLower(request.query.q), 'bitcoin')) {
            data = require('./../mocks/bitcoin.json');
        };
        return response.send(constructData(data));
    }

    const Request = require('request');
    Request(`https://gapi.xyz/api/v3/search?q=${request.query.q}&token=9d0d7434d0964972e47f18e1862e821a`, function (error: any, res: any, body: any) {
        return response.send(constructData(JSON.parse(body)));
    });
};

function constructData(data: any) {
    _.forEach(_.get(data, ['articles']), (article: any) => {
        const newSentiment = new Sentiment();
        const bagOfWords = _.join(_.compact(_.split(_.replace(_.toLower(`${_.get(article, ['title'])} ${_.get(article, ['description'])}`), /[^a-zA-Z0-9]/g, ' '), ' ')), ' ');
        const sentiment = newSentiment.analyze(bagOfWords);
        article.sentiment = sentiment;
    });
    const overallSentiment = new Sentiment();
    data.overallSentiment = overallSentiment.analyze(_.join(_.reduce(_.get(data, ['articles']), (list, article: any) => _.concat(list, article.sentiment.tokens), []), ' '));
    return data;
}

exports.trends = async function(request: any, response: any, useMock: boolean = false): Promise<any> {
    const yahooFinance: Array<any> = await Utils.yahooFinance(['AAPL'], useMock);
    const stockTwitsTickers: Array<any> = await Predict.getStockTwitsTickers(request, response, useMock);

    response.send(stockTwitsTickers);
}
