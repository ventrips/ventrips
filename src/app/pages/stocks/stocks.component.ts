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
import {firestore} from 'firebase/app';
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

  // Fetches latest and sets to firestore DB
  getStocks(): Observable<any> {
    return this.http.get(`${environment.apiUrl}/getStocks?minPrice=0.01&maxPrice=100&sortByFields=yahooFinance,regularMarketVolume&minVolume=5000000&volumeHasMultipliedBy=0&externalSources=false&statsOnly=true&showHoldings=true`)
    .pipe(map((response: Response) => { return response }));
  };

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
