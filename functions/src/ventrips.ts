import * as _ from 'lodash';
import { cors } from './utils';
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
const db = admin.firestore();
const { ExploreTrendRequest } = require('g-trends');
const RequestPromise = require('request-promise');
const UserAgent = require('user-agents');
const isBullish = require('is-bullish');
const csvToJson = require('csvtojson');
const Cheerio = require('cheerio');

const HOLDINGS: Array<object> = [
    {
        filer: 'ARK',
        csvFilePath: './mocks/holdings/ark_investment_management_llc-current-2021-01-17_21_49_28.csv'
    },
    {
        filer: 'Vanguard',
        csvFilePath: './mocks/holdings/vanguard_group_inc-current-2021-01-17_21_47_04.csv'
    },
    {
        filer: 'Morgan Stanley',
        csvFilePath: './mocks/holdings/morgan_stanley-current-2021-01-17_21_48_33.csv'
    },
    {
        filer: 'JP Morgan',
        csvFilePath: './mocks/holdings/jpmorgan_chase_&_company-current-2021-01-17_21_48_06.csv'
    },
    {
        filer: 'Blackrock',
        csvFilePath: './mocks/holdings/blackrock_inc_-current-2021-01-17_21_48_59.csv'
    }
]

const getMarketBeatUrl = (yahooFinanceDatum: object): string => {
    const symbol: string = _.get(yahooFinanceDatum, ['symbol']);
    const exchangeName: any = _.toUpper(_.get(yahooFinanceDatum, ['fullExchangeName']));
    let newExchangeName: string = '';
    if (_.includes(exchangeName, ['OTHER OTC'])) {
        newExchangeName = 'OTCMKTS';
    }
    if (_.includes(exchangeName, 'NASDAQ')) {
        newExchangeName = 'NASDAQ';
    }
    if (_.includes(exchangeName, 'NYSE')) {
        newExchangeName = 'NYSE';
    }
    return `https://www.marketbeat.com/stocks/${newExchangeName}/${symbol}/`
};

const volumeChange = (yahooFinanceDatum: object): number => {
    const regularMarketVolume: number = _.get(yahooFinanceDatum, ['regularMarketVolume'], 0);
    const averageDailyVolume10Day: number =  _.get(yahooFinanceDatum, ['averageDailyVolume10Day'], 0);
    return (regularMarketVolume - averageDailyVolume10Day) / averageDailyVolume10Day
}

const displayFriendlyVolume = (yahooFinanceDatum: object): string => {
    const regularMarketVolume: number = _.get(yahooFinanceDatum, ['regularMarketVolume'], 0);
    return `${abbreviateNumbers(regularMarketVolume)} (${volumeChange(yahooFinanceDatum)}%)`;
}

const displayQuickViewText = (data: Array<object>): Array<string> => {
    return _.map(data, (datum: object) => {
        const yahooFinanceDatum: object = _.get(datum, ['yahooFinance']);
        const symbol: string = _.get(yahooFinanceDatum, ['symbol']);
        const fullExchangeName: string = _.get(yahooFinanceDatum, ['fullExchangeName']);
        const regularMarketPrice: number = _.get(yahooFinanceDatum, ['regularMarketPrice']);
        return `${fullExchangeName}: ${symbol} @ $${regularMarketPrice} | Volume: ${displayFriendlyVolume(yahooFinanceDatum)}`
    });
};

const abbreviateNumbers = (n: number): string => {
    const round = (number: number, precision: number): number => {
        const prec = Math.pow(10, precision);
        return Math.round(number * prec) / prec;
    };
    const pow: any = Math.pow, floor = Math.floor, abs = Math.abs, log = Math.log;
    const abbrev: string = 'KMB'; // could be an array of strings: [' m', ' Mo', ' Md']
    let base: number = floor(log(abs(n))/log(1000));
    const suffix: any = abbrev[Math.min(2, base - 1)];
    base = abbrev.indexOf(suffix) + 1;
    return suffix ? round(n/pow(1000,base),2)+suffix : ''+n;
}

const isRecommended = (yahooFinanceDatum: object): boolean => {
    const minPrice: number = 0;
    const maxPrice: number = 100;
    const minFiftyTwoWeekHighChangePercent: number = -0.30;
    const minFiftyTwoWeekLow: number = 0;
    const minRegularMarketVolume: number = 5000000;
    const minThreshold: number = 0.75;
    const minMarketCap: number = 1000000;

    const regularMarketPrice: number = _.get(yahooFinanceDatum, ['regularMarketPrice']);

    const regularMarketVolume: number = _.get(yahooFinanceDatum, ['regularMarketVolume']);
    const averageDailyVolume10Day: number = _.get(yahooFinanceDatum, ['averageDailyVolume10Day']);
    const averageDailyVolume3Month: number = _.get(yahooFinanceDatum, ['averageDailyVolume3Month']);

    // const regularMarketChangePercent: number = _.get(yahooFinanceDatum, ['regularMarketChangePercent']);
    const fiftyDayAverageChangePercent: number = _.get(yahooFinanceDatum, ['fiftyDayAverageChangePercent']);
    const twoHundredDayAverageChangePercent: number = _.get(yahooFinanceDatum, ['twoHundredDayAverageChangePercent']);

    // const fiftyTwoWeekLowChangePercent: number = _.get(yahooFinanceDatum, ['fiftyTwoWeekLowChangePercent']);
    const fiftyTwoWeekHighChangePercent: number = _.get(yahooFinanceDatum, ['fiftyTwoWeekHighChangePercent']);

    const fiftyDayAverage: number = _.get(yahooFinanceDatum, ['fiftyDayAverage']);
    const twoHundredDayAverage: number = _.get(yahooFinanceDatum, ['twoHundredDayAverage']);

    const fiftyTwoWeekLow: number = _.get(yahooFinanceDatum, ['fiftyTwoWeekLow']);
    // const fiftyTwoWeekHigh: number = _.get(yahooFinanceDatum, ['fiftyTwoWeekHigh']);

    // const sharesOutstanding: number = _.get(yahooFinanceDatum, ['sharesOutstanding']);

    const marketCap: number = _.get(yahooFinanceDatum, ['marketCap']);
    const priceToBook: number = _.get(yahooFinanceDatum, ['priceToBook']);

    // Condition #1: Price must be within target price range
    return (regularMarketPrice >= minPrice && regularMarketPrice <= maxPrice)
    // Condition #2: 10-Day Average Volume must be greater than 3-Month Average Volume
    && (averageDailyVolume10Day >= averageDailyVolume3Month)
    // Condition #3: 50-Day Average Change Percent, 200-Day Average Change Percent must be greater than 0
    && ((fiftyDayAverageChangePercent >= 0) && (twoHundredDayAverageChangePercent >= 0))
    // Condition #4: 50-Day Average must be higher than 200-Day Average
    && (fiftyDayAverage >= twoHundredDayAverage)
    // Condition #5: 52-Week High Change Percent must be greater than minFiftyTwoWeekHighChangePercent
    && (fiftyTwoWeekHighChangePercent >= minFiftyTwoWeekHighChangePercent)
    // Condition #6: 52-Week Low Price must be greater than minFiftyTwoWeekLow
    && (fiftyTwoWeekLow >= minFiftyTwoWeekLow)
    // Condition #7: All Volumes must be greater than minRegularMarketVolume
    && (regularMarketVolume >= minRegularMarketVolume) || (averageDailyVolume10Day >= minRegularMarketVolume) // || (averageDailyVolume3Month >= minRegularMarketVolume)))
    // Condition #8: Regular Market Volume must be close to 10-Day Volume Average OR 3-Month Volume Average
    && (((regularMarketVolume * minThreshold) >= averageDailyVolume10Day) && ((regularMarketVolume * minThreshold) >= averageDailyVolume3Month))
    // // Condition #9: Price To Book Ratio must not be too over-valued
    && (priceToBook <= 3)
    // // Condition #10: Market Cap must be greater than minMarketCap
    && (marketCap >= minMarketCap)
    // TODO: GOOGLE TRENDS MUST BE >= 10
}

const pastDaysHighestVolume = (datum: object): any => {
    const yahooFinance: object = _.get(datum, ['yahooFinance']);
    const regularMarketVolume: number = _.get(yahooFinance, ['regularMarketVolume'], 0);
    const alphaVantage: Array<object> = _.get(datum, ['alphaVantage'], []);
    let highestVolume: any = _.maxBy(alphaVantage, (value: object) => _.get(value, ['volume']));
    highestVolume = {
        date: highestVolume.date,
        volume: highestVolume.volume
    }
    if (regularMarketVolume >= _.get(highestVolume, ['volume'])) {
        _.set(highestVolume, 'previousDate', highestVolume.date);
        _.set(highestVolume, 'previousVolume', highestVolume.date);
        highestVolume.date = new Date().toISOString().slice(0, 10);
        highestVolume.volume = regularMarketVolume;
    }
    return highestVolume;
}

const past7DaysHighestGoogleTrend = (datum: object): any => {
    const googleTrends: Array<object> = _.get(datum, ['googleTrends'], []);
    return _.maxBy(googleTrends, (value: object) => {
        return _.get(value, ['trend']);
    });
}

const getAllHoldings = async (filers: Array<object>): Promise<any> => {
    return new Promise(async (resolve) => {
        const data: object = {};
        for (const filerObj of filers) {
            const holdings: Array<object> = await csvToJson().fromFile(_.get(filerObj, ['csvFilePath']));
            _.set(data, _.get(filerObj, ['filer']), holdings);
        }
        resolve(data);
    });
};

const getExternalSources = async (data: Array<object>): Promise<Array<object>> => {
    for (const datum of data) {
        const stockSymbol: string = _.toLower(_.get(datum, ['symbol']));
        /* Get Alpha Vantage Data */
        const alphaVantageData: any = await getAlphaVantageStockChart(stockSymbol);
        _.set(datum, 'alphaVantage', alphaVantageData);
        /* Get Google Trends */
        const googleTrendsData: any = await getGoogleStockTrends(stockSymbol);
        _.set(datum, 'googleTrends', googleTrendsData);
        /* Get Bullish Stats */
        const stats: object = {
            isPriceBullish: isBullish(_.map(_.get(datum, ['alphaVantage'], []), (value) => _.get(value, ['open']))),
            isVolumeBullish: isBullish(_.map(_.get(datum, ['alphaVantage'], []), (value) => _.get(value, ['volume']))),
            isTrendBullish: isBullish(_.map(_.get(datum, ['googleTrends'], []), (value) => _.get(value, ['trend']))),
            pastDaysHighestVolume: pastDaysHighestVolume(datum),
            past7DaysHighestGoogleTrend: past7DaysHighestGoogleTrend(datum)
        };
        _.set(datum, 'stats', stats);
    };
    return data;
}


const getFinnHubStockSymbols = async (): Promise<Array<string>> => {
    const defaultUserAgentOptions: object = {
        headers: {
            'User-Agent': ((new UserAgent()).data).toString()
        },
        json: true
    };
    return new Promise(async (resolve: any) => {
        // resolve(['SPXL', 'SPY']); return;
        const finnHubOptions: object = _.assign({
            uri: 'https://finnhub.io/api/v1/stock/symbol',
            qs: {
                exchange: 'US',
                token: 'brno9hfrh5reu6jtc7k0'
            }
        }, defaultUserAgentOptions);
        const finnHubResponse = await RequestPromise(finnHubOptions);
        const finnHubAllTickerSymbols: Array<string> = _.map(finnHubResponse, (item: any) => item.symbol);
        resolve(finnHubAllTickerSymbols);
    });
};

const getYahooFinanceStockDetails = async (stockSymbols: Array<string>): Promise<Array<object>> => {
    const defaultUserAgentOptions: object = {
        headers: {
            'User-Agent': ((new UserAgent()).data).toString()
        },
        json: true
    };
    return new Promise(async (resolve: any) => {
        // resolve(require('./../mocks/ventrips/yahoo-finance.json')); return;
        let yahooFinanceResponse: Array<object> = [];
        const tickerSymbolChunks: any = _.chunk(stockSymbols, 1500);
        for (const tickerSymbolChunk of tickerSymbolChunks) {
            const yahooFinanceOptions: object = _.assign({
                uri: 'https://query2.finance.yahoo.com/v7/finance/quote',
                qs: {
                    symbols: _.toString(tickerSymbolChunk),
                }
            }, defaultUserAgentOptions);

            let yahooFinanceChunkResponse: Array<object> = await RequestPromise(yahooFinanceOptions);
            yahooFinanceChunkResponse = _.get(yahooFinanceChunkResponse, ['quoteResponse', 'result'], []);
            yahooFinanceResponse = _.concat(yahooFinanceResponse, yahooFinanceChunkResponse);
        };
        const yahooFinanceStockDetails: Array<object> = _.map(yahooFinanceResponse, (yahooFinanceDatum: object) => {
            const stockSymbol: string = _.get(yahooFinanceDatum, ['symbol']);
            const fullExchangeName: any = _.toUpper(_.get(yahooFinanceDatum, ['fullExchangeName']));
            const longName: string = _.get(yahooFinanceDatum, ['longName']);
            const final: object = {
                symbol: stockSymbol,
                company: `${_.get(yahooFinanceDatum, ['longName'])}`,
                fullExchangeName,
                price: `${_.toNumber(_.get(yahooFinanceDatum, ['regularMarketPrice']))}`,
                priceChange: `${_.round(_.toNumber(_.get(yahooFinanceDatum, ['regularMarketChangePercent'])), 2)}`,
                volume: `${_.toNumber(_.get(yahooFinanceDatum, ['regularMarketVolume']))}`,
                volumeChange: `${_.round(volumeChange(yahooFinanceDatum), 2)}`,
                marketCap: `${_.toNumber(_.get(yahooFinanceDatum, ['marketCap']))}`,
                resources: {
                    OTCMarkets: `https://www.otcmarkets.com/stock/${stockSymbol}/financials`,
                    linkedin: `https://www.linkedin.com/jobs/search/?keywords=${longName}`,
                    googleCEO: `https://www.google.com/search?q=${longName}%20CEO`,
                    googleWebsite: `https://www.google.com/search?q=${longName}%20website`,
                    googleNews: `https://www.google.com/search?q=${stockSymbol}%20${longName}&tbm=nws&source=lnt&tbs=sbd:1&tbs=qdr:d`,
                    googleTrends: `https://trends.google.com/trends/explore?date=today%201-m&geo=US&q=${stockSymbol}%20stock`,
                    googleSearchForStock: `https://www.google.com/search?q=${stockSymbol}%20stock`,
                    youtube: `https://www.youtube.com/results?search_query=${longName}`,
                    reddit: `https://www.reddit.com/search/?q=${stockSymbol}&sort=new&type=link`,
                    yahooVolumeHistory: `https://finance.yahoo.com/quote/${stockSymbol}/history`,
                    twitter: `https://twitter.com/search?q=%24${stockSymbol}&src=typed_query`,
                    stockTwits: `https://stocktwits.com/symbol/${stockSymbol}`,
                    CNNForecast: `http://markets.money.cnn.com/research/quote/forecasts.asp?symb=${stockSymbol}`,
                    marketBeat: `${getMarketBeatUrl(yahooFinanceDatum)}`,
                    whaleWisdom: `https://whalewisdom.com/stock/${stockSymbol}`,
                    walletInvestor: `https://walletinvestor.com/stock-forecast/${stockSymbol}-stock-prediction`
                },
                yahooFinance: yahooFinanceDatum
            }
            const recommended: boolean = isRecommended(yahooFinanceDatum);
            if (recommended) {
                _.set(final, 'recommended', recommended);
            }
            return final;
        });
        resolve(yahooFinanceStockDetails);
    });
};

const getYahooFinance = async (stockSymbols: Array<string>): Promise<Array<object>> => {
    const defaultUserAgentOptions: object = {
        headers: {
            'User-Agent': ((new UserAgent()).data).toString()
        },
        json: true
    };
    return new Promise(async (resolve: any) => {
        // resolve(require('./../mocks/ventrips/yahoo-finance.json')); return;
        let yahooFinanceResponse: Array<object> = [];
        const tickerSymbolChunks: any = _.chunk(stockSymbols, 1500);
        for (const tickerSymbolChunk of tickerSymbolChunks) {
            const yahooFinanceOptions: object = _.assign({
                uri: 'https://query2.finance.yahoo.com/v7/finance/quote',
                qs: {
                    symbols: _.toString(tickerSymbolChunk),
                }
            }, defaultUserAgentOptions);

            let yahooFinanceChunkResponse: Array<object> = await RequestPromise(yahooFinanceOptions);
            yahooFinanceChunkResponse = _.get(yahooFinanceChunkResponse, ['quoteResponse', 'result'], []);
            yahooFinanceResponse = _.concat(yahooFinanceResponse, yahooFinanceChunkResponse);
        };
        const filteredKeys: object = {
            symbol: null,
            longName: null,
            fullExchangeName: null,
            marketCap: null,
            regularMarketPrice: null,
            fiftyDayAverage: null,
            twoHundredDayAverage: null,
            regularMarketChangePercent: null,
            regularMarketVolume: null,
            averageDailyVolume10Day: null,
            averageDailyVolume3Month: null,
            fiftyDayAverageChangePercent: null,
            twoHundredDayAverageChangePercent: null,
        };
        const yahooFinanceStockDetails: Array<any> = _.map(yahooFinanceResponse, (yahooFinanceDatum: object) => {
            return _.pick(yahooFinanceDatum, _.keys(filteredKeys));
        });
        resolve(yahooFinanceStockDetails);
    });
};

const getOTCMarkets = async (): Promise<Array<object>> => {
    const defaultUserAgentOptions: object = {
        headers: {
            'User-Agent': ((new UserAgent()).data).toString()
        },
        json: true
    };
    return new Promise(async (resolve: any) => {
        const otcMarketsOptions: object = _.assign({
            uri: 'https://www.otcmarkets.com/research/stock-screener/api?pageSize=100000',
        }, defaultUserAgentOptions);

        const otcMarketsResponse: any = await RequestPromise(otcMarketsOptions);
        resolve(_.get(JSON.parse(otcMarketsResponse), ['stocks'], []));
    });
};

const getAlphaVantageStockChart = async (stockSymbol: string): Promise<Array<object>> => {
    const defaultUserAgentOptions: object = {
        headers: {
            'User-Agent': ((new UserAgent()).data).toString()
        },
        json: true
    };
    return new Promise(async (resolve: any) => {
        const interval = 'Daily'; // '1min';
        const alphaVantageOptions: object = _.assign({
            uri: 'https://www.alphavantage.co/query',
            qs: {
                function: 'TIME_SERIES_DAILY',
                // function: 'TIME_SERIES_INTRADAY',
                symbol: stockSymbol,
                // interval,
                outputsize: 'compact',
                apikey: 'J5LLHCUPAQ0CR0IN'
            }
        }, defaultUserAgentOptions);
        const alphaVantageResponse: any = await RequestPromise(alphaVantageOptions);
        const alphaVantageData: any = _.sortBy(_.map(_.get(alphaVantageResponse, [`Time Series (${interval})`], []), (value: any, key: string) => {
            return {
                date: key,
                open: _.toNumber(value['1. open']),
                high: _.toNumber(value['2. high']),
                low: _.toNumber(value['3. low']),
                close: _.toNumber(value['4. close']),
                volume: _.toNumber(value['5. volume']),
            }
        }), ['date']);
        resolve(alphaVantageData);
    });
};

const getGoogleStockTrends = async (stockSymbol: string): Promise<Array<object>> => {
    return new Promise(async (resolve: any) => {
        const googleTrends = new ExploreTrendRequest();
        const googleTrendsResponse = await googleTrends.past7Days().addKeyword(`${stockSymbol} stock`, 'US').download()
        const googleTrendsData: Array<object> = _.compact(_.map(googleTrendsResponse, (item: any) => {
            const isNumeric: boolean = /^\d+$/.test(item[1]);
            if (!isNumeric) {
                return null;
            }
            return { date: _.get(item, [0]), trend: _.toNumber(_.get(item, [1], 0)) }
        }));
        resolve(googleTrendsData);
    });
};

const getAllStocksByPriceRange = async (minPrice: number, maxPrice: number, symbols: Array<string> = []): Promise<Array<object>> => {
    let stockSymbols: Array<string> = symbols;
    return new Promise(async (resolve: any) => {
        if (_.isEmpty(stockSymbols)) {
            stockSymbols = await getFinnHubStockSymbols();
        }
        const yahooFinanceStockDetails: Array<object> = await getYahooFinanceStockDetails(stockSymbols);
        const filteredYahooFinanceStockDetails = _.filter(yahooFinanceStockDetails, (yahooFinanceStock: object) => {
            const regularMarketPrice: number = _.get(yahooFinanceStock, ['yahooFinance', 'regularMarketPrice']);
            return (regularMarketPrice >= minPrice && regularMarketPrice <= maxPrice);
        });
        resolve(filteredYahooFinanceStockDetails);
    });
};

const getVolumeFromYahoo = async (stockSymbol: string, ...args: any[]) => {
    const withinDays = args[0];
    const numDaysBetween = function(d1: any, d2: any) {
        const diff = Math.abs(d1.getTime() - d2.getTime());
        return diff / (1000 * 60 * 60 * 24);
    };
    return new Promise((resolve: any, reject: any) => {
        const options = {
            uri: `https://finance.yahoo.com/quote/${stockSymbol}/history`,
            headers: {
                'User-Agent': ((new UserAgent()).data).toString()
            },
            json: true,
            transform: (body: any) => Cheerio.load(body)
        };
        RequestPromise(options)
        .then(($: any) => {
            // Process html like you would with jQuery...
            const currentDate = new Date();
            const currentYear = currentDate.getFullYear();
            const currentMonth = currentDate.getMonth();
            const currentDay = currentDate.getDate();
            const table = [];
            const tableEl = $('table[data-test]');
            const hasTable = tableEl && tableEl.children() && tableEl.children().eq(1) && tableEl.children().eq(1).children();
            const listOfTableRows = hasTable
                ? hasTable
                : [];
            listOfTableRows.each(function(this: any, index: number) {
                let tableRowEl = $(this);
                const rowData = {};
                const date = tableRowEl.children().first().text();
                rowData['date'] = date;
                const currentDateFormatted = new Date(currentYear, currentMonth, currentDay);
                const stockDate = new Date(date);
                const volumeString = tableRowEl.children().last().text();
                rowData['volume'] = !volumeString || volumeString === '-'
                    ? '-'
                    : parseInt(volumeString.replace(/,/g, ''));
                if ((withinDays && numDaysBetween(stockDate, currentDateFormatted) <= withinDays) || !withinDays) {
                        table.push(rowData);
                }
            });
            resolve({
                'symbol': stockSymbol,
                volumeData: table,
            });
        })
        .catch((err: any) => {
            // Crawling failed...
            reject(err);
            return err;
        });
    });
}

const getDataForSec = async (stockSymbol: string, ...args: any[]) => {
    return new Promise((resolve: any, reject: any) => {
        const options = {
            uri: `https://sec.report/Ticker/${stockSymbol}`,
            headers: {
                'User-Agent': ((new UserAgent()).data).toString()
            },
            json: true,
            transform: (body: any) => Cheerio.load(body)
        };
        RequestPromise(options)
        .then(($: any) => {
            // Process html like you would with jQuery...
            const secData = [];
            const tableRowElements = $('#document_heading').parent().find('table tr'); // .//first().children().first().text()
            tableRowElements.each(function(this: any, index: number) {
                if (index !== 0) {
                    const tableRowEl= $(this);
                    let reportObj: any = {};
                    const formColumnText = tableRowEl.first().children().first().text();
                    const reportLink = tableRowEl.last().children().last().children().first().find('a').attr("href");
                    const reportText = tableRowEl.last().children().last().children().first().find('a').text();
                    const reportDate = tableRowEl.last().children().last().children().last().text();
                    reportObj.formColumnText = formColumnText;
                    reportObj.reportLink = reportLink;
                    reportObj.reportText = reportText;
                    reportObj.reportDate = reportDate;
                    secData.push(reportObj);
                }
            });
            resolve({
                'symbol': stockSymbol,
                data: secData,
            });
        })
        .catch((err: any) => {
            // Crawling failed...
            reject(err);
            return err;
        });
    });
}

const runAll = async (stockSymbols, scrapeFunction, ...args: any[]) => {
    const listOfVolumePromiseCalls = [];
    for (let i = 0; i < stockSymbols.length; i++) {
        listOfVolumePromiseCalls.push(scrapeFunction(stockSymbols[i], ...args));
    }
    const volumesList = await Promise.all(listOfVolumePromiseCalls);
    return volumesList;
}

const runPinkInfoScrape = (stockSymbol: string) => {
    const puppeteer = require('puppeteer');
    return new Promise(async (resolve, reject) => {
        try {
            const browser = await puppeteer.launch({args: ['--no-sandbox']});
            const page = await browser.newPage();
            // page.on('console', consoleObj => console.log(consoleObj.text()));
            await page.goto(`https://www.otcmarkets.com/stock/${stockSymbol}/profile`);
            await page.waitFor(1*1000);  //← unwanted workaround

            const otcObject = await page.evaluate(() => {
                const scrapeOtc = () => {
                    const rootEl = document.querySelectorAll('span');
                    const spanList = rootEl ? rootEl : [];
                    let otcObj: any = {
                        // hasPinkData: false,
                        // verifiedProfile: undefined,
                        // pennyStockExempt: false,
                        // transferAgentVerified: false,
                    };
                    spanList.forEach((span) => {
                        const spanContent = span.textContent;
                        if (spanContent.toLowerCase().indexOf('pink current information') >= 0){
                            otcObj.hasPinkData = true;
                        }
                        if (spanContent.toLowerCase().indexOf('verified profile') >= 0){
                            otcObj.verifiedProfile = spanContent;
                        }
                        if (spanContent.toLowerCase().indexOf('penny stock exempt') >= 0){
                            otcObj.pennyStockExempt = true;
                        }
                        if (spanContent.toLowerCase().indexOf('transfer agent verified') >= 0){
                            otcObj.transferAgentVerified = true;
                        }
                        if (spanContent.toLowerCase().indexOf('shell') >= 0){
                            otcObj.hasShell = true;
                        }
                    })
                    return otcObj;
                }

                const pinkData = scrapeOtc();
                return pinkData;
            });
            browser.close();
            return resolve({
                'symbol': stockSymbol,
                'data': otcObject,
            });
        } catch (e) {
            return reject(e);
        }
    })
}

const runPinkInfoBatch = async (chunk) => {
    const promise = new Promise(async (resolve) => {
        const listOfVolumePromiseCalls = [];
        chunk.forEach((currentSymbol: string) => {
            listOfVolumePromiseCalls.push(runPinkInfoScrape(currentSymbol));
        });
        const volumesList = await Promise.all(listOfVolumePromiseCalls);
        setTimeout(() => {
            resolve(volumesList);
        }, 500);
    });
    return promise;
}

const runPinkInfoCalls = async (stockSymbols) => {
    const chunkStockSumbols = _.chunk(stockSymbols, 10);
    const chunkPromises = [];
    for (let i = 0; i < chunkStockSumbols.length; i++) {
        const chunkPromise = await runPinkInfoBatch(chunkStockSumbols[i]);
        chunkPromises.push(chunkPromise);
        console.log('finishing batch #:', i + 1);
    }
    return chunkPromises;
}

export const getVolumeForStocks = functions.runWith({ timeoutSeconds: 540, memory: '512MB' }).https.onRequest(async (request:any, response): Promise<any> => {
    const symbols: Array<string> = _.compact(_.split(_.get(request, ['query', 'symbols'], ''), ','));
    const withinDays: number | undefined = _.get(request, ['query', 'withinDays'], undefined);
    //"SRMX,HCMC,NAKD,KYNC,AMC,PHIL,NOK,CTRM,ALKM,IGEX,HVCW,VPER,BRNW,BB,ILUS,AFOM,WRFX,BIEL,ETFM,RSHN,DSCR,MAXD,GRLF,AAL,PLTR,NSAV,UATG,SIRI,GE,RIG,FPVD,KPAY,HMNY,NEOM,NTRR,BBBY,IDEX,F,M,ICTY,SPCE,LUMN,PLUG,INQD,NPHC,T,IRNC,BNGO,NWGC,BIOL,TGRR,VSPC,DMNXF,FUBO,NAK,MAC,GRST,INTC,XSPA,GEVO,WKHS,TNXP,VIAC,ERIC,CCIV,RDWD,MJWL,KR,ZNGA,NNDM,SNDD,MJNA,GM,CBBT,TLRY,TTOO,DISCA,DD,XCLL,WTII,SWN,GOLD,CNK,XRT,SBFM,PURA,MLFB,GBHL,AUY,SKT,OPK,PBF,GHSI,KOSS,IVR,DISCK,FOXA,RMSL,CLVS,XLI,IRM,EGOC,FXI,TXMD,HPE,STX,VTMB,FTI,XLU,CUBV,KNDI,HST,FNMA,CLF,LPCN,SBUX,APRU,LGBI,APHA,NEE,AEO,INTK,IPOE,WBA,AHT,TRCH,CDEV,GTE,SPWR,NOVN,SDC,CETY,DVN,GNW,AR,CRSR,NHMD,MRVL,GEO,BKRKF,BGS,UMC,MIK,GOGO,RYCEY,UNVC,CX,AMWL,ON,HPQ,IEMG,GRCU,OEG,TENX,XLB,MYFT,ACRX,MARK,JNPR,AESE,UAMY,AVVH,AGNC,LLBO,DISH,FLEX,TBLT,LTHUQ,MUR,AAPT,KGKG"
    try {
        const data: any = await runAll(symbols, getVolumeFromYahoo, withinDays);
        response.set('Access-Control-Allow-Origin', "*")
        response.set('Access-Control-Allow-Methods', 'GET, POST')
        response.status(200).send(data.flat());
    } catch (err) {
        console.log(err);
        response.status(500).send("Could not get list of volumes for stock");
    }
});

export const getPinkInfoForStocks = functions.runWith({ timeoutSeconds: 540, memory: '512MB' }).https.onRequest(async (request:any, response): Promise<any> => {
    const symbols: Array<string> = _.compact(_.split(_.get(request, ['query', 'symbols'], ''), ','));
    try {
        const data: any = await runPinkInfoCalls(symbols);
        response.set('Access-Control-Allow-Origin', "*")
        response.set('Access-Control-Allow-Methods', 'GET, POST')
        response.status(200).send(data.flat());
    } catch (err) {
        console.log(err);
        response.status(500).send("Could not get list of volumes for stock");
    }
});

export const getSecData = functions.runWith({ timeoutSeconds: 540, memory: '512MB' }).https.onRequest(async (request:any, response): Promise<any> => {
    const symbols: Array<string> = _.compact(_.split(_.get(request, ['query', 'symbols'], ''), ','));
    try {
        const data: any = await runAll(symbols, getDataForSec);
        response.set('Access-Control-Allow-Origin', "*")
        response.set('Access-Control-Allow-Methods', 'GET, POST')
        response.status(200).send(data.flat());
    } catch (err) {
        console.log(err);
        response.status(500).send("Could not get list of volumes for stock");
    }
});

export const getStocks = functions.runWith({ timeoutSeconds: 540, memory: '512MB' }).https.onRequest(async (request:any, response): Promise<any> => {
    const minPrice: number = _.toNumber(_.get(request, ['query', 'minPrice'], 0));
    const maxPrice: number = _.toNumber(_.get(request, ['query', 'maxPrice'], 0));
    const minVolume: number = _.toNumber(_.get(request, ['query', 'minVolume'], 0));
    const minMarketCap: number = _.toNumber(_.get(request, ['query', 'minMarketCap'], 0));
    const volumeHasMultipliedBy: number = _.toNumber(_.get(request, ['query', 'volumeHasMultipliedBy'], 0));
    const sortByFields: Array<string> = _.compact(_.split(_.get(request, ['query', 'sortByFields'], ''), ','));
    const statsOnly: string = JSON.parse(_.get(request, ['query', 'statsOnly'], false));
    const externalSources: boolean = JSON.parse(_.get(request, ['query', 'externalSources'], false));
    const symbols: Array<string> = _.compact(_.split(_.get(request, ['query', 'symbols'], ''), ','));
    const showHoldings: boolean = JSON.parse(_.get(request, ['query', 'showHoldings'], false));
    const firebase: boolean = JSON.parse(_.get(request, ['query', 'firebase'], false));

    try {
        const allStocksByPriceRange: Array<object> = await getAllStocksByPriceRange(minPrice, maxPrice, symbols);
        let data: Array<object> = allStocksByPriceRange;
        if (_.isEmpty(symbols)) {
            if (!_.isNil(minVolume)) {
                data = _.filter(data, (datum: object) => _.get(datum, ['yahooFinance', 'regularMarketVolume']) >= minVolume);
            }
            if (!_.isNil(minMarketCap)) {
                data = _.filter(data, (datum: object) => _.get(datum, ['yahooFinance', 'marketCap']) >= minMarketCap);
            }
            if (!_.isNil(volumeHasMultipliedBy)) {
                data = _.filter(data, (datum: object) => {
                    const regularMarketVolume: number =  _.get(datum, ['yahooFinance', 'regularMarketVolume']);
                    const averageDailyVolume10Day: number =  _.get(datum, ['yahooFinance', 'averageDailyVolume10Day']);
                    const volumeMultiplied: number = _.floor(regularMarketVolume / averageDailyVolume10Day);
                    return volumeMultiplied >= volumeHasMultipliedBy;
                });
            }
        }
        if (!_.isEmpty(sortByFields)) {
            data = _.orderBy(data, (datum: object) => {
                return _.toNumber(_.get(datum, sortByFields, 0));
            }, 'desc');
        };

        if (showHoldings) {
            const allHoldings: object = await getAllHoldings(HOLDINGS);
            for (const datum of data) {
                _.forEach(allHoldings, (holdings: Array<object>, filer: string) => {
                    const stockSymbol: string = _.get(datum, ['yahooFinance', 'symbol'])
                    const holdingsFound: any = _.find(holdings, {'Symbol': stockSymbol});
                    if (!_.isNil(holdingsFound)) {
                        const firstOwned: string = _.get(holdingsFound, ['Qtr first owned']);
                        const changeType: string = _.toUpper(_.get(holdingsFound, ['Change Type']));
                        const avgPrice: number = _.toNumber(_.get(holdingsFound, ['Avg Price'], 0));
                        const changeInShares: number = _.toNumber(_.get(holdingsFound, ['Change in shares'], 0));
                        const sharesChange: number = _.round(_.toNumber(_.get(holdingsFound, ['% Change'], 0)), 2);
                        // const sharesHeld: number = _.toNumber(_.get(holdingsFound, ['Shares Held']));
                        // const percentOwned: number = _.toNumber(_.get(holdingsFound, ['% Ownership']));
                        // const sourceDate: string = _.get(holdingsFound, ['source_date'], '');
                        _.set(datum, ['holdings', filer], {
                            changeType: `${_.isEmpty(changeType) ? 'HOLDING' : changeType}`,
                            sharesChange,
                            changeInShares,
                            // sharesHeld,
                            // percentOwned,
                            avgPrice,
                            firstOwned
                        });
                    }
                });
            }
        }
        if (externalSources) {
            data = await getExternalSources(data);
        }

        let final: any = {
            results: _.get(data, ['length'], 0),
            // symbols: displayQuickViewText(data),
            data
        };
        if (statsOnly) {
            _.forEach(final['data'], (datum: any) => {
                delete datum['yahooFinance'];
                delete datum['alphaVantage'];
                delete datum['googleTrends'];
            });
        }
        const date: string = new Date().toISOString().slice(0, 10);
        final = _.assign(final, {updated: admin.firestore.FieldValue.serverTimestamp()});
        if (!firebase) {
            return response.send(final);
        }
        return db.doc(`stocks/${date}`).set(final).then(() => {
            return response.send(final);
        }).catch((error: any) => {
            return response.send(error);
        });
        // response.send(final);
    } catch (error) {
        response.send(error);
    }
});

export const getTrendingTickerSymbols = functions.runWith({ timeoutSeconds: 540, memory: '512MB' }).https.onRequest(async (request, response): Promise<any> => {
    cors(request, response);
    try {
        let data: any;
        /* Step 1: Get all ticker symbols in US Exchange from Finn Hub */
        const finnHubStockSymbols: Array<string> = await getFinnHubStockSymbols();
        /* Step 2: Get all yahoo data stock information of every ticker symbol from Yahoo Finance */
        data = await getYahooFinanceStockDetails(finnHubStockSymbols);

        /* Step 3: Filter stocks with custom logic */
        data = _.filter(data, (datum: object) => {
            const yahooFinanceDatum: any = _.get(datum, ['yahooFinance']);
            return isRecommended(yahooFinanceDatum);
        });

        // data = await getExternalSources(data);

        /* Step 6: Add Bullish Stats */
        // for (const datum of data) {
        //     const stats: object = {
        //         isPriceBullish: isBullish(_.map(_.get(datum, ['alphaVantage'], []), (value) => _.get(value, ['open']))),
        //         isVolumeBullish: isBullish(_.map(_.get(datum, ['alphaVantage'], []), (value) => _.get(value, ['volume']))),
        //         isTrendBullish: isBullish(_.map(_.get(datum, ['googleTrends'], []), (value) => _.get(value, ['trend'])))
        //     };
        //     _.set(datum, 'stats', stats);
        // }

        /* Step 7: Final Filter */
        // data = _.filter(data, (datum: any) => {
        //     return _.get(datum, ['stats', 'isPriceBullish'], false)
        //     && _.get(datum, ['stats', 'isVolumeBullish'], false)
        //     && _.get(datum, ['stats', 'isTrendBullish'], false)
        // });
        data = _.orderBy(data, (datum: object) => {
            return _.toNumber(_.get(datum, ['yahooFinance', 'regularMarketVolume'], 0));
        }, 'asc');

        const final: object = {
            results: _.get(data, ['length'], 0),
            symbols: displayQuickViewText(data),
            data
        };
        console.log(JSON.stringify(final, null, 4));
        response.send(final);
    } catch (error) {
        console.log(JSON.stringify(error, null, 4));
        response.status(500).send(error);
    }
});

export const getStockHoldingsInCommon = functions.runWith({ timeoutSeconds: 540, memory: '512MB' }).https.onRequest(async (request, response): Promise<any> => {
    cors(request, response);
    try {
        const qtrFirstOwnedText: string = `2020`;
        const minNumHoldings: number = 2;
        const maxPrice: number = 5;
        const includesChangeTypes: Array<string> = [
            'NEW'
            , 'ADDITION'
            , 'HOLDING'
            , 'REDUCTION'
        ];
        const sortByFields: string = 'price';

        let data: object;
        let holdingsObj: object = {};
        const allHoldings: object = await getAllHoldings(HOLDINGS);
        _.forEach(allHoldings, (holding: object, filer: string) => {
            _.forEach(holding, (stock: any) => {
                const stockSymbol: string = _.get(stock, ['Symbol']);
                const qtrFirstOwned: string = _.get(stock, ['Qtr first owned']);
                const change: string = _.toUpper(_.get(stock, ['Change Type']));
                const changeType: string = _.isEmpty(change) ? 'HOLDING' : change;
                if (_.includes(qtrFirstOwned, qtrFirstOwnedText) && _.includes(includesChangeTypes, changeType)) {
                    _.set(stock, ['filer'], filer);
                    _.set(holdingsObj, [stockSymbol, filer], stock);
                }
            });
        });
        let holdingsArray: Array<any> = [];
        _.forEach(holdingsObj, (holdingObj: object, stockSymbol: string) => {
            const values: Array<string> = _.values(holdingObj);
            const datum: object = {
                symbol: stockSymbol,
                holdings: values
            };
            holdingsArray.push(datum);
        });
        const filteredData: Array<any> = _.filter(holdingsArray, (datum: object) => {
            return _.get(datum, ['holdings']).length >= minNumHoldings;
        });
        const symbolsInCommon: Array<any> = _.map(filteredData, (datum: object) => _.get(datum, ['symbol']));
        data = await getYahooFinanceStockDetails(symbolsInCommon);
        _.forEach(data, (datum: object) => {
            _.merge(datum, _.find(holdingsArray, { symbol: _.get(datum, ['symbol'])}));
        });

        let final: Array<any> = _.filter(data, (datum: object) => {
            const price: number = _.toNumber(_.get(datum, ['price'], 0));
            return price <= maxPrice;
        });
        final = _.orderBy(final, (datum: object) => {
            return _.toNumber(_.get(datum, sortByFields, 0));
        }, 'asc');
        response.send(final);
    } catch (error) {
        console.log(JSON.stringify(error, null, 4));
        response.status(500).send(error);
    }
});

const isGoodPennyStock = (otcMarketPennyStock: any): boolean => {
    const isCaveatEmptor: boolean = _.get(otcMarketPennyStock, ['caveatEmptor'], true);
    const isPinkCurrentOrGreater: boolean = !_.includes(['Grey', 'Expert Market', 'Pink No Information'], _.get(otcMarketPennyStock, ['market']));
    const isCountryUSA: boolean = _.isEqual(_.get(otcMarketPennyStock, ['country']), 'USA');
    return isPinkCurrentOrGreater && !isCaveatEmptor && isCountryUSA;
}

export const getBestStocks = functions.runWith({ timeoutSeconds: 540, memory: '512MB' }).https.onRequest(async (request, response): Promise<any> => {
    cors(request, response);
    try {
        let bestStocks: Array<any>;
        // 1. Get All Stock Symbols From FinViz
        const finnHubStockSymbols: Array<string> = await getFinnHubStockSymbols();
        // 2. Get All U.S. Penny Stock Statuses From OTC Markets
        const otcMarketsPennyStocks: Array<any> = await getOTCMarkets();
        // 3. Filter stocks that are Pink Information or greater
        const badPennyStocks: Array<any> = _.filter(otcMarketsPennyStocks, (otcMarketPennyStock: any) => !isGoodPennyStock(otcMarketPennyStock));
        const badPennyStockSymbols: Array<string> = _.map(badPennyStocks, (badPennyStock: any) => _.get(badPennyStock, ['symbol']));
        const goodFinnHubStockSymbols: Array<string> =  _.filter(finnHubStockSymbols, (stockSymbol: string) => !_.includes(badPennyStockSymbols, stockSymbol));
        // 4. Get Financial Data from Yahoo Finance For All Filtered Stocks
        bestStocks = await getYahooFinance(goodFinnHubStockSymbols);
        // 5. Add OTC Details
        bestStocks = _.map(bestStocks, (bestStock: any) => {
            if (_.isEqual(_.get(bestStock, ['fullExchangeName']), 'Other OTC')) {
                const pennyStockFound: any = _.find(otcMarketsPennyStocks, { symbol: _.get(bestStock, ['symbol']) });
                if (!_.isNil(pennyStockFound)) {
                    return _.assign(bestStock, { otcMarkets: pennyStockFound });
                };
            };
            return bestStock;
        });
        // 5. Filter stocks by criteria
        bestStocks = _.filter(bestStocks, (bestStock: object) => {
            const regularMarketPrice: number = _.toNumber(_.get(bestStock, ['regularMarketPrice']));
            const marketCap: number = _.toNumber(_.get(bestStock, ['marketCap']));
            const regularMarketVolume: number = _.toNumber(_.get(bestStock, ['regularMarketVolume'], 0));
            const averageDailyVolume10Day: number = _.toNumber(_.get(bestStock, ['averageDailyVolume10Day'], 0));
            const averageDailyVolume3Month: number = _.toNumber(_.get(bestStock, ['averageDailyVolume3Month'], 0));
            const fiftyDayAverageChangePercent: number = _.toNumber(_.get(bestStock, ['fiftyDayAverageChangePercent'], 0));
            const twoHundredDayAverageChangePercent: number = _.toNumber(_.get(bestStock, ['twoHundredDayAverageChangePercent'], 0));
            const fiftyDayAverage: number = _.toNumber(_.get(bestStock, ['fiftyDayAverage'], 0));
            const twoHundredDayAverage: number = _.toNumber(_.get(bestStock, ['twoHundredDayAverage'], 0));

            return _.has(bestStock, 'regularMarketVolume') && (regularMarketVolume >= 1000) &&
                   _.has(bestStock, 'averageDailyVolume10Day') && (averageDailyVolume10Day >= 1000) &&
                   _.has(bestStock, 'averageDailyVolume3Month') && (averageDailyVolume3Month >= 1000) &&
                   (averageDailyVolume10Day >= averageDailyVolume3Month * 0.5) &&
                   _.has(bestStock, 'regularMarketPrice') && (regularMarketPrice >= 0.0001 && regularMarketPrice <= 100) &&
                   (fiftyDayAverage >= twoHundredDayAverage * 0.5) &&
                   _.has(bestStock, 'marketCap') && (marketCap >= 100 && marketCap <= 5000000000) &&
                   _.has(bestStock, 'fiftyDayAverageChangePercent') && (fiftyDayAverageChangePercent >= 0) &&
                   _.has(bestStock, 'twoHundredDayAverageChangePercent') && (twoHundredDayAverageChangePercent >= 0)
            ;
        });
        // 5. Filter All Stock Symbols based on Pink Status or Greater
        // 6. Calculate mean averages of volume and market price
        // 7. Filter stocks even further from mean calculations
        // 8. Get SEC Report Dates
        // 9. Filter By Most Recent

        // Application Utilities
        // 1. Fetch News
        // 2. Fetch Social Media
        // 3. Fetch SEC Data

        // Export stock and its data into CSV
        // Feed CSV file into frontend
        // Frontend renders all filtered stocks from CSV and display more sec info, graphs, etc

        bestStocks = _.orderBy(bestStocks, (datum: object) => {
            return _.toNumber(_.get(datum, ['regularMarketVolume'], 0));
        }, 'asc');

        const final: object = {
            results: _.get(bestStocks, ['length'], 0),
            data: bestStocks
        };

        // console.log(JSON.stringify(final, null, 4));
        console.log(_.get(final, ['results'], 0));
        response.send(final);
    } catch (error) {
        console.log(JSON.stringify(error, null, 4));
        response.status(500).send(error);
    }
});
