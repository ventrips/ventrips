import { Component, OnInit, Input } from '@angular/core';
import * as moment from 'moment';
import * as _ from 'lodash';

@Component({
  selector: 'app-short-cuts',
  templateUrl: './short-cuts.component.html',
  styleUrls: ['./short-cuts.component.scss']
})
export class ShortCutsComponent implements OnInit {
  @Input() yahooFinance: any;

  constructor() { }

  ngOnInit() { }

  getSwingTradeBot(yahooFinance: any) {
    const symbol = _.get(yahooFinance, ['symbol']);

    return `https://swingtradebot.com/equities/${symbol}/`;
  }

  getTwitter(yahooFinance: any) {
    const symbol = _.get(yahooFinance, ['symbol']);
    return `https://twitter.com/search?f=tweets&q=%24${symbol}&src=typd`;
  }

  getTradingView(yahooFinance: any) {
    const symbol = _.get(yahooFinance, ['symbol']);
    const exchangeName = _.toUpper(_.get(yahooFinance, ['fullExchangeName']));
    if (_.includes(exchangeName, 'NASDAQ')) {
      return `https://www.tradingview.com/symbols/NASDAQ-${symbol}/?sort=recent`;
    }
    if (_.includes(exchangeName, 'NYSE')) {
      return `https://www.tradingview.com/symbols/NYSE-${symbol}/?sort=recent`;
    }
    return `https://www.tradingview.com/ideas/search/${symbol}`;
  }

  getMarketWatch(yahooFinance: any) {
    const symbol = _.get(yahooFinance, ['symbol']);
    return `https://www.marketwatch.com/investing/stock/${symbol}/charts`;
  }

  getNasdaq(yahooFinance: any) {
    const symbol = _.get(yahooFinance, ['symbol']);
    return `https://www.nasdaq.com/symbol/${symbol}`;
  }

  getStocktwits(yahooFinance: any) {
    const symbol = _.get(yahooFinance, ['symbol']);
    return `https://stocktwits.com/symbol/${symbol}`;
  }

  getYahooFinance(yahooFinance: any) {
    const symbol = _.get(yahooFinance, ['symbol']);
    return `https://finance.yahoo.com/quote/${symbol}`;
  }

  getGoogleSearch(yahooFinance: any) {
    const symbol = _.get(yahooFinance, ['symbol']);
    const exchangeName = _.toUpper(_.get(yahooFinance, ['fullExchangeName']));
    if (_.includes(exchangeName, 'NASDAQ')) {
      return `https://www.google.com/search?q=NASDAQ:${symbol}`;
    }
    if (_.includes(exchangeName, 'NYSEARCA')) {
      return `https://www.google.com/search?q=NYSEARCA:${symbol}`;
    }
    if (_.includes(exchangeName, 'NYSE')) {
      return `https://www.google.com/search?q=NYSE:${symbol}`;
    }
    return `https://www.google.com/search?q=${_.get(yahooFinance, ['symbol'])} stock`;
  }

  getGoogleTrends(yahooFinance: any, timeRange: string = 'now') {
    let list = [];
    const symbol = _.toLower(_.get(yahooFinance, ['symbol']));
    list.push(`${symbol} stock price`);
    list.push(`${symbol} price stock`);
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
}
