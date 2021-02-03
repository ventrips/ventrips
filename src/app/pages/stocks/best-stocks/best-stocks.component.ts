import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser, isPlatformServer } from '@angular/common';
import bestStocksJson from './../../../../../functions/mocks/best-stocks/getBestStocks4-2021-02-03.json';
import * as _ from 'lodash';

@Component({
  selector: 'app-best-stocks',
  templateUrl: './best-stocks.component.html',
  styleUrls: ['./best-stocks.component.scss']
})
export class BestStocksComponent implements OnInit {
  public stocks: any;
  public _ = _;

  constructor(
    @Inject(PLATFORM_ID) private platformId: any
  ) {
    this.stocks = bestStocksJson;
    // Add resource links
    _.forEach(_.get(this.stocks, ['data'], []), (stock: any) => {
      _.set(stock, 'resources', {
        OTCMarkets: `https://www.otcmarkets.com/stock/${_.get(stock, ['yahooFinance', 'symbol'])}/financials`,
        linkedin: `https://www.linkedin.com/jobs/search/?keywords=${_.get(stock, ['yahooFinance', 'longName'])}`,
        googleCEO: `https://www.google.com/search?q=${_.get(stock, ['yahooFinance', 'longName'])}%20CEO`,
        googleWebsite: `https://www.google.com/search?q=${_.get(stock, ['yahooFinance', 'longName'])}%20website`,
        googleNews: `https://www.google.com/search?q=${_.get(stock, ['yahooFinance', 'symbol'])}%20${_.get(stock, ['yahooFinance', 'longName'])}&tbm=nws&source=lnt&tbs=sbd:1&tbs=qdr:d`,
        googleTrends: `https://trends.google.com/trends/explore?date=today%201-m&geo=US&q=${_.get(stock, ['yahooFinance', 'symbol'])}%20stock`,
        googleSearchForStock: `https://www.google.com/search?q=${_.get(stock, ['yahooFinance', 'symbol'])}%20stock`,
        youtube: `https://www.youtube.com/results?search_query=${_.get(stock, ['yahooFinance', 'longName'])}`,
        reddit: `https://www.reddit.com/search/?q=${_.get(stock, ['yahooFinance', 'symbol'])}&sort=new&type=link`,
        yahooFinancials: `https://finance.yahoo.com/quote/${_.get(stock, ['yahooFinance', 'symbol'])}/financials`,
        yahooVolumeHistory: `https://finance.yahoo.com/quote/${_.get(stock, ['yahooFinance', 'symbol'])}/history`,
        twitter: `https://twitter.com/search?q=%24${_.get(stock, ['yahooFinance', 'symbol'])}&src=typed_query`,
        stockTwits: `https://stocktwits.com/symbol/${_.get(stock, ['yahooFinance', 'symbol'])}`,
        CNNForecast: `http://markets.money.cnn.com/research/quote/forecasts.asp?symb=${_.get(stock, ['yahooFinance', 'symbol'])}`,
        marketBeat: `${this.getMarketBeatUrl(_.get(stock, ['yahooFinance', 'symbol']), _.get(stock, ['yahooFinance', 'fullExchangeName']))}`,
        whaleWisdom: `https://whalewisdom.com/stock/${_.get(stock, ['yahooFinance', 'symbol'])}`,
        walletInvestor: `https://walletinvestor.com/stock-forecast/${_.get(stock, ['yahooFinance', 'symbol'])}-stock-prediction`
      });
    });
  }

  ngOnInit() {
  }

  getMarketBeatUrl = (symbol: string, fullExchangeName: string): string => {
    let newExchangeName: string;
    if (_.includes(_.toUpper(fullExchangeName), 'OTHER OTC')) {
        newExchangeName = 'OTCMKTS';
    }
    if (_.includes(_.toUpper(fullExchangeName), 'NASDAQ')) {
        newExchangeName = 'NASDAQ';
    }
    if (_.includes(_.toUpper(fullExchangeName), 'NYSE')) {
        newExchangeName = 'NYSE';
    }
    return `https://www.marketbeat.com/stocks/${newExchangeName}/${symbol}/`
  };

  isPlatformBrowser() {
    return isPlatformBrowser(this.platformId);
  }

}
