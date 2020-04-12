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
import * as _ from 'lodash';

@Component({
  selector: 'app-news-api',
  templateUrl: './news-api.component.html',
  styleUrls: ['./news-api.component.scss']
})
export class NewsApiComponent implements OnInit {
  public environment = environment;
  public collection = 'trends';
  public user: User;
  public mapperOption = 'everything';
  public newsApi = {
    everything: {
      id: 'get-everything-news-api',
      endpoint: 'getEverythingNewsAPI?q=airlines&from=2020-04-11&to=2020-04-12'
    },
    topHeadlines: {
      id: 'get-top-headlines-news-api',
      endpoint: 'getTopHeadlinesNewsAPI?country=us&category=business'
    }
  }
  public data;

  constructor(
    private http: HttpClient,
    private spinner: NgxSpinnerService,
    private ssrService: SsrService,
    public authService: AuthService,
    @Inject(PLATFORM_ID) private platformId: any
  ) {
    this.authService.user$.subscribe(user => this.user = user);
  }

  ngOnInit() {
    this.ssrService.ssrFirestoreDoc(`${this.collection}/${this.newsApi[this.mapperOption].id}`, `${this.collection}-${this.newsApi[this.mapperOption].id}`, false)
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
    return this.http.get(`${environment.apiUrl}/${this.newsApi[this.mapperOption].endpoint}`)
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
