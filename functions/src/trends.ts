// import * as puppeteer from 'puppeteer';
import * as _ from 'lodash';
const Sentiment = require('sentiment');
const RequestPromise = require('request-promise');
const Cheerio = require('cheerio');

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

exports.trends = function(request: any, response: any, useMock: boolean = false) {
    Promise.all([
        getStockTwitsTickers(useMock)
        ,getYahooTickers(useMock)
        ,getSeekingAlphaEarnings(useMock)
    ])
    .then(async (result: any) => {
        // Tickers
        const [
            stockTwitsTickers,
            yahooTickers,
            seekingAlphaEarnings
        ] = result;
        const stockTwitsSymbolsOnly: Array<string> = _.map(stockTwitsTickers, (ticker) => _.get(ticker, ['symbol']));
        const yahooSymbolsOnly: Array<string> = _.map(yahooTickers, (ticker) => _.get(ticker, ['symbol']));
        const allSymbolsOnly = _.union(stockTwitsSymbolsOnly, yahooSymbolsOnly);
        // Final Tickers
        const yahooFinanceTickers: Array<any> = await getYahooFinanceTickers(allSymbolsOnly, useMock);
        const finalTickers = _.map(allSymbolsOnly, (symbol) => {
            const yahooFinance = _.find(yahooFinanceTickers, { symbol: symbol });
            const stockTwits = _.find(stockTwitsTickers, { symbol: symbol });
            const yahoo = _.find(yahooTickers, { symbol: symbol });
            return _.assign({}, yahooFinance, yahoo, stockTwits);
        });

        // Earnings
        response.send({
            tickers: finalTickers,
            earnings: seekingAlphaEarnings
        });
    }).catch((error: any) => console.log(`Error in promises ${error}`));
}

/* Tickers */
const getStockTwitsTickers = function(useMock: boolean = false): Promise<any> {
    const Request = require('request');
    return new Promise((resolve,reject) => {
        if (useMock) {
            const data = require('./../mocks/trends/tickers/stock-twits-tickers.json');
            resolve(data);
            return data;
        }
        Request('https://api.stocktwits.com/api/2/trending/symbols.json', (error: any, res: any, body: any) => {
          if (res) {

            const data = _.map(JSON.parse(body).symbols, (stock: any, index: number) => {
                stock.stockTwitsRank = index + 1;
                stock.stockTwitsUrl = 'https://stocktwits.com/symbol/' + stock.symbol
                stock.company = stock.title;
                delete stock.title;

                return stock;
            });

            resolve(data);
            return data;
          }
          if (error) {
            reject(error);
            return error;
          }
        });
    });
}

const getYahooTickers = function(useMock: boolean = false): Promise<any> {
    return new Promise((resolve,reject) => {
        if (useMock) {
            const data = require('./../mocks/trends/tickers/yahoo-tickers.json');
            resolve(data);
            return data;
        }
        const options = {
            uri: 'https://finance.yahoo.com/trending-tickers',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3312.0 Safari/537.36'
            },
            json:true,
            transform: (body: any) => Cheerio.load(body)
        };
        RequestPromise(options)
        .then(($: any) => {
            const data: Array<any> = [];
            $('tr.BdT').each(function (this: any, index: number) {
                const obj = {
                    symbol: $(this).find('.data-col0').text(),
                    company: $(this).find('.data-col1').text(),
                    yahooRank: index + 1,
                    yahooUrl: `https://finance.yahoo.com${$(this).find('.data-col0 a').attr('href')}`,
                    yahooChange: $(this).find('.data-col5').text()
                }
                data.push(obj);
            });
            // Process html like you would with jQuery...
            resolve(data);
            return data;
        })
        .catch((err: any) => {
            // Crawling failed...
            reject(err);
            return err;
        });
    });
}

const getYahooFinanceTickers = async function(symbols: Array<string>, useMock: boolean = false): Promise<any> {
    return new Promise((resolve, reject) => {
        if (useMock) {
            const data = require('./../mocks/trends/tickers/yahoo-finance-tickers.json');
            resolve(data);
            return data;
        }

        const Request = require('request');
        Request(`https://query2.finance.yahoo.com/v7/finance/quote?symbols=${_.toString(symbols)}`, (error: any, res: any, body: any) => {
            if (_.isEqual(_.get(res, ['statusCode']), 200)) {
                const data = _.get(JSON.parse(body), ['quoteResponse', 'result'])
                resolve(data);
                return data;
            }

            reject(error);
            return error;
        });
    });
};

/* Earnings */

const getSeekingAlphaEarnings = async function(useMock: boolean = false): Promise<any> {
    return new Promise((resolve,reject) => {
        if (useMock) {
            const data = require('./../mocks/trends/earnings/seeking-alpha-earnings.json');
            resolve(data);
            return data;
        }
        const options = {
            uri: 'https://seekingalpha.com/earnings/earnings-calendar',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3312.0 Safari/537.36'
            },
            json:true,
            transform: (body: any) => Cheerio.load(body)
        };
        RequestPromise(options)
        .then(($: any) => {
            const data: Array<any> = [];
            $('.earningsTable tbody tr').each(function (this: any, index: number) {
                const obj = {
                    url: `https://seekingalpha.com${$(this).find('.sym').attr('href')}`,
                    symbol: $(this).find('.sym').text(),
                    company: $(this).find('.ticker-name').text(),
                    releaseDate: $(this).find('.release-date').text(),
                    releaseTime: $(this).find('.release-time').text()
                }
                data.push(obj);
            });
            // Process html like you would with jQuery...
            resolve(data);
            return data;
        })
        .catch((err: any) => {
            // Crawling failed...
            reject(err);
            return err;
        });
    });
}