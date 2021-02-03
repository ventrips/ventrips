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
const moment = require('moment');
const fs = require('fs');

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
        /* Uncomment to use only specific keys */
        // const filteredKeys: object = {
        //     symbol: null,
        //     longName: null,
        //     fullExchangeName: null,
        //     marketCap: null,
        //     regularMarketPrice: null,
        //     fiftyDayAverage: null,
        //     twoHundredDayAverage: null,
        //     regularMarketChangePercent: null,
        //     regularMarketVolume: null,
        //     averageDailyVolume10Day: null,
        //     averageDailyVolume3Month: null,
        //     fiftyDayAverageChangePercent: null,
        //     twoHundredDayAverageChangePercent: null,
        // };
        // yahooFinanceResponse = _.map(yahooFinanceResponse, (yahooFinanceDatum: object) => {
        //     return _.pick(yahooFinanceDatum, _.keys(filteredKeys));
        // });
        const yahooFinanceFinalResponse: Array<any> = _.map(yahooFinanceResponse, (yahooFinanceDatum: object) => {
            return {
                yahooFinance: yahooFinanceDatum
            }
        });
        resolve(yahooFinanceFinalResponse);
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

const removeDuplicateDays = (dates) => {
    const comparisonValues = dates.map(v => v.valueOf());
    const uniqueDates = dates.filter((v,i) => comparisonValues.indexOf(v.valueOf()) == i);
    return uniqueDates;
}

const calcAveragePostsPer = (dates, per) => {
    const mapOf = {};
    let numberOf = 0;
    let totalNumberOfPosts = 0;
    dates.map((date) => {
        const monthKey =  date.year() + (per === 'month' ? '-' + date.month() : '');
        mapOf[monthKey] = (mapOf[monthKey] ? mapOf[monthKey] : 0) + 1;
    });
    Object.keys(mapOf).forEach((key) => {
        const numberOfPosts = mapOf[key];
        totalNumberOfPosts += numberOfPosts;
    });
    numberOf = Object.keys(mapOf).length;
    if (numberOf === 0 || !numberOf) {
        return 0;
    }
    return totalNumberOfPosts / numberOf;
}

const calcAverateDaysBetween = (dates) => {
    if (dates.length === 1) {
        return 0;
    }
    let totalDiffInDays = 0;

    for (let i = 1; i < dates.length - 1; i++) {
        const recentDay = dates[i - 1];
        const previousDay = dates[i];
        const diffInDays = recentDay.diff(previousDay, 'days');
        totalDiffInDays += diffInDays;
    }
    return totalDiffInDays / (dates.length - 1);
}

const calcNumberOfDaysSinceLastPublish = (dates) => {
    if (dates.length === 0) {
        return undefined;
    }
    const currentDate = moment();
    const diffDaysBetweenCurrent = currentDate.diff(dates[0], 'days');
    return diffDaysBetweenCurrent;
}

const calculateDateStats = (data) => {
    // const data = [{"symbol":"FTEG","data":[{"formColumnText":"QUALIF","reportLink":"/Document/9999999994-19-000119/","reportText":"Notice of Qualification","reportDate":"2019-08-14 00:15:10"},{"formColumnText":"UPLOAD","reportLink":"/Document/0000000000-19-012166/","reportText":"Securities Filing Public Response","reportDate":"2019-08-07"},{"formColumnText":"CORRESP","reportLink":"/Document/0001683168-19-002487/","reportText":"S.E.C. Correspondence Letter","reportDate":"2019-08-07"},{"formColumnText":"1-A POS","reportLink":"/Document/0001683168-19-002376/","reportText":"Form 1-A Amendment","reportDate":"2019-07-30 13:05:52"},{"formColumnText":"QUALIF","reportLink":"/Document/9999999994-19-000088/","reportText":"Notice of Qualification","reportDate":"2019-07-01 00:15:27"},{"formColumnText":"CORRESP","reportLink":"/Document/0001683168-19-002009/","reportText":"S.E.C. Correspondence Letter","reportDate":"2019-06-25 15:02:32"},{"formColumnText":"CORRESP","reportLink":"/Document/0001683168-19-002003/","reportText":"S.E.C. Correspondence Letter","reportDate":"2019-06-25 14:15:07"},{"formColumnText":"1-A/A","reportLink":"/Document/0001683168-19-001648/","reportText":"Offering Statement 1-A [Amended]","reportDate":"2019-05-20 16:09:52"},{"formColumnText":"1-A/A","reportLink":"/Document/0001683168-19-000774/","reportText":"Offering Statement 1-A [Amended]","reportDate":"2019-03-26 08:26:33"},{"formColumnText":"CORRESP","reportLink":"/Document/0001683168-19-000493/","reportText":"S.E.C. Correspondence Letter","reportDate":"2019-02-25 16:49:38"},{"formColumnText":"1-A/A","reportLink":"/Document/0001683168-19-000492/","reportText":"Offering Statement 1-A [Amended]","reportDate":"2019-02-25 16:43:43"},{"formColumnText":"UPLOAD","reportLink":"/Document/0000000000-19-001715/","reportText":"Securities Filing Public Response","reportDate":"2019-02-11 09:00:37"},{"formColumnText":"1-A","reportLink":"/Document/0001683168-18-003833/","reportText":"Offering Statement 1-A","reportDate":"2019-01-02 08:23:55"},{"formColumnText":"15-12G","reportLink":"/Document/0001352392-10-000117/","reportText":"Notice of termination of registration of a class of securities under Section 12(g)","reportDate":"2010-05-05 14:23:28"},{"formColumnText":"10QSB/A","reportLink":"/Document/0000932440-05-000006/","reportText":"Quarterly/Transition Report [Small Business] [Amended]","reportDate":"2005-01-06 13:18:30"},{"formColumnText":"10QSB","reportLink":"/Document/0000932440-04-000425/","reportText":"Quarterly/Transition Report [Small Business]","reportDate":"2004-11-12 16:50:35"},{"formColumnText":"10QSB/A","reportLink":"/Document/0000932440-04-000330/","reportText":"Quarterly/Transition Report [Small Business] [Amended]","reportDate":"2004-08-24 15:14:21"},{"formColumnText":"10QSB","reportLink":"/Document/0000932440-04-000325/","reportText":"Quarterly/Transition Report [Small Business]","reportDate":"2004-08-20 15:45:34"},{"formColumnText":"NT 10-Q","reportLink":"/Document/0000932440-04-000321/","reportText":"Notice of Late Quarterly Filing","reportDate":"2004-08-16 14:35:03"},{"formColumnText":"10QSB","reportLink":"/Document/0000932440-04-000224/","reportText":"Quarterly/Transition Report [Small Business]","reportDate":"2004-05-20 17:00:21"},{"formColumnText":"NT 10-Q","reportLink":"/Document/0000932440-04-000222/","reportText":"Notice of Late Quarterly Filing","reportDate":"2004-05-18 10:22:59"},{"formColumnText":"10KSB","reportLink":"/Document/0000932440-04-000144/","reportText":"Annual Report","reportDate":"2004-04-14 15:39:24"},{"formColumnText":"NT 10-K","reportLink":"/Document/0000932440-04-000116/","reportText":"Notice of Late Annual Filing","reportDate":"2004-03-30 14:56:48"},{"formColumnText":"10QSB","reportLink":"/Document/0000932440-03-000350/","reportText":"Quarterly/Transition Report [Small Business]","reportDate":"2003-11-14 17:48:41"},{"formColumnText":"10QSB","reportLink":"/Document/0000932440-03-000248/","reportText":"Quarterly/Transition Report [Small Business]","reportDate":"2003-08-14 16:02:57"},{"formColumnText":"10QSB","reportLink":"/Document/0000932440-03-000177/","reportText":"Quarterly/Transition Report [Small Business]","reportDate":"2003-05-15 15:04:04"},{"formColumnText":"10KSB","reportLink":"/Document/0000932440-03-000113/","reportText":"Annual Report","reportDate":"2003-03-31 15:03:04"},{"formColumnText":"5","reportLink":"/Document/0000932440-03-000089/","reportText":"Annual Security Ownership Report","reportDate":"2003-03-13 15:09:24"},{"formColumnText":"4","reportLink":"/Document/0000932440-02-000455/","reportText":"Security Sale/Purchase Record","reportDate":"2002-11-19 15:49:04"},{"formColumnText":"10QSB","reportLink":"/Document/0000932440-02-000442/","reportText":"Quarterly/Transition Report [Small Business]","reportDate":"2002-11-14 11:33:49"},{"formColumnText":"8-K","reportLink":"/Document/0000932440-02-000428/","reportText":"Current Report","reportDate":"2002-11-12 11:44:43"},{"formColumnText":"8-K","reportLink":"/Document/0000932440-02-000418/","reportText":"Current Report","reportDate":"2002-10-24 16:09:31"},{"formColumnText":"8-K","reportLink":"/Document/0000932440-02-000382/","reportText":"Current Report","reportDate":"2002-09-06 12:09:29"},{"formColumnText":"10QSB","reportLink":"/Document/0000932440-02-000361/","reportText":"Quarterly/Transition Report [Small Business]","reportDate":"2002-08-14 15:03:42"},{"formColumnText":"10KSB/A","reportLink":"/Document/0000932440-02-000335/","reportText":"Annual Report [Amended]","reportDate":"2002-07-11 16:15:40"},{"formColumnText":"10QSB/A","reportLink":"/Document/0000932440-02-000332/","reportText":"Quarterly/Transition Report [Small Business] [Amended]","reportDate":"2002-07-11 16:11:48"},{"formColumnText":"10QSB","reportLink":"/Document/0000932440-02-000248/","reportText":"Quarterly/Transition Report [Small Business]","reportDate":"2002-05-15 13:37:39"},{"formColumnText":"PRER14A","reportLink":"/Document/0000932440-02-000209/","reportText":"Preliminary revised proxy soliciting materials","reportDate":"2002-05-02 16:44:11"},{"formColumnText":"10KSB/A","reportLink":"/Document/0000932440-02-000207/","reportText":"Annual Report [Amended]","reportDate":"2002-05-02 16:32:31"},{"formColumnText":"10KSB","reportLink":"/Document/0000932440-02-000138/","reportText":"Annual Report","reportDate":"2002-03-19 00:00:00"},{"formColumnText":"PRE 14A","reportLink":"/Document/0000932440-02-000140/","reportText":"Preliminary Proxy Soliciting Materials","reportDate":"2002-03-19 00:00:00"},{"formColumnText":"PRE 14A","reportLink":"/Document/0000932440-02-000005/","reportText":"Preliminary Proxy Soliciting Materials","reportDate":"2002-01-09 00:00:00"},{"formColumnText":"10-Q","reportLink":"/Document/0000932440-01-500258/","reportText":"Quarterly Report","reportDate":"2001-11-13 00:00:00"},{"formColumnText":"4","reportLink":"/Document/0000891554-01-504845/","reportText":"Security Sale/Purchase Record","reportDate":"2001-09-07 00:00:00"},{"formColumnText":"SC 13D","reportLink":"/Document/0001095811-01-504598/","reportText":"Acquisition Statement","reportDate":"2001-08-27 00:00:00"},{"formColumnText":"8-K","reportLink":"/Document/0000932440-01-500194/","reportText":"Current Report","reportDate":"2001-08-24 00:00:00"},{"formColumnText":"10QSB","reportLink":"/Document/0000932440-01-500171/","reportText":"Quarterly/Transition Report [Small Business]","reportDate":"2001-08-14 00:00:00"},{"formColumnText":"10-Q","reportLink":"/Document/0000891554-01-502274/","reportText":"Quarterly Report","reportDate":"2001-04-27 00:00:00"},{"formColumnText":"10KSB","reportLink":"/Document/0000891554-01-502048/","reportText":"Annual Report","reportDate":"2001-04-12 00:00:00"},{"formColumnText":"NT 10-K","reportLink":"/Document/0000932440-01-000122/","reportText":"Notice of Late Annual Filing","reportDate":"2001-04-02 00:00:00"}]}];
    if (!data || data.length === 0) {
        return undefined;
    }
    const datesNoInvalid = data.filter((reportData) => {
        const reportDate = reportData.reportDate;
        const reportDateWithoutTimeStamp = reportDate.split(' ')[0];
        return (!_.includes(reportDateWithoutTimeStamp, '0000-00-00'));
    });
    const dates = datesNoInvalid.map((reportData) => {
        const reportDate = reportData.reportDate;
        const reportDateWithoutTimeStamp = reportDate.split(' ')[0];
        const momentDate = moment(reportDateWithoutTimeStamp);
        return momentDate;
    });
    const sortedDates = dates.sort((a, b) => b.valueOf() - a.valueOf());
    const uniqueDates = removeDuplicateDays(sortedDates);
    const averageNumberPostsPerYear = calcAveragePostsPer(sortedDates, 'year');
    const averageNumberPostsPerMonth = calcAveragePostsPer(sortedDates, 'month');
    const averageNumberOfDaysBetweenPosts = calcAverateDaysBetween(uniqueDates);
    const numberOfDaysSinceLastPublish = calcNumberOfDaysSinceLastPublish(sortedDates);
    const numberOfReports = sortedDates.length;
    return {
        averageNumberPostsPerYear,
        averageNumberPostsPerMonth,
        averageNumberOfDaysBetweenPosts,
        numberOfDaysSinceLastPublish,
        numberOfReports,
    }
}

const getSecDataObject = ($) => {
    const secData = [];
    try {
        const tableRowElements = $('#document_heading').parent().find('table tr');
        if (tableRowElements) {
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
        }
    }
    catch (err) {
        console.log('ERROR::getSecDataObject:: error getting sec report data');
    }
    return secData;
}

const getSecOtcObject = ($) => {
    const secData = [];
    try {
        const header = $('#documents h4');
        const hasOtcTable = _.includes(header.text().toLowerCase(), 'otc filings - financial reports');
        if (hasOtcTable) {
            const tableRowElements  =  header.eq(3).next('table').find('tr');
            tableRowElements.each(function(this: any, index: number) {
                if (index !== 0) {
                    const tableRowEl = $(this);
                    let reportObj: any = {};
                    const reportLink = tableRowEl.children().first().find('a').attr("href");
                    const reportText = tableRowEl.children().first().text();
                    const reportDate = tableRowEl.children().last().text();
                    reportObj.reportLink = reportLink;
                    reportObj.reportText = reportText;
                    reportObj.reportDate = reportDate;
                    secData.push(reportObj);
                }
            });
        }
    } catch (err) {
        console.log('ERROR::getSecOtcObject:: error getting otc report data');
    }
    return secData;
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

            const secData = getSecDataObject($);
            const secOtcData = getSecOtcObject($);
            const stats = calculateDateStats(secData);
            const secOtcStats = calculateDateStats(secOtcData);
            const mixedStats = calculateDateStats(secData.concat(secOtcData));
            resolve({
                'symbol': stockSymbol,
                data: secData,
                secOtcData,
                stats,
                secOtcStats,
                mixedStats,
            });
        })
        .catch((err: any) => {
            // Crawling failed...
            console.log('error on sec::', err);
            console.log(`err on ${stockSymbol}`);
            reject(err);
            return err;
        });
    });
}

const calcPriceGrowth = (data) => {
    let lowest = undefined;
    let highest = undefined;
    data.forEach((stockData) => {
        const currentLowest = stockData.low;
        const currentHighest = stockData.high;
        lowest = (lowest === undefined)
            ? currentLowest
            : (currentLowest < lowest)
                ? currentLowest
                : lowest;
        highest = (highest === undefined)
            ? currentHighest
            : (currentHighest > highest)
                ? currentHighest
                : highest;
    });
    const percentGrowth = (highest / lowest) * 100;

    return {
        lowestPrice: lowest,
        highestPrice: highest,
        percentGrowth,
    }
};

const numDaysBetween = function(d1: any, d2: any) {
    const diff = Math.abs(d1.getTime() - d2.getTime());
    return diff / (1000 * 60 * 60 * 24);
};

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
    cors(request, response);
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

const scrapeYahoo = ($, args: any) => {
    const withinDays = args[0];

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
        rowData['open'] = parseFloat(tableRowEl.children().eq(1).text());
        rowData['high'] = parseFloat(tableRowEl.children().eq(2).text());
        rowData['low'] = parseFloat(tableRowEl.children().eq(3).text());
        rowData['close'] = parseFloat(tableRowEl.children().eq(4).text());
        rowData['adjClose'] = parseFloat(tableRowEl.children().eq(5).text());
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
    // calculate lowest / highest price and % growth in timespan
    const growthStats = calcPriceGrowth(table);

    return {
        financialData: table,
        growthStats,
    };
};

const scrapeSec = ($, args: any) => {
    // Process html like you would with jQuery...
    const secData = getSecDataObject($);
    const secOtcData = getSecOtcObject($);
    const stats = calculateDateStats(secData);
    const secOtcStats = calculateDateStats(secOtcData);
    const mixedStats = calculateDateStats(secData.concat(secOtcData));
    return {
        data: secData,
        secOtcData,
        stats,
        secOtcStats,
        mixedStats,
    };
}

const validateDate = (testdate) => {
    const date_regex = /([\\\d,]+)/ ;
    return date_regex.test(testdate);
}

const validateNumber = (s) => {
    return s.match(/([\d,]+)/);
}

const generateStatsObject = (table) => {
    const stats = {};
    const referenceKey = {
        headerIndex: undefined,
        datesIndices: [],
    };
    const exclude = ['breakdown', 'ttm'];
    if (table && table.headers.length > 0 && table.rows.length > 0) {
        // find the index of the category name 
        table.headers.forEach((col, index) => {
            if (!moment.isMoment(col) && col.toLowerCase() === exclude[0]) {
                referenceKey['headerIndex'] = index;  
            } else if (moment.isMoment(col)) {
                referenceKey['datesIndices'].push({
                    date: col,
                    index,
                });
            }
        });
        // find the indices of the date stats
        table.rows.forEach((row) => {
            if (row && row.length > 0) {
                const headerName = row[referenceKey.headerIndex].replace(/[ ]/g, "_").toLowerCase();
                const values = [];
                referenceKey.datesIndices.forEach((date, index) => {
                    const value = row[date.index];
                    values.push({
                        date: date.date,
                        value: value
                    });
                    values.sort((a, b) => b.date.valueOf() - a.date.valueOf());
                });
                stats[headerName] = values;
            } 
        })
    }

    return stats;
}

const calcPercentProfitGrowth = (currentProfit, previousProfit) => {
    if (previousProfit === 0) {
        // ex current: 100 , previous: -100... 100% improvement or 0 - 0
        return currentProfit;
    } else {
        return ((currentProfit - previousProfit) / (previousProfit)) * 100;
    }
}

const generatePercentProfitGrowth = (data) => {
    const profitGrowth = {
        overallPercentProfitGrowth: undefined,
        averagePercentProfitGrowth: undefined,
    }

    let profit = _.get(data, 'gross_profit', []);
    profit = profit.filter((current) => {
        return current.value !== '-';
    });
    if (profit.length > 1) {
        let totalProfitGrowth = 0;
        profitGrowth.overallPercentProfitGrowth = calcPercentProfitGrowth(profit[0].value, profit[profit.length - 1].value);
        for (let i = profit.length - 1; i > 0; i--) {
             totalProfitGrowth += calcPercentProfitGrowth(profit[i - 1].value, profit[i].value);
        }
        profitGrowth.averagePercentProfitGrowth = (totalProfitGrowth / (profit.length - 1));
    }
    return profitGrowth;
}

const scrapeYahooFinancials = ($, args: any) => {
    // get the table headers.. excluding breakdown and TTM columns
    const tableEl = $("#Main").find("[data-test='" + 'qsp-financial' + "']");
    const tableHeaderRowEl = tableEl ? tableEl.find(`[class="D(tbr) C($primaryColor)"]`).children() : undefined;
    const table: any = {
        headers: [],
        rows: [],
    }

    // const exclude = ['breakdown', 'ttm'];
    tableHeaderRowEl.each(function(this: any, index: number) {
        const columnEl = $(this);
        const columnText = columnEl && columnEl.text() && columnEl.text() !== '' ? columnEl.text() : undefined;

        if (columnText && validateDate(columnText)) {
            const momentDateSplit = columnText.split('/');
            const month = momentDateSplit[0];
            const date = momentDateSplit[1];
            const year = momentDateSplit[2];
            table.headers.push(moment(`${year}-${month}-${date}`));
        } else {
        // if (!_.includes(columnText, exclude) && columnText) {
            table.headers.push(columnText);
        // }
        }

    });
    // get row data
    const tableRowsEl = tableEl ? tableEl.find(`[class="D(tbrg)"]`).find("[data-test='fin-row']") : [];

    tableRowsEl.each(function(this: any, index: number) {
        const rowData = [];
        const tableColumns = $(this).first().children().first().children();
        const tableColumnsEl = tableColumns ? tableColumns: [];
        tableColumnsEl.each(function(index2, this2) {
            const tableColumnEl = $(this2);
            const value = tableColumnEl.text();
            if (value && value !== '-' && validateNumber(value)) {
                rowData.push(parseFloat(value.replace(/,/g, '')));
            } else {
                rowData.push(value);
            }
        });
        table.rows.push(rowData);
    });

    const data = generateStatsObject(table);
    const percentProfitGrowth = generatePercentProfitGrowth(data);
    return {
        data,
        stats: {
            ...percentProfitGrowth,
        },
    };
}

const generateScrapeUrl = (url, stockSymbol) => {
    return url.replace('[symbol]', stockSymbol);
};

const scrapeUrl = async (scrapeFunction, url, stockSymbol: string, args: any[]) => {
    const shouldThrowError = _.get(args, '[1]');
    const mockSymbols = _.get(args, '[2]');

    return new Promise((resolve: any, reject: any) => {
        const uri = generateScrapeUrl(url, stockSymbol);
        const options = {
            uri: uri,
            headers: {
                'User-Agent': ((new UserAgent()).data).toString()
            },
            json: true,
            transform: (body: any) => Cheerio.load(body)
        };
        RequestPromise(options)
        .then(($: any) => {
            if (shouldThrowError && mockSymbols && mockSymbols.length > 0 && _.includes(mockSymbols, stockSymbol)) {
                throw new Error("mock error");
            }
            const data = scrapeFunction($, args);
            resolve({
                'symbol': stockSymbol,
                ...data,
            });
        })
        .catch((err: any) => {
            // Crawling failed...
            console.error(`ERROR on stock ${stockSymbol}::`, err);
            const errorObj = {
                'symbol': stockSymbol,
                'errorMsg': `ERROR on stock:: ${stockSymbol} for url:: ${uri} :: Error message:: ${_.get(err, 'message', '')}`,
            };
            reject(errorObj);
            return errorObj;
        });
    });
};

const DEBOUNCE_TIME_FOR_SCRAPE_CALL = 500;
const DEBOUNCE_TIME_FOR_BATCH_CALL = 1000;
const RETRY_DEBOUNCE_TIME = 5000;
const WITHIN_DAYS = 30;

const runDebounceCall = (scrapeFunction, url, stockSymbol: string, args: any[]) => {
    const promise = new Promise((resolve) => {
        const debounceFunction = _.debounce(async () => {
            try {
                const data = await scrapeUrl(scrapeFunction, url, stockSymbol, args);
                console.log('finishing ' + stockSymbol);
                resolve(data);
            } catch (err) {
                resolve(err)
            }
        }, DEBOUNCE_TIME_FOR_SCRAPE_CALL);
        debounceFunction();
    });
    return promise;
};

const runSingleBatch = async (scrapeFunction, url, chunkSymbols, runSequential, args: any[]) => {
    const promise = new Promise(async (resolve) => {
        const listOfScrapeCalls = [];
        if (runSequential) {
            for (let i = 0; i < chunkSymbols.length - 1; i++) {
                const d = await runDebounceCall(scrapeFunction, url, chunkSymbols[i], args);
                listOfScrapeCalls.push(d);
            }
        } else {
            chunkSymbols.forEach((currentSymbol: string, index: number) => {
                listOfScrapeCalls.push(runDebounceCall(scrapeFunction, url, currentSymbol, args));
            });
        }
        const data = runSequential ? listOfScrapeCalls : await Promise.all(listOfScrapeCalls);
        setTimeout(() => {
            resolve(data);
        }, DEBOUNCE_TIME_FOR_BATCH_CALL);
    });
    return promise;
}

const runBatchScript = async (stockSymbols, scrapeFunction, url, inBatchesOf, runSequential, args) => {
    const chunkStockSumbols = _.chunk(stockSymbols, inBatchesOf);
    const chunkPromises: any = [];
    let totalCount = 0;
    for (let i = 0; i < chunkStockSumbols.length; i++) {

        const chunkPromise = await runSingleBatch(scrapeFunction, url, chunkStockSumbols[i], runSequential, args);
        chunkPromises.push(chunkPromise);
        totalCount += chunkStockSumbols[i].length;
        console.log(`Finishing ${totalCount} of ${stockSymbols.length}`);
    }
    return chunkPromises.flat();
};

const generateScrapeScript = (scrapeFunction, url, inBatchesOf, runSequential) => {
    return async (stockSymbols, ...args2) => {;
        return await runBatchScript(stockSymbols, scrapeFunction, url, inBatchesOf, runSequential, args2);
    }
}

const debounceScrape = () => {
    return new Promise(async (resolve) => {
        console.log(`Attempting retry in ${RETRY_DEBOUNCE_TIME / 1000} seconds...`);
        setTimeout(() => {
            resolve(true);
        }, RETRY_DEBOUNCE_TIME);
    });
}

const getMissingStocks = (list) => {
    const missingStockObj = {
        missingStockSymbols: [],
        missingStockObjects: [],
    }
    if (list && list.length > 0) {
        list.forEach((currentStock) => {
            if (_.has(currentStock, 'errorMsg') && _.has(currentStock, 'symbol')) {
                missingStockObj.missingStockSymbols.push(currentStock.symbol);
                missingStockObj.missingStockObjects.push(currentStock);
            }
        });
    }
    return missingStockObj;
}

const retry = async (scrapeScript, missingStockSymbols, data, args) => {
    let finalData = data;
    if (missingStockSymbols.length > 0) {
        await debounceScrape();
        console.log(`Attempting to retry stocks: ${missingStockSymbols.join(', ')}`);
        const recoveredSecResponse = await scrapeScript(missingStockSymbols, ...args);
        // filter out stocks with errors in current list before merging recovered stocks...
        finalData = finalData.filter((currentStock) => {
            return !_.has(currentStock, 'errorMsg') && _.has(currentStock, 'symbol');
        })
        // merge recovered stocks
        finalData = finalData.concat(recoveredSecResponse);
    }
    return finalData;
};

/* #1: Uses FinnHub to fetch for all stocks, OTC Markets to filter out bad penny stocks, Yahoo Finance to filter by our criteria on price, market cap, and historic volumes */
export const getBestStocks1 = functions.runWith({ timeoutSeconds: 540, memory: '512MB' }).https.onRequest(async (request, response): Promise<any> => {
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
            if (_.isEqual(_.get(bestStock, ['yahooFinance', 'fullExchangeName']), 'Other OTC')) {
                const pennyStockFound: any = _.find(otcMarketsPennyStocks, { symbol: _.get(bestStock, ['yahooFinance', 'symbol']) });
                if (!_.isNil(pennyStockFound)) {
                    return _.assign(bestStock, { otcMarkets: pennyStockFound });
                };
            };
            return bestStock;
        });
        // 5. Filter stocks by criteria
        bestStocks = _.filter(bestStocks, (bestStock: object) => {
            const regularMarketPrice: number = _.toNumber(_.get(bestStock, ['yahooFinance', 'regularMarketPrice']));
            const marketCap: number = _.toNumber(_.get(bestStock, ['yahooFinance', 'marketCap']));
            const regularMarketVolume: number = _.toNumber(_.get(bestStock, ['yahooFinance', 'regularMarketVolume'], 0));
            const averageDailyVolume10Day: number = _.toNumber(_.get(bestStock, ['yahooFinance', 'averageDailyVolume10Day'], 0));
            const averageDailyVolume3Month: number = _.toNumber(_.get(bestStock, ['yahooFinance', 'averageDailyVolume3Month'], 0));
            const fiftyDayAverageChangePercent: number = _.toNumber(_.get(bestStock, ['yahooFinance', 'fiftyDayAverageChangePercent'], 0));
            const twoHundredDayAverageChangePercent: number = _.toNumber(_.get(bestStock, ['yahooFinance', 'twoHundredDayAverageChangePercent'], 0));
            const fiftyDayAverage: number = _.toNumber(_.get(bestStock, ['yahooFinance', 'fiftyDayAverage'], 0));
            const twoHundredDayAverage: number = _.toNumber(_.get(bestStock, ['yahooFinance', 'twoHundredDayAverage'], 0));

            return _.has(bestStock, ['yahooFinance', 'regularMarketVolume']) && (regularMarketVolume >= 1000) &&
                   _.has(bestStock, ['yahooFinance', 'averageDailyVolume10Day']) && (averageDailyVolume10Day >= 1000) &&
                   _.has(bestStock, ['yahooFinance', 'averageDailyVolume3Month']) && (averageDailyVolume3Month >= 1000) &&
                   (averageDailyVolume10Day >= averageDailyVolume3Month * 0.5) &&
                   _.has(bestStock, ['yahooFinance', 'regularMarketPrice']) && (regularMarketPrice >= 0.0001 && regularMarketPrice <= 10) &&
                   (fiftyDayAverage >= twoHundredDayAverage * 0.5) &&
                   _.has(bestStock, ['yahooFinance', 'marketCap']) && (marketCap >= 100 && marketCap <= 100000000) &&
                   _.has(bestStock, ['yahooFinance', 'fiftyDayAverageChangePercent']) && (fiftyDayAverageChangePercent >= 0) &&
                   _.has(bestStock, ['yahooFinance', 'twoHundredDayAverageChangePercent']) && (twoHundredDayAverageChangePercent >= 0)
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

        bestStocks = _.orderBy(bestStocks, (bestStock: object) => {
            return _.toNumber(_.get(bestStock, ['yahooFinance', 'regularMarketPrice'], 0));
        }, 'asc');

        const final: object = {
            results: _.get(bestStocks, ['length'], 0),
            data: bestStocks
        };
        let jsonData = JSON.stringify(final, null, 4);
        const today: any = new Date().toISOString().slice(0, 10);
        fs.writeFileSync(`./mocks/best-stocks/getBestStocks1-${today}.json`, jsonData);

        // console.log(JSON.stringify(final, null, 4));
        console.log(_.get(final, ['results'], 0));
        response.send(final);
    } catch (error) {
        console.log(JSON.stringify(error, null, 4));
        response.status(500).send(error);
    }
});

/* #2: Uses SEC to calculate reports and filter by our criteria on post frequency  */
export const getBestStocks2 = functions.runWith({ timeoutSeconds: 540, memory: '512MB' }).https.onRequest(async (request, response): Promise<any> => {
    const today: any = new Date().toISOString().slice(0, 10);
    cors(request, response);
    try {
        let bestStocks: Array<any>;
        // const bestStocksResponseJson = require('./../mocks/best-stocks/getBestStocks1-small-sample.json');
        const bestStocksResponseJson = require(`./../mocks/best-stocks/getBestStocks1-${today}.json`);
        if (_.isUndefined(bestStocksResponseJson) || _.isNull(bestStocksResponseJson || _.isEmpty(bestStocksResponseJson))) {
            throw new Error('No JSON found for best stocks');
        };
        bestStocks = bestStocksResponseJson.data;
        const stockSymbols = _.map(bestStocks, (bestStock: any) => _.get(bestStock, ['yahooFinance', 'symbol']));
        // 8. Get SEC Report Dates
        // let secResponse = await runStockBatchesForSec(stockSymbols, 100);
        const scrapeScript = generateScrapeScript(scrapeSec, `https://sec.report/Ticker/[symbol]`, 100, false);
        let secResponse = await scrapeScript(stockSymbols); // test add undefined, true, ['HJLI', 'ICCC']

        // attempt to retry api call
        const missingStockSymbols = _.get(getMissingStocks(secResponse), 'missingStockSymbols', []);
        secResponse = await retry(scrapeScript, missingStockSymbols, secResponse, []); // test add [undefined, true, ['ICCC']]
        // retrieve missing stocks to output in final json
        const missingStocks = _.get(getMissingStocks(secResponse), 'missingStockObjects', []);

        let storeSecJSON = JSON.stringify(secResponse, null, 4);
        fs.writeFileSync(`./mocks/best-stocks/SecData-${today}.json`, storeSecJSON);
        // let secResponse = require(`./../mocks/best-stocks/SecData-${today}.json`);

        // 9. Filter By Most Recent
        // binding sec data to each best stock...
        if (secResponse && secResponse.length > 0) {
            // remove null entries
            secResponse = secResponse.filter((current) => {
                return current;
            });
            secResponse.forEach((secData, i) => {
                bestStocks.forEach((bestStock, index) => {
                    if (_.isEqual(_.get(bestStock, ['yahooFinance', 'symbol']), secData.symbol)) {
                        bestStock.secData = _.get(secData, 'data', undefined);
                        bestStock.secOtcData = _.get(secData, 'secOtcData', undefined);
                        bestStock.secStats = _.get(secData, 'stats', undefined);
                        bestStock.secOtcStats = _.get(secData, 'secOtcStats', undefined);
                        bestStock.mixedStats = _.get(secData, 'mixedStats', undefined);
                    }
                    bestStocks[index] = bestStock;
                    // console.log(JSON.stringify(_.get(bestStocks, [index, 'secData'])));
                })
            });
        }

        // Now filtering based on reporting stats...
        bestStocks = _.filter(bestStocks, (bestStock: any) => {
            const numberOfDaysSinceLastPublish: number = _.toNumber(_.get(bestStock, 'mixedStats.numberOfDaysSinceLastPublish', 0));
            const averageNumberOfDaysBetweenPosts: number = _.toNumber(_.get(bestStock, 'mixedStats.averageNumberOfDaysBetweenPosts', 0));
            const numberOfReports: number = _.toNumber(_.get(bestStock, 'mixedStats.numberOfReports', 0));
            const averageNumberPostsPerYear: number = _.toNumber(_.get(bestStock, 'mixedStats.averageNumberPostsPerYear', 0));
            const averageNumberPostsPerMonth: number = _.toNumber(_.get(bestStock, 'mixedStats.averageNumberPostsPerMonth', 0));

            return numberOfDaysSinceLastPublish <= 30 &&
                   averageNumberOfDaysBetweenPosts <= 20 &&
                   numberOfReports >= 1 &&
                   averageNumberPostsPerYear >= 2 &&
                   averageNumberPostsPerMonth >= 2;
        });

        // Application Utilities
        // 1. Fetch News
        // 2. Fetch Social Media
        // 3. Fetch SEC Data

        // Export stock and its data into CSV
        // Feed CSV file into frontend
        // Frontend renders all filtered stocks from CSV and display more sec info, graphs, etc

        bestStocks = _.orderBy(bestStocks, (bestStock: object) => {
            return _.toNumber(_.get(bestStock, ['yahooFinance', 'regularMarketPrice'], 0));
        }, 'asc');

        const final: object = {
            results: _.get(bestStocks, ['length'], 0),
            data: bestStocks,
            missingStocks,
        };
        let jsonData = JSON.stringify(final, null, 4);
        fs.writeFileSync(`./mocks/best-stocks/getBestStocks2-${today}.json`, jsonData);

        // console.log(JSON.stringify(final, null, 4));
        console.log(_.get(final, ['results'], 0));
        response.send(final);
    } catch (error) {
        console.log(JSON.stringify(error, null, 4));
        response.status(500).send(error);
    }
});

/* #3: Uses Yahoo Finance to calculate and only look for growth stocks */
export const getBestStocks3 = functions.runWith({ timeoutSeconds: 540, memory: '512MB' }).https.onRequest(async (request, response): Promise<any> => {
    const today: any = new Date().toISOString().slice(0, 10);
    cors(request, response);
    try {
        let bestStocks: Array<any>;
        // const bestStocksResponseJson = require('./../mocks/best-stocks/getBestStocks2-small-sample.json');
        const bestStocksResponseJson = require(`./../mocks/best-stocks/getBestStocks2-${today}.json`);
        if (_.isUndefined(bestStocksResponseJson) || _.isNull(bestStocksResponseJson || _.isEmpty(bestStocksResponseJson))) {
            throw new Error('No JSON found for best stocks');
        };

        bestStocks = bestStocksResponseJson.data;
        const stockSymbols = _.map(bestStocks, (bestStock: any) => _.get(bestStock, ['yahooFinance', 'symbol']));

        // 8. Get SEC Report Dates
        // let financialResponse = require('./../mocks/best-stocks/financialResponse.json');

        const scrapeScript = generateScrapeScript(scrapeYahoo, `https://finance.yahoo.com/quote/[symbol]/history`, 50, false);
        let financialResponse = await scrapeScript(stockSymbols, WITHIN_DAYS); // test error handling.. add ,true, ['LBSR', 'SIML']

        // attempt to retry api call
        const missingStockSymbols = _.get(getMissingStocks(financialResponse), 'missingStockSymbols', []);
        financialResponse = await retry(scrapeScript, missingStockSymbols, financialResponse, [WITHIN_DAYS]); //test error handling.. add ,true, ['LBSR', 'SIML']
        // retrieve missing stocks to output in final json
        const missingStocks = _.get(getMissingStocks(financialResponse), 'missingStockObjects', []);

        let storeYahooFinanceJSON = JSON.stringify(financialResponse, null, 4);
        fs.writeFileSync(`./mocks/best-stocks/yahooFinanceData-${today}.json`, storeYahooFinanceJSON);

        // console.log('finance response:: ', financialResponse);
        // const jsonData2 = JSON.stringify(financialResponse, null, 4);
        // fs.writeFileSync(`./mocks/best-stocks/financialResponse.json`, jsonData2);

        // 9. Filter By Most Recent
        // binding sec data to each best stock...
        if (financialResponse && financialResponse.length > 0) {
            // remove null entries
            financialResponse = financialResponse.filter((current) => {
                return current;
            });
            financialResponse.forEach((financeData) => {
                bestStocks.forEach((bestStock, index) => {
                    if (_.isEqual(_.get(bestStock, ['yahooFinance', 'symbol']), financeData.symbol)) {
                        bestStock.financialData = _.get(financeData, 'financialData', undefined);
                        bestStock.growthStats = _.get(financeData, 'growthStats', undefined);
                    }
                    bestStocks[index] = bestStock;
                })
            });
        }

        // Now filtering based on reporting stats...
        bestStocks = _.filter(bestStocks, (bestStock: any) => {
            const percentGrowth: number = _.toNumber(_.get(bestStock, 'growthStats.percentGrowth', 0));

            return percentGrowth > 0 &&
                percentGrowth <= 500;
        });

        // Application Utilities
        // 1. Fetch News
        // 2. Fetch Social Media
        // 3. Fetch SEC Data

        // Export stock and its data into CSV
        // Feed CSV file into frontend
        // Frontend renders all filtered stocks from CSV and display more sec info, graphs, etc

        bestStocks = _.orderBy(bestStocks, (bestStock: object) => {
            return _.toNumber(_.get(bestStock, ['yahooFinance', 'regularMarketPrice'], 0));
        }, 'asc');

        const final: object = {
            results: _.get(bestStocks, ['length'], 0),
            data: bestStocks,
            missingStocks,
        };

        let jsonData = JSON.stringify(final, null, 4);
        fs.writeFileSync(`./mocks/best-stocks/getBestStocks3-${today}.json`, jsonData);
        // console.log(JSON.stringify(final, null, 4));
        console.log(_.get(final, ['results'], 0));
        response.send(final);
    } catch (error) {
        console.log(JSON.stringify(error, null, 4));
        response.status(500).send(error);
    }
});

/* #3: Uses Yahoo Finance to calculate and only look for growth stocks */
export const getBestStocks4 = functions.runWith({ timeoutSeconds: 540, memory: '512MB' }).https.onRequest(async (request, response): Promise<any> => {
    const today: any = new Date().toISOString().slice(0, 10);
    cors(request, response);
    try {
        let bestStocks: Array<any>;
        // const bestStocksResponseJson = require('./../mocks/best-stocks/getBestStocks3-small-sample-smaller.json');
        const bestStocksResponseJson = require(`./../mocks/best-stocks/getBestStocks3-${today}.json`);
        if (_.isUndefined(bestStocksResponseJson) || _.isNull(bestStocksResponseJson || _.isEmpty(bestStocksResponseJson))) {
            throw new Error('No JSON found for best stocks');
        };

        bestStocks = bestStocksResponseJson.data;
        const stockSymbols = _.map(bestStocks, (bestStock: any) => _.get(bestStock, ['yahooFinance', 'symbol']));

        // 8. Get SEC Report Dates
        // let financialResponse = require('./../mocks/best-stocks/financialResponse.json');

        const scrapeScript = generateScrapeScript(scrapeYahooFinancials, `https://finance.yahoo.com/quote/[symbol]/financials`, 50, true);
        let financialResponse = await scrapeScript(stockSymbols); // test error handling.. add ,true, ['LBSR', 'SIML']

        // attempt to retry api call
        const missingStockSymbols = _.get(getMissingStocks(financialResponse), 'missingStockSymbols', []);
        financialResponse = await retry(scrapeScript, missingStockSymbols, financialResponse, []); //test error handling.. add ,true, ['LBSR', 'SIML']
        // retrieve missing stocks to output in final json
        const missingStocks = _.get(getMissingStocks(financialResponse), 'missingStockObjects', []);

        let storeYahooStatementJSON = JSON.stringify(financialResponse, null, 4);
        fs.writeFileSync(`./mocks/best-stocks/yahooStatementData-${today}.json`, storeYahooStatementJSON);

        // console.log('finance response:: ', financialResponse);
        // const jsonData2 = JSON.stringify(financialResponse, null, 4);
        // fs.writeFileSync(`./mocks/best-stocks/financialResponse.json`, jsonData2);

        // 9. Filter By Most Recent
        // binding sec data to each best stock...
        if (financialResponse && financialResponse.length > 0) {
            // remove null entries
            financialResponse = financialResponse.filter((current) => {
                return current;
            });
            financialResponse.forEach((financeData) => {
                bestStocks.forEach((bestStock, index) => {
                    if (_.isEqual(_.get(bestStock, ['yahooFinance', 'symbol']), financeData.symbol)) {
                        bestStock.statementData = _.get(financeData, 'data', undefined);
                        bestStock.statementStats = _.get(financeData, 'stats', undefined);
                    }
                    bestStocks[index] = bestStock;
                })
            });
        }

        // Now filtering based on reporting stats...
        bestStocks = _.filter(bestStocks, (bestStock: any) => {
            const overallPercentProfitGrowth: number = _.toNumber(_.get(bestStock, 'statementStats.overallPercentProfitGrowth', 0));
            const averagePercentProfitGrowth: number = _.toNumber(_.get(bestStock, 'statementStats.averagePercentProfitGrowth', 0));
            
            return overallPercentProfitGrowth >= 0 &&
                averagePercentProfitGrowth >= 0;
        });

        // Application Utilities
        // 1. Fetch News
        // 2. Fetch Social Media
        // 3. Fetch SEC Data

        // Export stock and its data into CSV
        // Feed CSV file into frontend
        // Frontend renders all filtered stocks from CSV and display more sec info, graphs, etc

        bestStocks = _.orderBy(bestStocks, (bestStock: object) => {
            return _.toNumber(_.get(bestStock, ['yahooFinance', 'regularMarketPrice'], 0));
        }, 'asc');

        const final: object = {
            results: _.get(bestStocks, ['length'], 0),
            data: bestStocks,
            missingStocks,
        };

        let jsonData = JSON.stringify(final, null, 4);
        fs.writeFileSync(`./mocks/best-stocks/getBestStocks4-${today}.json`, jsonData);
        // console.log(JSON.stringify(final, null, 4));
        console.log(_.get(final, ['results'], 0));
        response.send(final);
    } catch (error) {
        console.log(JSON.stringify(error, null, 4));
        response.status(500).send(error);
    }
});