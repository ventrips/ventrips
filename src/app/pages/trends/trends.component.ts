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

  constructor(
    private http: HttpClient,
    private toastr: ToastrService,
    private spinner: NgxSpinnerService,
    private activatedRoute: ActivatedRoute,
    public authService: AuthService,
    @Inject(PLATFORM_ID) private platformId: any
  ) {
  }

  ngOnInit() {
    this.predict = undefined;
    this.spinner.show();
    this.getPredict(this.q)
    .subscribe((response) => {
      this.spinner.hide();
      this.predict = response;
      this.predict['stockTwitsTickers'] = _.orderBy(this.predict['stockTwitsTickers'], 'watchlist_count', 'desc');
      this.predict['yahooTickers'] = _.orderBy(this.predict['yahooTickers'], [item => parseInt(item.change)], ['desc']);
      this.initTrends();
    }, (error) => {
      this.toastr.error(error);
      this.spinner.show();
      this.initTrends();
    });

    this.authService.user$.subscribe(user => this.user = user);
  }

  initTrends(): void {
    this.activatedRoute.queryParams.subscribe(params => {
      this.q = params.q;
      this.search = _.cloneDeep(this.q);
      this.data = undefined;

      if (_.isNil(this.q)) { return; };
      this.spinner.show();
      this.getTrends(this.q)
      .subscribe((response) => {
        this.spinner.hide();
        this.data = response;
        this.toastr.success(`${this.q}`, `Search Success!`)
      }, (error) => {
        this.toastr.error(error);
      });
    });
  }

  getTrends(q: string): Observable<any> {
    return this.http.get(`${environment.apiUrl}/trends?q=${q}`)
    .pipe(map((response: Response) => { return response }));
  };

  getPredict(q: string): Observable<any> {
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
    // if (_.get(item, ['company'])) {
    //   list.push(`${this.removeCommonTexts(_.get(item, ['company']))} news`);
    // } else {
    //   list.push(`${this.removeCommonTexts(_.get(item, ['title']))} news`);
    // }

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
