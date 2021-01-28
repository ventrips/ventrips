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

  populateVolumeGraphData = async (recommendedStocks) => {
    const res =  await this.getVolumeOfStocks(recommendedStocks);
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

  getListOfStocksForVolume() {
    let getUpTo = 10;
    const recommendedStocks = [];
    const list = [];
    if (this.stocks && this.stocks.data) {
      this.stocks.data.forEach((stockData, i) => {
        if (stockData.recommended) {
          this.stocks.data[i].loading = true;
          recommendedStocks.push(stockData);
        }
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
    const withinDays = 60;
    return this.http.get(`${environment.apiUrl}/getVolumeForStocks?symbols=${stringOfStocks}&withinDays=${withinDays}`).toPromise();
  }

  async getVolumeGraphs(): Promise<any> {
    this.volumeGraphLoading = true;
    if (this.stocks) {
      const recommendedStocks = this.getListOfStocksForVolume();
      await this.populateVolumeGraphData(recommendedStocks);
    }
    this.volumeGraphLoading = false;
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
