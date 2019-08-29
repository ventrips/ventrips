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

  getGoogleSearch(query: string) {
    return `https://www.google.com/search?q=${query}`;
  }

  getGoogleTrends(item: any, timeRange: string = 'hourly') {
    let list = [];
    const symbol = _.toLower(_.get(item, ['symbol']));
    list.push(`buy ${symbol}`);
    list.push(`sell ${symbol}`);
    list.push(`${symbol} stock`);
    list.push(`${symbol} price`);
    list.push(`${symbol} news`);

    list = _.compact(list);

    if (_.isEqual(_.toLower(timeRange), 'yearly')) {
      return `https://trends.google.com/trends/explore?date=${moment().startOf('year').format('YYYY-MM-DD')}`
      + ' ' + `${moment().endOf('year').endOf('year').format('YYYY-MM-DD')}&geo=US&q=${list}`;
    }

    return `https://trends.google.com/trends/explore?date=now%201-H&geo=US&q=${list}`;
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
