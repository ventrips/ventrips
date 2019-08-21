import * as puppeteer from 'puppeteer';
import * as moment from 'moment';
import * as _ from 'lodash';
const Utils = require('./utils');
const GoogleTrends = require('google-trends-api');

exports.getGoogleTrends = async function(request: any, response: any, tickers: Array<any> = [], useMock: boolean = false): Promise<Array<any>>  {
    const symbols: Array<string> = _.slice(_.map(tickers, (ticker) => _.get(ticker, ['symbol'])), 0, 5);

    let results;
    if (useMock) {
        results = require('./../mocks/predict/google-trends.json');
    } else {
        const unparsedResults = await GoogleTrends.interestOverTime({keyword: symbols, startTime: moment(new Date()).subtract(7, 'days').toDate() })
        results = JSON.parse(unparsedResults);
    }

    const timelineData = results.default.timelineData;
    const data: any = {
        symbols,
        timelineData
    };

    return data;
}

/* Earnings */

exports.getSeekingAlphaEarnings = async function(request: any, response: any, useMock: boolean = false): Promise<Array<any>>  {
    if (useMock) {
        return require('./../mocks/predict/earnings/seeking-alpha-earnings.json');
    }

    const results: Array<any> = [];
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.goto(`https://seekingalpha.com/earnings/earnings-calendar`, { waitUntil: 'load', timeout: 0 })

    const sections = await page.$$('.earningsTable tbody tr');

    for (const section of sections) {
        const releaseDate = await section.$eval(
            '.release-date',
            (item: any) => item.innerText.trim().replace(/\n/g, ' '),
        );
        if (moment(releaseDate).isSameOrAfter(moment(new Date()).startOf('day'))) {
            const releaseTime = await section.$eval(
                '.release-time',
                (item: any) => item.innerText.trim().replace(/\n/g, ' '),
            );
            const url = await section.$eval(
                '.sym',
                (item: any) => `https://seekingalpha.com${item.getAttribute('href')}`
            );
            const symbol = await section.$eval(
                '.sym',
                (item: any) => item.innerText.trim().replace(/\n/g, ' '),
            );
            const company = await section.$eval(
                '.ticker-name',
                (item: any) => item.innerText.trim().replace(/\n/g, ' '),
            );
            const obj = {
                url,
                symbol,
                company,
                releaseDate,
                releaseTime,
                source: 'seeking-alpha'
            };
            results.push(obj);
        }
    }
    return results;
}

/* Tickers */

exports.getStockTwitsTickers = function(request: any, response: any, useMock: boolean = false): Promise<any> {
    if (useMock) {
        return require('./../mocks/predict/tickers/stocktwits-tickers.json');
    }

    const Request = require('request');
    return new Promise((resolve,reject) => {
        Request('https://api.stocktwits.com/api/2/trending/symbols.json', (error: any, res: any, body: any) => {
          if (res) {

            const data = _.map(JSON.parse(body).symbols, (stock) => {
                stock.source = 'stock-twits';
                stock.url = 'https://stocktwits.com/symbol/' + stock.symbol
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

exports.getYahooTickers = async function(request: any, response: any, useMock: boolean = false): Promise<any> {
    if (useMock) {
        return require('./../mocks/predict/tickers/yahoo-tickers.json');
    }

    const data = await Utils.puppeteerScrape(
        'yahoo',
        'https://finance.yahoo.com/trending-tickers',
        'https://finance.yahoo.com',
        'tr.BdT',
        {
            url: '.data-col0 a',
            company: '.data-col1',
            symbol: '.data-col0',
            change: '.data-col5'
        }
    );

    return data;
}

exports.getFinVizTickers = async function(request: any, response: any, useMock: boolean = false): Promise<any> {
    if (useMock) {
        return require('./../mocks/predict/tickers/finviz-tickers.json');
    }

    const data = await Utils.puppeteerScrape(
        'finviz',
        'https://finviz.com',
        'https://finviz.com/quote.ashx?t=',
        '#homepage table tbody tr td table tbody tr td table.t-home-table tbody tr',
        {
            url: 'td a.tab-link',
            company: 'td a.tab-link',
            symbol: 'td a.tab-link',
            signal: 'td .tab-link-nw'
        }
    );

    return data;
}
/* News */

exports.getSeekingAlphaNews = async function(request: any, response: any, useMock: boolean = false): Promise<any> {
    if (useMock) {
        return require('./../mocks/predict/news/seeking-alpha-news.json');
    }

    const data = await Utils.puppeteerScrape(
        'seeking-alpha',
        'https://seekingalpha.com/earnings/earnings-news',
        'https://seekingalpha.com',
        '#analysis-list-container > .media > .media-body',
        {
            url: 'h4 a.article-link',
            title: 'h4',
            date: 'div.article-desc',
            description: 'div.item-summary',
        }
    );

    return data;
}

exports.getMarketWatchNews = async function(request: any, response: any, useMock: boolean = false): Promise<any> {
    if (useMock) {
        return require('./../mocks/predict/news/market-watch-news.json');
    }

    const data = await Utils.puppeteerScrape(
        'market-watch',
        'https://www.marketwatch.com/latest-news',
        '',
        '.article__content',
        {
            url: 'h3 a',
            title: 'h3',
            date: '.article__timestamp'
        }
    );

    return data;
}

exports.getBusinessInsiderNews = async function(request: any, response: any, useMock: boolean = false): Promise<any> {
    if (useMock) {
        return require('./../mocks/predict/news/business-insider-news.json');
    }

    const data = await Utils.puppeteerScrape(
        'business-insider',
        'https://markets.businessinsider.com/stocks/news',
        'https://markets.businessinsider.com',
        '.further-news-container',
        {
            url: '.news-link',
            title: '.news-link',
            date: '.source-and-publishdate'
        }
    );

    return data;
}

exports.getReutersNews = async function(request: any, response: any, useMock: boolean = false): Promise<any> {
    if (useMock) {
        return require('./../mocks/predict/news/reuters-news.json');
    }

    const data = await Utils.puppeteerScrape(
        'reuters',
        'https://www.reuters.com/finance',
        'https://www.reuters.com/finance',
        '.story',
        {
            url: '.story-content a',
            title: '.story-content a .story-title',
            date: '.article-time'
        }
    );

    return data;
}

exports.getBarronsNews = async function(request: any, response: any, useMock: boolean = false): Promise<any> {
    if (useMock) {
        return require('./../mocks/predict/news/barrons-news.json');
    }

    const data = await Utils.puppeteerScrape(
        'barrons',
        'https://www.barrons.com',
        '',
        '.BarronsTheme--scroll-bar--3vISrLk6 > .BarronsTheme--story--3Z0LVZ5M',
        {
            url: 'a',
            title: 'h3',
            date: 'p'
        }
    );

    return data;
}

exports.getTheFlyNews = async function(request: any, response: any, useMock: boolean = false): Promise<any> {
    if (useMock) {
        return require('./../mocks/predict/news/the-fly-news.json');
    }
    const data = await Utils.puppeteerScrape(
        'the-fly',
        'https://thefly.com/news.php',
        '',
        '.tr_noticia',
        {
            url: 'a.newsTitleLink',
            title: 'a.newsTitleLink',
            description: '.contenedorFalso .fpo_overlay_ticker',
            date: '.fpo_overlay_ticker'
        }
    );

    return data;
}

/* Forums */

exports.getHackerForums = async function(request: any, response: any, useMock: boolean = false): Promise<any> {
    if (useMock) {
        return require('./../mocks/predict/forums/hacker-forums.json');
    }

    const data = await Utils.puppeteerScrape(
        'hacker-news',
        'https://news.ycombinator.com/',
        '',
        '.itemlist > tbody > .athing',
        {
            url: 'a.storylink',
            title: 'a.storylink',
            date: '.age'
        }
    );

    return data;
}

exports.getRedditForums = async function(request: any, response: any, useMock: boolean = false): Promise<any> {
    if (useMock) {
        return require('./../mocks/predict/forums/reddit-forums.json');
    }

    const data = await Utils.puppeteerScrape(
        'reddit',
        'https://www.reddit.com/r/investing/rising',
        'https://www.reddit.com',
        '.Post',
        {
            url: 'a.SQnoC3ObvgnGjWt90zD9Z',
            title: 'a.SQnoC3ObvgnGjWt90zD9Z h3',
            description: '.STit0dLageRsa2yR4te_b',
            date: '._3jOxDPIQ0KaOWpzvSQo-1s'
        }
    );

    return data;
}

exports.get4ChanForums = async function(request: any, response: any, useMock: boolean = false): Promise<any> {
    if (useMock) {
        return require('./../mocks/predict/forums/four-chan-forums.json');
    }

    const data = await Utils.puppeteerScrape(
        '4-chan',
        'http://boards.4channel.org/biz',
        'http://boards.4channel.org/biz/',
        '.thread',
        {
            url: '.replylink',
            title: '.postMessage',
            date: '.dateTime'
        }
    );

    return data.length >= 2 ? _.slice(data, 2) : data;
}