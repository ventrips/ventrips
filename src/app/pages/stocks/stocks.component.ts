import { Component, OnInit, Inject, PLATFORM_ID, ViewChild, ElementRef, Renderer2, NgZone } from '@angular/core';
import { isPlatformBrowser, isPlatformServer } from '@angular/common';
import { Observable, Subject, merge } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { debounceTime, distinctUntilChanged, map, tap, startWith } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { NgxSpinnerService } from 'ngx-spinner';
import { NgbTypeaheadConfig } from '@ng-bootstrap/ng-bootstrap';
import { AuthService } from '../../services/firestore/auth/auth.service';
import { environment } from '../../../environments/environment';
import { AngularFirestore } from '@angular/fire/firestore';
import { User } from '../../interfaces/user';
import { SsrService } from '../../services/firestore/ssr/ssr.service';
import * as moment from 'moment-timezone';
import * as _ from 'lodash';
import { parse } from '@fortawesome/fontawesome-svg-core';

@Component({
  selector: 'app-stocks',
  templateUrl: './stocks.component.html',
  styleUrls: ['./stocks.component.scss']
})
export class StocksComponent implements OnInit {
  public isLoading = true;
  public environment = environment;
  public _ = _;
  public user: User;
  public url: string;
  public title: string = `Free Historical Intraday Stock Charts`;
  public description: string  = `Current Historical Intraday Stock Charts to perform technical analysis. Look for trading strategies, patterns, and trends in 5 minute intervals of data`;
  public collection: string = 'symbol'
  public data: any;
  public stocksUpdated: any;
  public stocks: any;
  public volumeGraphLoading = false;
  public withinDays = '';
  public numberOfStocks = '';
  public numberOfStocksForPink = '';
  public pinkDataLoading = false;


  public numberOfStocksForSec = '';
  public secDataLoading = false;

  constructor(
    private afs: AngularFirestore,
    private http: HttpClient,
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private spinner: NgxSpinnerService,
    private ssrService: SsrService,
    public authService: AuthService,
    private ngZone: NgZone,
    @Inject(PLATFORM_ID) private platformId: any
  ) {}

  ngOnInit() {
    this.authService.user$.subscribe(user => this.user = user);
    this.activatedRoute.params
    .subscribe(params => {
      this.url = this.router.url;
    });
    this.ssrService.setSeo({
      title: this.title,
      description: this.description,
    }, `${this.collection}`, true);
    // this.ssrService.ssrFirestoreCollection(`${this.collection}`, `symbol`, true)
    // .subscribe(response => {
    //   this.data = _.orderBy(response, [(item: any) => _.get(item, ['updated'])], ['desc']);
    //   this.searchOptions = _.map(this.data, (item) => _.get(item, ['metaData', 'symbol']));
    // }, () => {});
    const days = 0;
    this.ssrService.ssrFirestoreDoc(`stocks/${moment().subtract(days, 'days').utc().format('YYYY-MM-DD')}`, `stocks-${moment().subtract(days, 'days').utc().format('YYYY-MM-DD')}`, false)
    .subscribe(response => {
      this.stocksUpdated = _.get(response, ['updated']);
      this.stocks = response;
    }, () => {});
  }

  getVolumeGraphChunks = async (recommendedStocks) => {
    const chunkPromises = [];
    const chunkStockSumbols = _.chunk(recommendedStocks, 20);
    for (let i = 0; i < chunkStockSumbols.length; i++) {
      const chunkPromise = await this.getVolumeOfStocks(chunkStockSumbols[i]);
      chunkPromises.push(chunkPromise);
      console.log('finishing batch #:', i + 1);
    }
    return _.flatten(chunkPromises);
  }

  populateVolumeGraphData = async (recommendedStocks) => {
    const res =  await this.getVolumeGraphChunks(recommendedStocks);
    res.forEach((volumeStockData) => {
      if (this.stocks && this.stocks.data) {
        const volumeStockDataArray = [volumeStockData];
        const chartData = this.transformToMultiChartData(volumeStockDataArray);
        this.stocks.data.forEach((currentStock, i) => {
          if (currentStock.symbol === volumeStockData.symbol) {
            this.stocks.data[i].volumeData = chartData;
          }
        });
      }
    });
    return res;
  }

  getPinkDataChunks = async (recommendedStocks) => {
    const chunkPromises = [];
    const chunkStockSumbols = _.chunk(recommendedStocks, 20);
    for (let i = 0; i < chunkStockSumbols.length; i++) {
      const chunkPromise = await this.getPinkDataOfStocks(chunkStockSumbols[i]);
      chunkPromises.push(chunkPromise);
      console.log('finishing batch #:', i + 1);
    }
    return _.flatten(chunkPromises);
  }

  getSecDataChunks = async (recommendedStocks) => {
    const chunkPromises = [];
    const chunkStockSumbols = _.chunk(recommendedStocks, 20);
    for (let i = 0; i < chunkStockSumbols.length; i++) {
      const chunkPromise = await this.getSecDataOfStocks(chunkStockSumbols[i]);
      chunkPromises.push(chunkPromise);
      console.log('finishing batch #:', i + 1);
    }
    return _.flatten(chunkPromises);
  }

  populatePinkData = async (recommendedStocks) => {
    const res =  await this.getPinkDataChunks(recommendedStocks);
    res.forEach((pinkStockData) => {
      if (this.stocks && this.stocks.data) {
        this.stocks.data.forEach((currentStock, i) => {
          if (currentStock.symbol === pinkStockData.symbol) {
            this.stocks.data[i].otcData = pinkStockData.data;
          }
        });
      }
    });
    return res;
  }

  populateSecData = async (recommendedStocks) => {
    const res =  await this.getSecDataChunks(recommendedStocks);
    res.forEach((secStockData) => {
      if (this.stocks && this.stocks.data) {
        this.stocks.data.forEach((currentStock, i) => {
          if (currentStock.symbol === secStockData.symbol) {
            this.stocks.data[i].secData = secStockData.data;
            this.stocks.data[i].secOtcData = secStockData.secOtcData;
            this.stocks.data[i].secStats = secStockData.stats;
            this.stocks.data[i].secOtcStats = secStockData.secOtcStats;
            this.stocks.data[i].mixedStats = secStockData.mixedStats;
          }
        });
      }
    });
    return res;
  }

  getListOfStocksForVolume() {
    let getUpTo = this.numberOfStocks === '' || !this.numberOfStocks
      ? 10
      : parseInt(this.numberOfStocks, 10);

    const recommendedStocks = [];
    const list = [];
    if (this.stocks && this.stocks.data) {
      this.stocks.data.forEach((stockData, i) => {
        // if (stockData.recommended) {
          // this.stocks.data[i].loading = true;
          recommendedStocks.push(stockData);
        // }
      });
    }
    if (recommendedStocks.length > 0) {
      getUpTo = getUpTo > recommendedStocks.length ? recommendedStocks.length : getUpTo;
      recommendedStocks.slice(0, getUpTo).map((stock) => {
        list.push(stock.symbol);
      });
    }
    return list;
  }

  getListOfStocksForPinkData() {
    let getUpTo = this.numberOfStocksForPink === '' || !this.numberOfStocksForPink
      ? 10
      : parseInt(this.numberOfStocksForPink, 10);

    const recommendedStocks = [];
    const list = [];
    if (this.stocks && this.stocks.data) {
      this.stocks.data.forEach((stockData, i) => {
        // if (stockData.recommended) {
          // this.stocks.data[i].loading = true;
          recommendedStocks.push(stockData);
        // }
      });
    }
    if (recommendedStocks.length > 0) {
      getUpTo = getUpTo > recommendedStocks.length ? recommendedStocks.length : getUpTo;
      recommendedStocks.slice(0, getUpTo).map((stock) => {
        list.push(stock.symbol);
      });
    }
    return list;
  }

  getListOfStocksForSecData() {
    let getUpTo = this.numberOfStocksForSec === '' || !this.numberOfStocksForSec
      ? 10
      : parseInt(this.numberOfStocksForSec, 10);

    const recommendedStocks = [];
    const list = [];
    if (this.stocks && this.stocks.data) {
      this.stocks.data.forEach((stockData, i) => {
        // if (stockData.recommended) {
          // this.stocks.data[i].loading = true;
          recommendedStocks.push(stockData);
        // }
      });
    }
    if (recommendedStocks.length > 0) {
      getUpTo = getUpTo > recommendedStocks.length ? recommendedStocks.length : getUpTo;
      recommendedStocks.slice(0, getUpTo).map((stock) => {
        list.push(stock.symbol);
      });
    }
    return list;
  }

  transformToSingleChartData(data) {
    let chartData = [];
    data.forEach((currentStockData) => {
        currentStockData.volumeData.forEach((volume) => {
            const seriesObj = {};
            if (volume.volume !== '-') {
                seriesObj['name'] = new Date(volume.date);
                seriesObj['value'] = volume.volume;
                chartData.push(seriesObj);
            }
        });
    });
    return chartData;
  }

  transformToMultiChartData(data) {
    let chartData = [];
    data.forEach((currentStockData) => {
        const stockObj = {};
        stockObj['name'] = currentStockData['symbol'];
        stockObj['series'] = [];
        currentStockData.volumeData.forEach((volume) => {
            const seriesObj = {};
            if (volume.volume !== '-') {
                seriesObj['name'] = new Date(volume.date);
                seriesObj['value'] = volume.volume;
                stockObj['series'].push(seriesObj);
            }
        });
       chartData.push(stockObj);
    });
    return chartData;
}

  // Fetches latest and sets to firestore DB
  getStocks(): Observable<any> {
    return this.http.get(`${environment.apiUrl}/getStocks?minPrice=0.001&maxPrice=100&sortByFields=yahooFinance,regularMarketVolume&minVolume=10000000&volumeHasMultipliedBy=0&minMarketCap=0&externalSources=false&statsOnly=true&showHoldings=true&firebase=true`)
    .pipe(map((response: Response) => { return response }));
  }

  getVolumeOfStocks(listOfStocks): Promise<any> {
    const stringOfStocks = listOfStocks.join();
    const withinDays = this.withinDays === ''  || !this.withinDays ? '' : `&withinDays=${parseInt(this.withinDays, 10)}`;
    return this.http.get(`${environment.apiUrl}/getVolumeForStocks?symbols=${stringOfStocks}${withinDays}`).toPromise();
  }

  getPinkDataOfStocks(listOfStocks): Promise<any> {
    const stringOfStocks = listOfStocks.join();
    return this.http.get(`${environment.apiUrl}/getPinkInfoForStocks?symbols=${stringOfStocks}`).toPromise();
  }

  getSecDataOfStocks(listOfStocks): Promise<any> {
    const stringOfStocks = listOfStocks.join();
    return this.http.get(`${environment.apiUrl}/getSecData?symbols=${stringOfStocks}`).toPromise();
  }

  async getVolumeGraphs(): Promise<any> {
    this.volumeGraphLoading = true;
    if (this.stocks) {
      const recommendedStocks = this.getListOfStocksForVolume();
      await this.populateVolumeGraphData(recommendedStocks);
    }
    this.volumeGraphLoading = false;
  }

  async getPinkData(): Promise<any> {
    this.pinkDataLoading = true;
    if (this.stocks) {
      const recommendedStocks = this.getListOfStocksForPinkData();
      await this.populatePinkData(recommendedStocks);
    }
    this.pinkDataLoading = false;
  }

  async getSecData(): Promise<any> {
    this.secDataLoading = true;
    if (this.stocks) {
      const recommendedStocks = this.getListOfStocksForSecData();
      await this.populateSecData(recommendedStocks);
    }
    this.secDataLoading = false;
  }

  refreshStocks(): void {
    if (!this.authService.canEdit(this.user)) {
      return;
    }
    this.spinner.show();
    this.getStocks().subscribe(response => {
      this.spinner.hide();
    }, (error) => {
      this.spinner.hide();
    });
  }

  isPlatformBrowser() {
    return isPlatformBrowser(this.platformId);
  }
}
