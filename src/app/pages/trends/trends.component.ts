import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser, isPlatformServer } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';
import { map } from 'rxjs/internal/operators/map';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../../services/firestore/auth/auth.service';
import { User } from '../../interfaces/user';
import { ActivatedRoute } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import * as moment from 'moment';
import * as Sentiment from 'sentiment';
import * as _ from 'lodash';

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
  public id: string = 'trends';
  public environment = environment;

  public updated: string;
  public recommended: Array<any> = [];
  public tickers: Array<any> = [];
  public requiredTickers: Array<any> = [];
  public news: Array<any>= [];
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
    this.ssrService.ssrFirestoreDoc(`${this.collection}/${this.id}`, `${this.collection}-${this.id}`, true)
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
      this.requiredTickers = _.filter(this.tickers, (ticker) => _.includes(['SPY', '^DJI'], _.get(ticker, ['symbol'])));
      this.recommended = _.filter(this.tickers, (ticker) => ticker.recommended);

      this.news = _.get(this.predict, ['news']);
      this.forums = _.get(this.predict, ['forums']);

      this.initSearchNews();
    }, (error) => {
      this.spinner.hide();
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
    if (!this.authService.canEdit(this.user)) {
      return;
    }
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
