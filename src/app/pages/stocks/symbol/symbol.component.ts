import { Component, OnInit, Inject, PLATFORM_ID, ViewChild, ElementRef, Renderer2, NgZone } from '@angular/core';
import { isPlatformBrowser, isPlatformServer } from '@angular/common';
import { Observable, Subject, merge } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { debounceTime, distinctUntilChanged, map, tap, startWith } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { NgxSpinnerService } from 'ngx-spinner';
import { NgbTypeaheadConfig } from '@ng-bootstrap/ng-bootstrap';
import { AuthService } from '../../../services/firestore/auth/auth.service';
import { environment } from '../../../../environments/environment';
import { AngularFirestore } from '@angular/fire/firestore';
import { User } from '../../../interfaces/user';
import { SsrService } from '../../../services/firestore/ssr/ssr.service';
import * as moment from 'moment-timezone';
import * as _ from 'lodash';
import {firestore} from 'firebase/app';
@Component({
  selector: 'app-symbol',
  templateUrl: './symbol.component.html',
  styleUrls: ['./symbol.component.scss']
})
export class SymbolComponent implements OnInit {
  public isLoading = true;
  public environment = environment;
  public _ = _;
  public user: User;
  public url: string;
  public title: string;
  public description: string;
  public collection: string = 'symbol';
  public symbol: string;
  public metaData: any;
  public yahooFinance: any;
  public data: any;
  public updated: firestore.Timestamp;
  public lastRefreshed: any;
  public interval: string = '1min';
  public intervalOptions: Array<any> = [
    '1min',
    '5min',
    '15min',
    '30min',
    '60min'
  ];
  public dayTradeOptions: Array<any> = [
    'CALL',
    'PUT'
  ];
  public tempDayTradeRules = [
    {
      option: 'CALL',
      buy: -1.8,
      sell: -1,
    },
    {
      option: 'PUT',
      buy: 3,
      sell: 2.5
    }
  ];
  public dayTradeRules = [];
  public toggleEdit: boolean = false;
  public toggleDetails: boolean = false;
  public countDayTradeRuleWorks = {
    CALL: 0,
    PUT: 0
  };

  constructor(
    private afs: AngularFirestore,
    private http: HttpClient,
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private spinner: NgxSpinnerService,
    private ssrService: SsrService,
    public authService: AuthService,
    private renderer: Renderer2,
    private ngZone: NgZone,
    @Inject(PLATFORM_ID) private platformId: any
  ) {}

  ngOnInit() {
    this.dayTradeRules = _.cloneDeep(this.tempDayTradeRules);
    this.authService.user$.subscribe(user => this.user = user);
    this.activatedRoute.params
    .subscribe(params => {
      this.url = this.router.url;
      this.symbol = _.toUpper(params.symbol);
      this.title = `${this.symbol} | Free Historical Intraday Charts`;
      this.description = `Current Historical Intraday Charts for ${this.symbol}. Look for trading strategies, patterns, and trends in 1 minute intervals of data`;
      this.ssrService.setSeo({
        title: this.title,
        description: this.description,
      }, `${this.collection}-${this.symbol}`, true);
      this.init();
    });
  }

  init() {
    let count = 0;
    this.spinner.show();
    this.ssrService.ssrFirestoreDoc(`${this.collection}/${this.symbol}`, `${this.collection}-${this.symbol}`, false)
    .subscribe(response => {
      count++;
      if (!_.isEmpty(response) && !_.isNil(response)) {
        this.metaData = _.get(response, ['metaData']);
        this.yahooFinance = _.get(response, ['yahooFinance']);
        this.data = _.reverse(
          _.sortBy(
            _.map(_.get(response, ['chartData']), (value: any, key: any) => {
              return {
                date: moment(key),
                data: value
              }
            }
          ), 'date')
        );
        this.updated = _.get(response, ['updated']);
        this.lastRefreshed = moment.tz(_.get(this.metaData, ['lastRefreshed']), _.get(this.metaData, ['timeZone']));
        this.interval = _.get(this.metaData, ['interval']);

        // Set long name if exists
        const longName = _.get(this.yahooFinance, ['longName']);
        if (longName) {
          this.title = `${longName} (${this.symbol}) | Free Historical Intraday Charts`;
          this.description = `Current Historical Intraday Charts for ${longName} (${this.symbol}). Look for trading strategies, patterns, and trends in 1 minute intervals of data`;
          this.ssrService.setSeo({
            title: this.title,
            description: this.description,
          }, `${this.collection}-${this.symbol}`, true);
        }
      }
      if (count === 2) {
        const lastRefreshed = _.get(this.metaData, ['lastRefreshed']);
        const timeZone = _.get(this.metaData, ['timeZone']);
        this.serverRefreshData(lastRefreshed, timeZone);
      }
      this.isLoading = false;
      this.spinner.hide();
    }, () => {
      this.isLoading = false;
      this.spinner.hide();
    });
  }

  ngOnChanges(changes: any): void {
  }

  // Fetches latest and sets to firestore DB
  getData(): Observable<any> {
    return this.http.get(`${environment.apiUrl}/getAlphaVantageAPI?symbol=${this.symbol}&interval=${this.interval}`)
    .pipe(map((response: Response) => { return response }));
  };

  serverRefreshData(lastRefreshed: string, timeZone: string): void {
    if (!this.isPlatformBrowser()) {
      return;
    }
    if (JSON.parse(localStorage.getItem(this.symbol))) {
      return;
    }
    const format = 'YYYY-MM-DD HH:mm:ss';
    const lastRefreshedTimeZone = moment.tz(lastRefreshed, timeZone).format(format);
    const today930am = (moment().set({h:9, m:30, s:0})).format(format);
    const today4pm = (moment().set({h:16, m:0, s:0})).format(format);
    const isNew = _.isNil(lastRefreshed);
    const lastRefreshedIsBeforeClose = moment(lastRefreshedTimeZone).isBefore(today4pm);
    const isWeekday = !_.includes(['Saturday', 'Sunday'], moment().format('dddd'));
    const isOver24Hours = (moment().diff(moment(lastRefreshedTimeZone), 'days') > 0) && (moment().diff(moment(this.updated.toDate()), 'days') > 0);
    // const currentIsAfterOpen = moment().isAfter(today930am);
    // const currentIsAfterClose = moment().isAfter(today4pm);
    // const isBetweenMarketTime = moment(lastRefreshedTimeZone).isBetween(moment(today930am).format(format), moment(today4pm).format(format),  null, '[]');
   if (
      isNew
      || isOver24Hours
      || (isWeekday && lastRefreshedIsBeforeClose)
    ) {
      this.getData().subscribe(response => {}, (error) => {
        if (isNew) {
          localStorage.setItem(this.symbol, JSON.stringify(true));
        }
      });
    }
  }

  refreshData(): void {
    if (!this.authService.canEdit(this.user)) {
      return;
    }
    this.spinner.show();
    this.getData().subscribe(response => {
      this.spinner.hide();
      this.router.navigate(['symbol', _.toUpper(this.symbol)]);
    }, (error) => {
      this.spinner.hide();
    });
  }


  resetCountDayTradeRuleWorks() {
    this.countDayTradeRuleWorks = {
      CALL: 0,
      PUT: 0
    };
  }

  onCountDayTradeRuleWorks(option: string) {
    this.countDayTradeRuleWorks[option]++;
  }

  scrollToTop() {
    if (isPlatformBrowser(this.platformId)) {
      window.scrollTo(0, 0);
    }
  }

  isPlatformBrowser() {
    return isPlatformBrowser(this.platformId);
  }
}