import * as functions from 'firebase-functions';
// import * as admin from 'firebase-admin';
import * as _ from 'lodash';
import { cors } from './utils';
const RequestPromise = require('request-promise');
const UserAgent = require('user-agents');
const { ExploreTrendRequest } = require('g-trends');
const isBullish = require('is-bullish');

// import { getSingleYahooFinanceAPI } from './yahoo-finance-api';
// const db = admin.firestore();

const displayQuickViewText = (data: Array<object>): Array<string> => {
    return _.map(data, (datum: object) => {
        const symbol: string = _.get(datum, ['yahooFinance', 'symbol']);
        const fullExchangeName: string = _.get(datum, ['yahooFinance', 'fullExchangeName']);
        const regularMarketPrice: number = _.get(datum, ['yahooFinance', 'regularMarketPrice']);
        const regularMarketVolume: number = _.get(datum, ['yahooFinance', 'regularMarketVolume'], 0);
        const averageDailyVolume10Day: number =  _.get(datum, ['yahooFinance', 'averageDailyVolume10Day'], 0);
        const volumeMultiplied: number = _.floor(regularMarketVolume / averageDailyVolume10Day);
        return `${fullExchangeName}: ${symbol} @ ${regularMarketPrice} | Volume: ${abbreviateNumbers(regularMarketVolume)} (${volumeMultiplied}X)`
    });
};

const abbreviateNumbers = (n: number): string => {
    const round = (n: number, precision: number): number => {
        const prec = Math.pow(10, precision);
        return Math.round(n*prec)/prec;
    };
    const pow: number = Math.pow, floor = Math.floor, abs = Math.abs, log = Math.log;
    const abbrev: string = 'KMB'; // could be an array of strings: [' m', ' Mo', ' Md']
    let base: number = floor(log(abs(n))/log(1000));
    const suffix: string = abbrev[Math.min(2, base - 1)];
    base = abbrev.indexOf(suffix) + 1;
    return suffix ? round(n/pow(1000,base),2)+suffix : ''+n;
}

const pastDaysHighestVolume = (datum: object): any => {
    let alphaVantage: Array<object> = _.get(datum, ['alphaVantage'], []);
    return _.maxBy(alphaVantage, (value: object) => _.get(value, ['volume']));
}

const past7DaysHighestGoogleTrend = (datum: object): any => {
    let googleTrends: Array<object> = _.get(datum, ['googleTrends'], []);
    return _.maxBy(googleTrends, (value: object) => {
        return _.get(value, ['trend']);
    });
}

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
        const yahooFinanceStockDetails: Array<object> = _.map(yahooFinanceResponse, (datum: object) => {
            const stockSymbol: string = _.get(datum, ['symbol']);
            return {
                symbol: stockSymbol,
                financeUrl: `https://finance.yahoo.com/quote/${stockSymbol}/history`,
                trendsUrl: `https://trends.google.com/trends/explore?date=now%207-d&geo=US&q=${stockSymbol}%20stock`,
                yahooFinance: datum
            }
        });
        resolve(yahooFinanceStockDetails);
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
        const alphaVantageOptions: object = _.assign({
            uri: 'https://www.alphavantage.co/query',
            qs: {
                function: 'TIME_SERIES_DAILY',
                symbol: stockSymbol,
                outputsize: 'compact',
                apikey: 'J5LLHCUPAQ0CR0IN'
            }
        }, defaultUserAgentOptions);
        const alphaVantageResponse: any = await RequestPromise(alphaVantageOptions);
        const alphaVantageData: any = _.sortBy(_.map(_.get(alphaVantageResponse, ['Time Series (Daily)'], []), (value: any, key: string) => {
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
    const defaultUserAgentOptions: object = {
        headers: {
            'User-Agent': ((new UserAgent()).data).toString()
        },
        json: true
    };
    return new Promise(async (resolve: any) => {
        const googleTrends = new ExploreTrendRequest();
        const googleTrendsResponse = await googleTrends.past7Days().addKeyword(`${stockSymbol} stock`, 'US').download()
        const googleTrendsData: Array<object> = _.compact(_.map(googleTrendsResponse, (item: any) => {
            const isNumeric: boolean = /^\d+$/.test(item[1]);
            if (!isNumeric) {
                return null;
            }
            return { date: item[0], trend: _.toNumber(item[1]) }
        }));
        resolve(googleTrendsData);
    });
};

const getAllStocksByPriceRange = async (minPrice: number, maxPrice: number): Promise<Array<object>> => {
    return new Promise(async (resolve: any) => {
        const finnHubStockSymbols: Array<string> = await getFinnHubStockSymbols();
        const yahooFinanceStockDetails: Array<object> = await getYahooFinanceStockDetails(finnHubStockSymbols);
        const filteredYahooFinanceStockDetails = _.filter(yahooFinanceStockDetails, (yahooFinanceStock: object) => {
            const regularMarketPrice: number = _.get(yahooFinanceStock, ['yahooFinance', 'regularMarketPrice']);
            const fullExchangeName: number = _.get(yahooFinanceStock, ['yahooFinance', 'fullExchangeName']);
            return (regularMarketPrice >= minPrice && regularMarketPrice <= maxPrice)
                    && !_.includes(['Other OTC'], fullExchangeName);
        });
        resolve(filteredYahooFinanceStockDetails);
    });
};

export const getAllPennyStocks = functions.runWith({ timeoutSeconds: 540, memory: '512MB' }).https.onRequest(async (request, response): Promise<any> => {
    const minPrice: number = _.toNumber(_.get(request, ['query', 'minPrice'], 0));
    const maxPrice: number = _.toNumber(_.get(request, ['query', 'maxPrice'], 0));
    const minVolume: number = _.toNumber(_.get(request, ['query', 'minVolume'], 0));
    const volumeHasMultipliedBy: number = _.toNumber(_.get(request, ['query', 'volumeHasMultipliedBy'], 0));
    const sortByField: string = _.get(request, ['query', 'sortByField']);
    const filterField: string = _.get(request, ['query', 'filter']);

    try {
        let allStocksByPriceRange: Array<object> = await getAllStocksByPriceRange(minPrice, maxPrice);
        let data: Array<object> = allStocksByPriceRange;
        if (!_.isNil(minVolume)) {
            data = _.filter(data, (datum: object) => _.get(datum, ['yahooFinance', 'regularMarketVolume']) >= minVolume);
        }
        if (!_.isNil(volumeHasMultipliedBy)) {
            data = _.filter(data, (datum: object) => {
                const regularMarketVolume: number =  _.get(datum, ['yahooFinance', 'regularMarketVolume']);
                const averageDailyVolume10Day: number =  _.get(datum, ['yahooFinance', 'averageDailyVolume10Day']);
                const volumeMultiplied: number = _.floor(regularMarketVolume / averageDailyVolume10Day);
                return volumeMultiplied >= volumeHasMultipliedBy;
            });
        }
        if (!_.isNil(sortByField)) {
            data = _.orderBy(data, (datum: object) => {
                return _.get(datum, ['yahooFinance', sortByField], 0);
            }, 'desc');
        };

        data = await getExternalSources(data);

        const final: any = {
            results: _.get(data, ['length'], 0),
            symbols: displayQuickViewText(data),
            data
        };
        if (_.isEqual(filterField, 'stats')) {
            _.forEach(final['data'], (datum: any) => {
                delete datum['yahooFinance'];
                delete datum['alphaVantage'];
                delete datum['googleTrends'];
            });
        }
        console.log(JSON.stringify(data, null, 4));
        response.send(final);
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
        const minPrice: number = 0;
        const maxPrice: number = 500;
        const minFiftyTwoWeekHighChangePercent: number = -0.30;
        const minFiftyTwoWeekLow: number = 1;
        const minRegularMarketVolume: number = 5000000;
        const minThreshold: number = 0.75;
        const minMarketCap: number = 1000000000;

        data = _.filter(data, (item: object) => {
            const regularMarketPrice: number = _.get(item, ['yahooFinance', 'regularMarketPrice']);

            const regularMarketVolume: number = _.get(item, ['yahooFinance', 'regularMarketVolume']);
            const averageDailyVolume10Day: number = _.get(item, ['yahooFinance', 'averageDailyVolume10Day']);
            const averageDailyVolume3Month: number = _.get(item, ['yahooFinance', 'averageDailyVolume3Month']);

            const regularMarketChangePercent: number = _.get(item, ['yahooFinance', 'regularMarketChangePercent']);
            const fiftyDayAverageChangePercent: number = _.get(item, ['yahooFinance', 'fiftyDayAverageChangePercent']);
            const twoHundredDayAverageChangePercent: number = _.get(item, ['yahooFinance', 'twoHundredDayAverageChangePercent']);

            const fiftyTwoWeekLowChangePercent: number = _.get(item, ['yahooFinance', 'fiftyTwoWeekLowChangePercent']);
            const fiftyTwoWeekHighChangePercent: number = _.get(item, ['yahooFinance', 'fiftyTwoWeekHighChangePercent']);

            const fiftyDayAverage: number = _.get(item, ['yahooFinance', 'fiftyDayAverage']);
            const twoHundredDayAverage: number = _.get(item, ['yahooFinance', 'twoHundredDayAverage']);

            const fiftyTwoWeekLow: number = _.get(item, ['yahooFinance', 'fiftyTwoWeekLow']);
            const fiftyTwoWeekHigh: number = _.get(item, ['yahooFinance', 'fiftyTwoWeekHigh']);

            const sharesOutstanding: number = _.get(item, ['yahooFinance', 'sharesOutstanding']);

            const marketCap: number = _.get(item, ['yahooFinance', 'marketCap']);
            const priceToBook: number = _.get(item, ['yahooFinance', 'priceToBook']);

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
            && ((regularMarketVolume >= minRegularMarketVolume) && ((averageDailyVolume10Day >= minRegularMarketVolume) || (averageDailyVolume3Month >= minRegularMarketVolume)))
            // Condition #8: Regular Market Volume must be close to 10-Day Volume Average OR 3-Month Volume Average
            && (((regularMarketVolume * minThreshold) >= averageDailyVolume10Day) || ((regularMarketVolume * minThreshold) >= averageDailyVolume3Month))
            // // Condition #9: Price To Book Ratio must not be too over-valued
            && (priceToBook <= 3)
            // // Condition #10: Market Cap must be greater than minMarketCap
            // && (marketCap >= minMarketCap)
            // TODO: GOOGLE TRENDS MUST BE >= 10
        });

        data = await getExternalSources(data);

        /* Step 6: Add Bullish Stats */
        for (const datum of data) {
            const stats: object = {
                isPriceBullish: isBullish(_.map(_.get(datum, ['alphaVantage'], []), (value) => _.get(value, ['open']))),
                isVolumeBullish: isBullish(_.map(_.get(datum, ['alphaVantage'], []), (value) => _.get(value, ['volume']))),
                isTrendBullish: isBullish(_.map(_.get(datum, ['googleTrends'], []), (value) => _.get(value, ['trend'])))
            };
            _.set(datum, 'stats', stats);
        }

        /* Step 7: Final Filter */
        // data = _.filter(data, (datum: any) => {
        //     return _.get(datum, ['stats', 'isPriceBullish'], false)
        //     && _.get(datum, ['stats', 'isVolumeBullish'], false)
        //     && _.get(datum, ['stats', 'isTrendBullish'], false)
        // });

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