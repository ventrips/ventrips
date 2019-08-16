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
    this.authService.user$.subscribe(user => this.user = user);
    this.activatedRoute.queryParams.subscribe(params => {
      this.q = params.q;
      this.search = _.cloneDeep(this.q);
      this.data = undefined;

      this.predict = undefined;
      this.spinner.show();
      this.getPredict(this.q)
      .subscribe((response) => {
        this.spinner.hide();
        this.predict = response;
        this.predict['stockTwitsTickers'] = _.orderBy(this.predict['stockTwitsTickers'], 'watchlist_count', 'desc');
        this.predict['yahooTickers'] = _.orderBy(this.predict['yahooTickers'], [item => parseInt(item.change)], ['desc']);
      }, (error) => {
        this.toastr.error(error);
        this.spinner.show();
      });

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

  getGoogleTrends(item: any) {
    let list = [];
    list.push(this.removeCommonTexts(_.get(item, ['title'])));
    list.push(this.removeCommonTexts(_.get(item, ['company'])));
    list.push(_.get(item, ['symbol']));
    list.push(`${_.get(item, ['symbol'])} stock`);
    list = _.compact(list);

    return `https://trends.google.com/trends/explore?date=now%201-H&geo=US&q=${list}`;
  }

  removeCommonTexts(value: string) {
    value = _.toLower(value);
    _.forEach([
      'the ',
      ' company',
      ' co.',
      ' incorporated',
      ' corporation',
      ' corp',
      ' corp.',
      ' limited',
      ', inc',
      `'s`,
      ' inc.',
      ' lp',
      ' l.p.',
      ' ltd',
      '. ',
      ' .',
      /[`~!@#$%^*()_|+\-=?;:'",<>\{\}\[\]\\\/]/gi
    ], (target) => {
      value = _.replace(value, target, ' ');
    });
    return _.trim(_.replace(value, /[&]/gi, '%26'));
  }

  isPlatformBrowser() {
    return isPlatformBrowser(this.platformId);
  }
}
