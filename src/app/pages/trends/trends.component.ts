import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser, isPlatformServer } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';
import { map } from 'rxjs/internal/operators/map';
import * as _ from 'lodash';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../../services/firestore/auth/auth.service';
import { User } from '../../interfaces/user';
import { ActivatedRoute } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import * as moment from 'moment';
import * as Sentiment from 'sentiment';

import { SsrService } from '../../services/firestore/ssr/ssr.service';
import { KeysPipe } from '../../pipes/keys/keys.pipe';

@Component({
  selector: 'app-trends',
  templateUrl: './trends.component.html',
  styleUrls: ['./trends.component.scss']
})
export class TrendsComponent implements OnInit {
  public search: string;
  public q: string;
  public data: any;
  public user: User;
  public predict: any;
  public _ = _;
  public collection: string = 'trends';
  public id: string = 'predict';
  public environment = environment;

  public updated: string;
  public tickers: Array<any>= [];
  public news: Array<any>= [];
  public earnings: Array<any>= [];
  public forums: Array<any>= [];

  constructor(
    private http: HttpClient,
    private toastr: ToastrService,
    private spinner: NgxSpinnerService,
    private activatedRoute: ActivatedRoute,
    private ssrService: SsrService,
    public authService: AuthService,
    @Inject(PLATFORM_ID) private platformId: any
  ) {
  }

  ngOnInit() {
    this.predict = undefined;
    this.spinner.show();
    this.ssrService.ssrFirestoreDoc(`${this.collection}/${this.id}`, `${this.collection}-${this.id}`, false)
    .subscribe(response => {
      if (_.isEmpty(response)) {
        return;
      }
      this.spinner.hide();
      this.predict = response;
      this.setSentiment('news');
      this.setSentiment('forums');

      this.updated = _.get(this.predict, ['updated']);
      this.tickers = _.get(this.predict, ['tickers']);
      this.tickers =  _.orderBy(this.tickers, [
      (item) => item.stockTwitsRank,
      (item) => item.yahooRank,
      (item) => item.finVizRank
    ], ["asc", "asc", "asc"]);

      this.news = _.get(this.predict, ['news']);
      this.earnings = _.get(this.predict, ['earnings']);
      this.forums = _.get(this.predict, ['forums']);

      this.initSearchNews();
    }, (error) => {
      this.toastr.error(error);
      this.spinner.show();
      this.initSearchNews();
    });

    this.authService.user$.subscribe(user => this.user = user);
  }

  initSearchNews(): void {
    this.activatedRoute.queryParams.subscribe(params => {
      this.q = params.q;
      this.search = _.cloneDeep(this.q);
      this.data = undefined;

      if (_.isNil(this.q)) { return; };
      this.spinner.show();
      this.searchNews(this.q)
      .subscribe((response) => {
        this.spinner.hide();
        this.data = response;
        this.toastr.success(`${this.q}`, `Search Success!`)
      }, (error) => {
        this.toastr.error(error);
      });
    });
  }

  setSentiment(type: string): void {
    const news = _.get(this.predict, [type]);
    for (let key in news) {
      const source = _.get(news, [key]);
      for (let article of source) {
        const title = _.get(article, ['title']);
        article['sentiment'] = (new Sentiment()).analyze(title);
      }
    }
  }

  isPositive(change: string): boolean {
    let text = change;
    text = _.replace(text, '%', '');
    return _.toNumber(text) >= 0;
  }

  searchNews(q: string): Observable<any> {
    return this.http.get(`${environment.apiUrl}/searchNews?q=${q}`)
    .pipe(map((response: Response) => { return response }));
  };

  // Fetches latest and sets to firestore DB
  getTrends(): Observable<any> {
    return this.http.get(`${environment.apiUrl}/trends`)
    .pipe(map((response: Response) => { return response }));
  };

  refreshTrends(): void {
    this.spinner.show();
    this.getTrends().subscribe(response => {
      this.spinner.hide();
    }, (error) => {
      this.spinner.hide();
    });
  }

  // For Local Purposes. Does not use write / read calls because it doesn't set data to firestore DB
  getPredict(): Observable<any> {
    return this.http.get(`${environment.apiUrl}/predict`)
    .pipe(map((response: Response) => { return response }));
  };

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

  removeCommonTexts(value: string) {
    value = _.toLower(value);
    _.forEach([
      'the ',
      ' and companies',
      ' & company',
      ' company',
      ' companies',
      ' and co.',
      ' & co.',
      ' co.',
      ' incorporated',
      ' corporation',
      ' corp',
      ' corp.',
      ' designs',
      ' limited',
      ', inc',
      ' inc.',
      ' inc',
      ' lp',
      ' l.p.',
      ' plc',
      ' p.l.c',
      ' ltd',
      '. ',
      `'s`,
      `’s`,
      ' .',
      /[`~!@#$%^*()_|+\-=?;:",<>\{\}\[\]\\\/]/gi
    ], (target) => {
      value = _.replace(value, target, ' ');
    });
    return _.trim(_.replace(value, /[&]/gi, '%26'));
  }

  isPlatformBrowser() {
    return isPlatformBrowser(this.platformId);
  }
}
