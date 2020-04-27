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
import { NumberSuffixPipe } from '../../pipes/number-suffix/number-suffix.pipe';
import { ChartDataSets, ChartOptions } from 'chart.js';
import { Color, BaseChartDirective, Label } from 'ng2-charts';
import * as pluginAnnotations from 'chartjs-plugin-annotation';
import * as moment from 'moment';
import * as _ from 'lodash';

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
  public collection: string = 'symbol'
  public symbol: string;
  public metaData: any;
  public data: any;
  public updated: string;
  public interval: string = '1min';
  public intervalOptions: Array<any> = [
    '1min',
    '5min',
    '15min',
    '30min',
    '60min'
  ];
  public lowParam = 0.0018;
  public highParam = 0.0075;

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
    this.authService.user$.subscribe(user => this.user = user);
    this.activatedRoute.params
    .subscribe(params => {
      this.url = this.router.url;
      this.symbol = _.toUpper(params.symbol);
      this.title = `${this.symbol} | Free Historical Intraday Charts`;
      this.description = `Current Historical Intraday Charts for ${this.symbol} to perform technical analysis. Look for trading strategies, patterns, and trends in 1 minute intervals of data`;
      this.ssrService.setSeo({
        title: this.title,
        description: this.description,
      }, `${this.collection}-${this.symbol}`, true);
      this.init();
    });
  }

  init() {
    this.spinner.show();
    this.ssrService.ssrFirestoreDoc(`${this.collection}/${this.symbol}`, `${this.collection}-${this.symbol}`, false)
    .subscribe(response => {
      if (!_.isEmpty(response) && !_.isNil(response)) {
        this.metaData = _.get(response, ['metaData']);
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
        this.interval = _.get(this.metaData, ['interval']);
      };
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

  scrollToTop() {
    if (isPlatformBrowser(this.platformId)) {
      window.scrollTo(0, 0);
    }
  }

  isPlatformBrowser() {
    return isPlatformBrowser(this.platformId);
  }
}