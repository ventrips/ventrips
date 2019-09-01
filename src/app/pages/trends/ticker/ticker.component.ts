import { Component, OnInit, Input, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser, isPlatformServer } from '@angular/common';
import * as moment from 'moment';
import * as _ from 'lodash';

@Component({
  selector: 'app-ticker',
  templateUrl: './ticker.component.html',
  styleUrls: ['./ticker.component.scss']
})
export class TickerComponent implements OnInit {
  @Input() ticker;

  public _ = _;

  constructor(
    @Inject(PLATFORM_ID) private platformId: any
  ) { }

  ngOnInit() {
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
    return `https://www.marketwatch.com/investing/stock/${symbol}`;
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
}
