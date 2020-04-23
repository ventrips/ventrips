import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/internal/operators/map';
import { SsrService } from './../../../services/firestore/ssr/ssr.service';
import { AuthService } from './../../../services/firestore/auth/auth.service';
import { isPlatformBrowser, isPlatformServer } from '@angular/common';
import { User } from './../../../interfaces/user';
import { environment } from './../../../../environments/environment';
import { NgxSpinnerService } from 'ngx-spinner';
import { ActivatedRoute, Router } from '@angular/router';
import * as _ from 'lodash';
import * as moment from 'moment';

@Component({
  selector: 'app-news-api',
  templateUrl: './news-api.component.html',
  styleUrls: ['./news-api.component.scss']
})
export class NewsApiComponent implements OnInit {
  public environment = environment;
  public collection = 'trends';
  public user: User;
  public q: string;
  public search: string;
  public id = 'get-everything-news-api'; //get-top-headlines-news-api
  public data;

  constructor(
    private http: HttpClient,
    private spinner: NgxSpinnerService,
    private ssrService: SsrService,
    public authService: AuthService,
    private activatedRoute: ActivatedRoute,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: any
  ) {}

  ngOnInit() {
    this.authService.user$.subscribe(user => this.user = user);
    this.ssrService.ssrFirestoreDoc(`${this.collection}/${this.id}`, `${this.collection}-${this.id}`, false)
    .subscribe(response => {
      if (_.isEmpty(response)) {
        return;
      }
      this.data = response;
    }, () => {
    });
  }

  // Fetches latest and sets to firestore DB
  getNewsApi(): Observable<any> {
    // getTopHeadlinesNewsAPI?country=us&category=business
    return this.http.get(`${environment.apiUrl}/getEverythingNewsAPI?q=${this.search}&pageSize=100&from=${moment().subtract(1, 'days').format('YYYY-MM-DD')}&to=${moment().format('YYYY-MM-DD')}&sortBy=publishedAt`)
    .pipe(map((response: Response) => { return response }));
  };

  refreshNewsApi(): void {
    if (!this.authService.canEdit(this.user)) {
      return;
    }
    this.spinner.show();
    this.getNewsApi().subscribe(response => {
      this.spinner.hide();
    }, (error) => {
      this.spinner.hide();
    });

  }

  isPlatformBrowser() {
    return isPlatformBrowser(this.platformId);
  }
}
