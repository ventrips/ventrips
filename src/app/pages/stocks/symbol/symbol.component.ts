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
  public localDayTradeRules = [
    /* 80% SAFE BUT FREQUENT FOR SPY */
    // {
    //   option: 'CALL',
    //   buy: -.12,
    //   sell: 0.03,
    // },
    // {
    //   option: 'PUT',
    //   buy: .11,
    //   sell: -.17
    // }
    /* 100% SAFE BUT RARE FOR SPY */
    // {
    //   option: 'CALL',
    //   buy: -1.8,
    //   sell: -1,
    // }
    // ,{
    //   option: 'PUT',
    //   buy: 3,
    //   sell: 2.5
    // }
    /* 100% SAFE BUT RARE FOR SPXL */
    // {
    //   option: 'CALL',
    //   buy: -5.3,
    //   sell: -3,
    // }
    /* 90% SAFE BUT FREQUENT FOR SPXL */
    // {
    //   option: 'CALL',
    //   buy: -.74,
    //   sell: 0.02,
    // }
    /* 90% SAFE BUT FREQUENT FOR SPXS */
    // {
    //   option: 'CALL',
    //   buy: -.3,
    //   sell: 0.5,
    // }
  ];
  public tempDayTradeRules = [];
  public dayTradeRules = [];
  public toggleEdit: boolean = false;
  public toggleDetails: boolean = false;
  public countDayTradeRuleWorks = {
    CALL: {
      success: 0,
      fail: 0,
      total: 0
    },
    PUT: {
      success: 0,
      fail: 0,
      total: 0
    },
    overall: 0
  };
  public nizom = {
    buyingPower: 1000,
    profit: 0
  };
  public yahooFinanceOpenPrice: number;
  public toggleHorizontalView: boolean = false;

  private autoSaveSub$ = new Subject<string>();

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
    this.autoSaveSub$.pipe(
      debounceTime(1500),
      distinctUntilChanged()
    ).subscribe((value?: string) => {
      this.setDayTradeRules();
    });
  }

  applyAutoSave(value?: string) {
    this.autoSaveSub$.next(value);
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
        this.yahooFinanceOpenPrice = _.get(this.yahooFinance, ['regularMarketPrice']) - _.get(this.yahooFinance, ['regularMarketChange']);

        if (this.isPlatformBrowser()) {
          const ventrips_symbol_rules = JSON.parse(localStorage.getItem(`ventrips_symbol_rules`));
          const symbol_rules = _.get(ventrips_symbol_rules, [this.symbol], [{}]);
          // this.tempDayTradeRules = .cloneDeep(this.localDayTradeRules);
          this.tempDayTradeRules = _.cloneDeep(symbol_rules);
        }
        // must be outside of platform browser
        setTimeout(() => {
          this.setDayTradeRules();
        }, 0);

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
    if (_.get(JSON.parse(localStorage.getItem('ventrips_symbol_invalid')), [this.symbol])) {
      return;
    }
    const isNew = _.isNil(lastRefreshed);
    let lastRefreshedTimeZone;
    let today930am;
    let today4pm;
    let lastRefreshedIsBeforeClose;
    let isWeekday;;
    let isOver24Hours;
    let timeIsAfterOpen;
    let currentIsAfterOpen;
    let currentIsAfterClose;
    let isBetweenMarketTime;

    if (!isNew) {
      const format = 'YYYY-MM-DD HH:mm:ss';
      lastRefreshedTimeZone = moment.tz(lastRefreshed, timeZone).format(format);
      today930am = (moment().tz('timeZone').set({h:9, m:30, s:0})).format(format);
      today4pm = (moment().tz('timeZone').set({h:16, m:0, s:0})).format(format);
      lastRefreshedIsBeforeClose = moment(lastRefreshedTimeZone).isBefore(today4pm);
      isWeekday = !_.includes(['Saturday', 'Sunday'], moment().format('dddd'));
      isOver24Hours = (moment().diff(moment(lastRefreshedTimeZone), 'days') > 0) && (moment().diff(moment(this.updated.toDate()), 'days') > 0);
      timeIsAfterOpen = moment(moment().tz(timeZone).format(format)).isAfter(moment(today930am));
      // currentIsAfterOpen = moment().isAfter(today930am);
      // currentIsAfterClose = moment().isAfter(today4pm);
      // isBetweenMarketTime = moment(lastRefreshedTimeZone).isBetween(moment(today930am).format(format), moment(today4pm).format(format),  null, '[]');
    }
    if (
      isNew
      || isOver24Hours
      || (isWeekday && lastRefreshedIsBeforeClose && timeIsAfterOpen)
    ) {
      this.getData().subscribe(response => {}, (error) => {
        if (isNew) {
          const symbol_invalid = {};
          _.set(symbol_invalid, this.symbol, true);
          localStorage.setItem('ventrips_symbol_invalid', JSON.stringify(symbol_invalid));
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

  onCountDayTradeRuleReset() {
    const reset = {
      CALL: {
        success: 0,
        fail: 0,
        total: 0
      },
      PUT: {
        success: 0,
        fail: 0,
        total: 0
      },
      overall: 0
    };
    this.countDayTradeRuleWorks = _.cloneDeep(reset);
  }

  setDayTradeRules() {
    this.onNizomReset();
    this.onCountDayTradeRuleReset();
    // Comment out for local dev rules
    if (this.isPlatformBrowser()) {
      const other_symbol_rules = JSON.parse(localStorage.getItem(`ventrips_symbol_rules`)) || {};
      const symbol_rules = {}
      _.set(symbol_rules, this.symbol, this.tempDayTradeRules);
      const new_ventrips_symbol_rules = _.assign(other_symbol_rules, symbol_rules);
      localStorage.setItem(`ventrips_symbol_rules`, JSON.stringify(new_ventrips_symbol_rules));
    }
    this.dayTradeRules = _.cloneDeep(this.tempDayTradeRules);
  }

  onCountDayTradeRuleWorks(optionObj: any) {
    const option = _.get(optionObj, ['option']);
    const status = _.get(optionObj, ['status']);
    this.countDayTradeRuleWorks[option][status]++;
    this.countDayTradeRuleWorks[option]['total']++;
    this.countDayTradeRuleWorks['overall']++;
  }

  onNizomReset() {
    const resetNizom = {
      buyingPower: this.nizom.buyingPower - this.nizom.profit,
      profit: 0
    }
    this.nizom = resetNizom;
  }

  onNizom(optionObj: any) {
    const profit = _.get(optionObj, ['profit']);
    const buyingPower = _.get(optionObj, ['buyingPower']);
    this.nizom['buyingPower'] = buyingPower;
    this.nizom['profit'] += profit;
  }


  getDayTradePointFromOpenWithYahooFinance(percent: number) {
    if (!_.isEqual(_.get(this.yahooFinance, ['marketState']), 'REGULAR')) {
      return;
    }
    return _.round(this.yahooFinanceOpenPrice + (this.yahooFinanceOpenPrice * (_.get(this.yahooFinance, ['regularMarketChangePercent']) / 100)), 2);
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