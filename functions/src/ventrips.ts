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

const HOLDINGS: Array<object> = [
    {
        filer: 'ARK',
        csvFilePath: './mocks/holdings/ark_investment_management_llc-current-2020-12-26_20_28_44.csv'
    },
    {
        filer: 'Vanguard',
        csvFilePath: './mocks/holdings/vanguard_group_inc-current-2020-12-26_18_46_42.csv'
    },
    {
        filer: 'Morgan Stanley',
        csvFilePath: './mocks/holdings/morgan_stanley-current-2020-12-26_21_07_22.csv'
    },
    {
        filer: 'JP Morgan',
        csvFilePath: './mocks/holdings/jpmorgan_chase_&_company-current-2020-12-26_18_46_23.csv'
    },
    {
        filer: 'Blackrock',
        csvFilePath: './mocks/holdings/blackrock_inc_-current-2020-12-26_20_49_21.csv'
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
                price: `${_.toNumber(_.get(yahooFinanceDatum, ['regularMarketPrice']))}`,
                priceChange: `${_.round(_.toNumber(_.get(yahooFinanceDatum, ['regularMarketChangePercent'])), 2)}`,
                volume: `${_.toNumber(_.get(yahooFinanceDatum, ['regularMarketVolume']))}`,
                volumeChange: `${_.round(volumeChange(yahooFinanceDatum), 2)}`,
                resources: {
                    googleCEO: `https://www.google.com/search?q=${longName}%20CEO`,
                    googleNews: `https://www.google.com/search?q=${stockSymbol}%20stock&tbm=nws&source=lnt&tbs=sbd:1&tbs=qdr:d`,
                    googleTrends: `https://trends.google.com/trends/explore?date=now%207-d&geo=US&q=${stockSymbol}%20stock`,
                    googleSearchForStock: `https://www.google.com/search?q=${stockSymbol}%20stock`,
                    youtube: `https://www.youtube.com/results?search_query=${longName}`,
                    reddit: `https://www.reddit.com/search/?q=${stockSymbol}&sort=new&type=link`,
                    yahooVolumeHistory: `https://finance.yahoo.com/quote/${stockSymbol}/history`,
                    twitter: `https://twitter.com/search?q=%24${stockSymbol}&src=typed_query`,
                    stockTwits: `https://stocktwits.com/symbol/${stockSymbol}`,
                    CNNForecast: `http://markets.money.cnn.com/research/quote/forecasts.asp?symb=${stockSymbol}`,
                    marketBeat: `${getMarketBeatUrl(yahooFinanceDatum)}`,
                    whaleWisdom: `https://whalewisdom.com/stock/${stockSymbol}`,
                },
                yahooFinance: yahooFinanceDatum
            }
            if (_.includes(fullExchangeName, ['OTHER OTC'])) {
                _.set(final, ['resources', 'OTCMarkets'], `https://www.otcmarkets.com/stock/${stockSymbol}/financials`);
            }
            return final;
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
    return new Promise(async (resolve: any) => {
        const googleTrends = new ExploreTrendRequest();
        const googleTrendsResponse = await googleTrends.past7Days().addKeyword(`${stockSymbol} stock`, 'US').download()
        const googleTrendsData: Array<object> = _.compact(_.map(googleTrendsResponse, (item: any) => {
            const isNumeric: boolean = /^\d+$/.test(item[1]);
            if (!isNumeric) {
                return null;
            }
            return { date: _.get(item, [0]).slice(0, 10), trend: _.toNumber(_.get(item, [1], 0)) }
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

export const getStocks = functions.runWith({ timeoutSeconds: 540, memory: '512MB' }).https.onRequest(async (request, response): Promise<any> => {
    const minPrice: number = _.toNumber(_.get(request, ['query', 'minPrice'], 0));
    const maxPrice: number = _.toNumber(_.get(request, ['query', 'maxPrice'], 0));
    const minVolume: number = _.toNumber(_.get(request, ['query', 'minVolume'], 0));
    const volumeHasMultipliedBy: number = _.toNumber(_.get(request, ['query', 'volumeHasMultipliedBy'], 0));
    const sortByFields: Array<string> = _.compact(_.split(_.get(request, ['query', 'sortByFields'], ''), ','));
    const statsOnly: string = JSON.parse(_.get(request, ['query', 'statsOnly'], false));
    const externalSources: boolean = JSON.parse(_.get(request, ['query', 'externalSources'], false));
    const stockSymbols: Array<string> = _.compact(_.split(_.get(request, ['query', 'stockSymbols'], ''), ','));
    const showHoldings: boolean = JSON.parse(_.get(request, ['query', 'showHoldings'], false));

    try {
        const allStocksByPriceRange: Array<object> = await getAllStocksByPriceRange(minPrice, maxPrice, stockSymbols);
        let data: Array<object> = allStocksByPriceRange;
        if (_.isEmpty(stockSymbols)) {
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
        const minPrice: number = 0;
        const maxPrice: number = 500;
        const minFiftyTwoWeekHighChangePercent: number = -0.30;
        const minFiftyTwoWeekLow: number = 1;
        const minRegularMarketVolume: number = 5000000;
        const minThreshold: number = 0.75;
        // const minMarketCap: number = 1000000000;

        data = _.filter(data, (item: object) => {
            const regularMarketPrice: number = _.get(item, ['yahooFinance', 'regularMarketPrice']);

            const regularMarketVolume: number = _.get(item, ['yahooFinance', 'regularMarketVolume']);
            const averageDailyVolume10Day: number = _.get(item, ['yahooFinance', 'averageDailyVolume10Day']);
            const averageDailyVolume3Month: number = _.get(item, ['yahooFinance', 'averageDailyVolume3Month']);

            // const regularMarketChangePercent: number = _.get(item, ['yahooFinance', 'regularMarketChangePercent']);
            const fiftyDayAverageChangePercent: number = _.get(item, ['yahooFinance', 'fiftyDayAverageChangePercent']);
            const twoHundredDayAverageChangePercent: number = _.get(item, ['yahooFinance', 'twoHundredDayAverageChangePercent']);

            // const fiftyTwoWeekLowChangePercent: number = _.get(item, ['yahooFinance', 'fiftyTwoWeekLowChangePercent']);
            const fiftyTwoWeekHighChangePercent: number = _.get(item, ['yahooFinance', 'fiftyTwoWeekHighChangePercent']);

            const fiftyDayAverage: number = _.get(item, ['yahooFinance', 'fiftyDayAverage']);
            const twoHundredDayAverage: number = _.get(item, ['yahooFinance', 'twoHundredDayAverage']);

            const fiftyTwoWeekLow: number = _.get(item, ['yahooFinance', 'fiftyTwoWeekLow']);
            // const fiftyTwoWeekHigh: number = _.get(item, ['yahooFinance', 'fiftyTwoWeekHigh']);

            // const sharesOutstanding: number = _.get(item, ['yahooFinance', 'sharesOutstanding']);

            // const marketCap: number = _.get(item, ['yahooFinance', 'marketCap']);
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