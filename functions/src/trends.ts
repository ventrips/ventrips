// import * as puppeteer from 'puppeteer';
import * as _ from 'lodash';
const Sentiment = require('sentiment');
const RequestPromise = require('request-promise');
const Cheerio = require('cheerio');
const UserAgent = require('user-agents');

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

exports.trends = async function(request: any, response: any, useMock: boolean = false) {
    return new Promise((resolve,reject) => {
        Promise.all([
            /* Tickers */
            getFinVizTickers(useMock)
            ,getStockTwitsTickers(useMock)
            ,getYahooTickers(useMock)
            /* Earnings */
            ,getSeekingAlphaEarnings(useMock)
            /* News */
            ,getSeekingAlphaNews(useMock)
            ,getMarketWatchNews(useMock)
            ,getBusinessInsiderNews(useMock)
            ,getReutersNews(useMock)
            ,getBarronsNews(useMock)
            ,getTheFlyNews(useMock)
            /* Forums */
            ,getFourChanForums(useMock)
            ,getHackerForums(useMock)
            ,getRedditForums(useMock)
        ])
        .then(async (result: any) => {
            const finVizTickers = result[0];
            const stockTwitsTickers = result[1];
            const yahooTickers = result[2];
            const seekingAlphaEarnings = result[3];
            const seekingAlphaNews = result[4];
            const marketWatchNews = result[5];
            const businessInsiderNews = result[6];
            const reutersNews = result[7];
            const barronsNews = result[8];
            const theFlyNews = result[9];
            const fourChanForums = result[10];
            const hackerForums = result[11];
            const redditForums = result[12];

            const finVizSymbolsOnly: Array<string> = _.map(finVizTickers, (ticker) => _.get(ticker, ['symbol']));
            const stockTwitsSymbolsOnly: Array<string> = _.map(stockTwitsTickers, (ticker) => _.get(ticker, ['symbol']));
            const yahooSymbolsOnly: Array<string> = _.map(yahooTickers, (ticker) => _.get(ticker, ['symbol']));
            const allSymbolsOnly = _.union(finVizSymbolsOnly, stockTwitsSymbolsOnly, yahooSymbolsOnly);

            const yahooFinanceTickers: Array<any> = await getYahooFinanceTickers(allSymbolsOnly, useMock);
            const finalTickers = _.map(allSymbolsOnly, (symbol) => {
                const yahooFinance = _.find(yahooFinanceTickers, { symbol: symbol });
                const finViz = _.find(finVizTickers, { symbol: symbol });
                const stockTwits = _.find(stockTwitsTickers, { symbol: symbol });
                const yahoo = _.find(yahooTickers, { symbol: symbol });
                return _.assign({}, yahooFinance, finViz, stockTwits, yahoo);
            });

            resolve({
                tickers: finalTickers
                ,earnings: seekingAlphaEarnings
                ,news: {
                    seekingAlphaNews
                    ,marketWatchNews
                    ,businessInsiderNews
                    ,reutersNews
                    ,barronsNews
                    ,theFlyNews
                }
                ,forums: {
                    fourChanForums
                    ,hackerForums
                    ,redditForums
                }
            });
        }).catch((error: any) => reject(`Error in promises ${error}`));
    });
}

/* Tickers */
const getFinVizTickers = function(useMock: boolean = false): Promise<any> {
    return new Promise((resolve,reject) => {
        if (useMock) {
            const data = require('./../mocks/trends/tickers/fin-viz-tickers.json');
            resolve(data);
            return data;
        }
        const options = {
            uri: 'https://finviz.com',
            headers: {
                'User-Agent': ((new UserAgent()).data).toString()
            },
            json: true,
            transform: (body: any) => Cheerio.load(body)
        };
        RequestPromise(options)
        .then(($: any) => {
            const data: Array<any> = [];
            let sections = $('#homepage table tbody tr td table tbody tr td table.t-home-table tbody tr');
            // Remove the first and last 40 undefined selections
            sections = sections.slice(1, 40);
            // Remove the 20th undefined selection
            sections.splice(19, 1);
            sections.each(function (this: any, index: number) {
                const obj = {
                    finVizRank: index + 1,
                    symbol: $(this).find('td a.tab-link').text(),
                    finVizUrl: `https://finviz.com/quote.ashx?t=${$(this).find('td a.tab-link').attr('href')}`,
                    signal: $(this).find('td .tab-link-nw').text()
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
                'User-Agent': ((new UserAgent()).data).toString()
            },
            json: true,
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
                'User-Agent': ((new UserAgent()).data).toString()
            },
            json: true,
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

/* News */

const getSeekingAlphaNews = async function(useMock: boolean = false): Promise<any> {
    return new Promise((resolve,reject) => {
        if (useMock) {
            const data = require('./../mocks/trends/news/seeking-alpha-news.json');
            resolve(data);
            return data;
        }

        const options = {
            uri: 'https://seekingalpha.com/earnings/earnings-news',
            headers: {
                'User-Agent': ((new UserAgent()).data).toString()
            },
            json: true,
            transform: (body: any) => Cheerio.load(body)
        };
        RequestPromise(options)
        .then(($: any) => {
            const data: Array<any> = [];
            $('#analysis-list-container > .media > .media-body').each(function (this: any, index: number) {
                const obj = {
                    url: `https://seekingalpha.com${$(this).find('h4 a.article-link').attr('href')}`,
                    title: $(this).find('h4').text(),
                    date: $(this).find('div.article-desc').text(),
                    description: $(this).find('div.item-summary').text()
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

const getMarketWatchNews = async function(useMock: boolean = false): Promise<any> {
    return new Promise((resolve,reject) => {
        if (useMock) {
            const data = require('./../mocks/trends/news/market-watch-news.json');
            resolve(data);
            return data;
        }
        const options = {
            uri: 'https://www.marketwatch.com/latest-news',
            headers: {
                'User-Agent': ((new UserAgent()).data).toString()
            },
            json: true,
            transform: (body: any) => Cheerio.load(body)
        };
        RequestPromise(options)
        .then(($: any) => {
            const data: Array<any> = [];
            $('.article__content').each(function (this: any, index: number) {
                const obj = {
                    url: `${$(this).find('h3 a').attr('href')}`,
                    title: $(this).find('h3').text(),
                    date: $(this).find('.article__timestamp').text()
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

const getBusinessInsiderNews = async function(useMock: boolean = false): Promise<any> {
    return new Promise((resolve,reject) => {
        if (useMock) {
            const data = require('./../mocks/trends/news/business-insider-news.json');
            resolve(data);
                return data;
        }
        const options = {
            uri: 'https://markets.businessinsider.com/stocks/news',
            headers: {
                'User-Agent': ((new UserAgent()).data).toString()
            },
            json: true,
            transform: (body: any) => Cheerio.load(body)
        };
        RequestPromise(options)
        .then(($: any) => {
            const data: Array<any> = [];
            $('.further-news-container').each(function (this: any, index: number) {
                const obj = {
                    url: `https://markets.businessinsider.com${$(this).find('.news-link').attr('href')}`,
                    title: $(this).find('.news-link').text(),
                    date: $(this).find('.source-and-publishdate').text()
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

const getReutersNews = async function(useMock: boolean = false): Promise<any> {
    return new Promise((resolve,reject) => {
        if (useMock) {
            const data = require('./../mocks/trends/news/reuters-news.json');
            resolve(data);
            return data;
        }
        const options = {
            uri: 'https://www.reuters.com/finance',
            headers: {
                'User-Agent': ((new UserAgent()).data).toString()
            },
            json: true,
            transform: (body: any) => Cheerio.load(body)
        };
        RequestPromise(options)
        .then(($: any) => {
            const data: Array<any> = [];
            $('.story').each(function (this: any, index: number) {
                const obj = {
                    url: `https://www.reuters.com/finance${$(this).find('.story-content a').attr('href')}`,
                    title: $(this).find('.story-content a .story-title').text(),
                    date: $(this).find('.article-time').text()
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

const getBarronsNews = async function(useMock: boolean = false): Promise<any> {
    return new Promise((resolve,reject) => {
        if (useMock) {
            const data = require('./../mocks/trends/news/barrons-news.json');
            resolve(data);
            return data;
        }
        const options = {
            uri: 'https://www.barrons.com',
            headers: {
                'User-Agent': ((new UserAgent()).data).toString()
            },
            json: true,
            transform: (body: any) => Cheerio.load(body)
        };
        RequestPromise(options)
        .then(($: any) => {
            const data: Array<any> = [];
            $('.BarronsTheme--scroll-bar--3vISrLk6 > .BarronsTheme--story--3Z0LVZ5M').each(function (this: any, index: number) {
                const obj = {
                    url: `${$(this).find('a').attr('href')}`,
                    title: $(this).find('h3').text(),
                    date: $(this).find('p').text()
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

const getTheFlyNews = async function(useMock: boolean = false): Promise<any> {
    return new Promise((resolve,reject) => {
        if (useMock) {
            const data = require('./../mocks/trends/news/the-fly-news.json');
            resolve(data);
            return data;
        }
        const options = {
            uri: 'https://thefly.com/news.php',
            headers: {
                'User-Agent': ((new UserAgent()).data).toString()
            },
            json: true,
            transform: (body: any) => Cheerio.load(body)
        };
        RequestPromise(options)
        .then(($: any) => {
            const data: Array<any> = [];
            $('.tr_noticia').each(function (this: any, index: number) {
                const obj = {
                    url: `${$(this).find('a.newsTitleLink').attr('href')}`,
                    title: $(this).find('a.newsTitleLink').text(),
                    description: $(this).find('.contenedorFalso .fpo_overlay_ticker').text(),
                    date: $(this).find('.fpo_overlay_ticker').text()
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

/* Forums */
const getFourChanForums = async function(useMock: boolean = false): Promise<any> {
    return new Promise((resolve,reject) => {
        if (useMock) {
            const data = require('./../mocks/trends/forums/four-chan-forums.json');
            resolve(data);
            return data;
        }
        const options = {
            uri: 'http://boards.4channel.org/biz',
            headers: {
                'User-Agent': ((new UserAgent()).data).toString()
            },
            json: true,
            transform: (body: any) => Cheerio.load(body)
        };
        RequestPromise(options)
        .then(($: any) => {
            const data: Array<any> = [];
            // Select after the first two stickied forum posts
            ($('.thread').slice(2)).each(function (this: any, index: number) {
                const obj = {
                    url: `http://boards.4channel.org/biz/${$(this).find('.replylink').attr('href')}`,
                    title: $(this).find('.postMessage').text(),
                    date: $(this).find('.dateTime').text()
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

const getHackerForums = async function(useMock: boolean = false): Promise<any> {
    return new Promise((resolve,reject) => {
        if (useMock) {
            const data = require('./../mocks/trends/forums/hacker-forums.json');
            resolve(data);
            return data;
        }
        const options = {
            uri: 'https://news.ycombinator.com',
            headers: {
                'User-Agent': ((new UserAgent()).data).toString()
            },
            json: true,
            transform: (body: any) => Cheerio.load(body)
        };
        RequestPromise(options)
        .then(($: any) => {
            const data: Array<any> = [];
            $('.itemlist > tbody > .athing').each(function (this: any, index: number) {
                const obj = {
                    url: $(this).find('a.storylink').attr('href'),
                    title: $(this).find('a.storylink').text()
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

const getRedditForums = async function(useMock: boolean = false): Promise<any> {
    return new Promise((resolve,reject) => {
        if (useMock) {
            const data = require('./../mocks/trends/forums/reddit-forums.json');
            resolve(data);
            return data;
        }
        const options = {
            uri: 'https://www.reddit.com/r/investing/rising',
            headers: {
                'User-Agent': ((new UserAgent()).data).toString()
            },
            json: true,
            transform: (body: any) => Cheerio.load(body)
        };
        RequestPromise(options)
        .then(($: any) => {
            const data: Array<any> = [];
            $('.Post').each(function (this: any, index: number) {
                const obj = {
                    url: `https://www.reddit.com${$(this).find('a.SQnoC3ObvgnGjWt90zD9Z').attr('href')}`,
                    title: $(this).find('a.SQnoC3ObvgnGjWt90zD9Z h3').text(),
                    description: $(this).find('.STit0dLageRsa2yR4te_b').text(),
                    date: $(this).find('._3jOxDPIQ0KaOWpzvSQo-1s').text()
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