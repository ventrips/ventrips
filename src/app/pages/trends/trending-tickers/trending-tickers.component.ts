import { Component, OnInit, Input, Inject, PLATFORM_ID, OnChanges } from '@angular/core';
import { isPlatformBrowser, isPlatformServer } from '@angular/common';
import * as moment from 'moment';
import * as _ from 'lodash';

@Component({
  selector: 'app-trending-tickers',
  templateUrl: './trending-tickers.component.html',
  styleUrls: ['./trending-tickers.component.scss']
})
export class TrendingTickersComponent implements OnInit, OnChanges {
  @Input() tickers;

  public page = 1;
  public pageSize = 25;
  public collectionSize = 0;
  public keys = [];

  public _ = _;

  constructor(
    @Inject(PLATFORM_ID) private platformId: any
  ) { }

  ngOnChanges() {
    this.initialize();
  }

  ngOnInit() {
    this.initialize();
  }

  initialize() {
    this.tickers =  _.orderBy(this.tickers, [
      (ticker) => ticker.recommended,
      (ticker) => moment(this.getEarningsDate(ticker.earningsTimestamp)).isSameOrAfter(moment().startOf('day')),
      (ticker) => ticker.regularMarketChangePercent,
      (ticker) => ticker.finVizRank && ticker.stockTwitsRank && ticker.yahooRank,
      (ticker) => ticker.finVizRank && ticker.stockTwitsRank,
      (ticker) => ticker.finVizRank && ticker.yahooRank,
      (ticker) => ticker.stockTwitsRank && ticker.yahooRank,
      (ticker) => ticker.finVizRank,
      (ticker) => ticker.stockTwitsRank,
      (ticker) => ticker.yahooRank,
    ], ['desc', 'desc', 'desc', 'asc', 'asc', 'asc', 'asc', 'asc', 'asc', 'asc']);
    _.forEach(this.tickers, (ticker) => {
      this.keys = _.uniq(_.concat(this.keys, _.keys(ticker)));
    });
    this.keys = _.orderBy(this.keys, [
        (ticker) => _.isEqual(ticker, 'symbol'),
        (ticker) => _.isEqual(ticker, 'earningsTimestamp'),
        (ticker) => _.includes(ticker, 'regularMarketPrice'),
        (ticker) => _.includes(_.toLower(ticker), 'regular'),
        (ticker) => _.includes(_.toLower(ticker), 'average'),
        (ticker) => _.includes(_.toLower(ticker), 'market'),
        (ticker) => _.includes(_.toLower(ticker), 'forward')
      ],
      ['desc', 'desc', 'desc', 'desc', 'desc', 'desc', 'desc']
    );
    this.collectionSize = this.tickers.length;
    this.scrollTopTop();
  }

  isSymbol(key: string) {
    return _.includes(['symbol'], key);
  }

  isCurrency(key: string) {
    return _.includes([
      'regularMarketPrice',
      'regularMarketChange',
      'regularMarketDayLow',
      'regularMarketDayHigh',
      'regularMarketOpen',
      'fiftyDayAverage',
      'fiftyDayAverageChange',
      'twoHundredDayAverage',
      'twoHundredDayAverageChange',
      'postMarketPrice',
      'postMarketChange',
      'regularMarketPreviousClose',
      'fiftyTwoWeekLowChange',
      'fiftyTwoWeekHighChange',
      'fiftyTwoWeekLow',
      'fiftyTwoWeekHigh',
      'ask',
      'bid',
      'priceToBook',
      'bookValue'
      ], key)
  }

  isPercentage(key: string) {
    return _.includes([
      'fiftyDayAverageChangePercent',
      'postMarketChangePercent',
      'regularMarketChangePercent',
      'twoHundredDayAverageChangePercent',
      'fiftyTwoWeekLowChangePercent',
      'fiftyTwoWeekHighChangePercent'], key);
  }

  isNumber(key: string) {
    return _.includes([
      'regularMarketVolume',
      'averageDailyVolume10Day',
      'averageDailyVolume3Month',
      'marketCap',
      'sharesOutstanding',
      'trailingAnnualDividendRate',
      'trailingAnnualDividendYield',
      'epsForward',
      'forwardPE',
      'trailingPE',
      'epsTrailingTwelveMonths'], key);
  }

  isTimestamp(key: string) {
    return _.includes([
      'regularMarketTime',
      'postMarketTime',
      'dividendDate',
      'earningsTimestamp',
      'earningsTimestampStart',
      'earningsTimestampEnd',
      ], key)
  }

  isOther(key: string) {
    return !this.isSymbol(key) && !this.isCurrency(key) && !this.isPercentage(key) && !this.isNumber(key) && !this.isTimestamp(key);
  }

  getTradingView(ticker: any) {
    const symbol = _.get(ticker, ['symbol']);
    const exchangeName = _.toUpper(_.get(ticker, ['fullExchangeName']));
    if (_.includes(exchangeName, 'NASDAQ')) {
      return `https://www.tradingview.com/symbols/NASDAQ-${symbol}/?sort=recent`;
    }
    if (_.includes(exchangeName, 'NYSE')) {
      return `https://www.tradingview.com/symbols/NYSE-${symbol}/?sort=recent`;
    }
    return `https://www.tradingview.com/ideas/search/${symbol}`;
  }

  getMarketWatch(ticker: any) {
    const symbol = _.get(ticker, ['symbol']);
    return `https://www.marketwatch.com/investing/stock/${symbol}/charts`;
  }

  getNasdaq(ticker: any) {
    const symbol = _.get(ticker, ['symbol']);
    return `https://www.nasdaq.com/symbol/${symbol}`;
  }

  getStocktwits(ticker: any) {
    const symbol = _.get(ticker, ['symbol']);
    return `https://stocktwits.com/symbol/${symbol}`;
  }

  getYahooFinance(ticker: any) {
    const symbol = _.get(ticker, ['symbol']);
    return `https://finance.yahoo.com/quote/${symbol}`;
  }

  getGoogleSearch(ticker: any) {
    const symbol = _.get(ticker, ['symbol']);
    const exchangeName = _.toUpper(_.get(ticker, ['fullExchangeName']));
    if (_.includes(exchangeName, 'NASDAQ')) {
      return `https://www.google.com/search?q=NASDAQ:${symbol}`;
    }
    if (_.includes(exchangeName, 'NYSE')) {
      return `https://www.google.com/search?q=NYSE:${symbol}`;
    }
    return `https://www.google.com/search?q=${_.get(ticker, ['symbol'])} stock`;
  }

  getGoogleTrends(item: any, timeRange: string = 'now') {
    let list = [];
    const symbol = _.toLower(_.get(item, ['symbol']));
    list.push(`buy ${symbol}`);
    list.push(`sell ${symbol}`);
    list.push(`${symbol} stock`);
    list.push(`${symbol} price`);
    list.push(`${symbol} news`);

    list = _.compact(list);
    switch (timeRange) {
      case 'hourly':
        return `https://trends.google.com/trends/explore?date=now%204-H&geo=US&q=${list}`;
      case 'daily':
        return `https://trends.google.com/trends/explore?date=now%201-d&geo=US&q=${list}`;
      case 'weekly':
        return `https://trends.google.com/trends/explore?date=now%207-d&geo=US&q=${list}`;
      case 'yearly':
        return `https://trends.google.com/trends/explore?date=${moment().startOf('year').format('YYYY-MM-DD')}`
        + ' ' + `${moment().endOf('year').endOf('year').format('YYYY-MM-DD')}&geo=US&q=${list}`;
      default:
        return `https://trends.google.com/trends/explore?date=now%201-H&geo=US&q=${list}`;
    }
  }

  isPositive(change: string): boolean {
    let text = change;
    text = _.replace(text, '%', '');
    return _.toNumber(text) >= 0;
  }

  getEarningsDate(timeStamp: any): Date {
    if (_.isNil(timeStamp)) {
      return;
    };

    return new Date(timeStamp * 1000);
  }

  showFireIcon(ticker: any): boolean {
    let count = 0;
    if (_.get(ticker, ['finVizRank'])) {
      count++;
    }
    if (_.get(ticker, ['stockTwitsRank'])) {
      count++;
    }
    if (_.get(ticker, ['yahooRank'])) {
      count++;
    }
    return count > 1;
  }

  isPlatformBrowser() {
    return isPlatformBrowser(this.platformId);
  }

  scrollTopTop() {
    if (isPlatformServer(this.platformId)) { return; }
    this.page = 1;

    window.scrollTo(0, 0);
  }

  get data() {
    return this.tickers
      .map((ticker, i) => ({id: i + 1, ...ticker}))
      .slice((this.page - 1) * this.pageSize, (this.page - 1) * this.pageSize + this.pageSize);
  }
}
