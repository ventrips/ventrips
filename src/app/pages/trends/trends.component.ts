import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser, isPlatformServer } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';
import { map } from 'rxjs/internal/operators/map';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../../services/firestore/auth/auth.service';
import { User } from '../../interfaces/user';
import { ActivatedRoute, Router } from '@angular/router';
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
  public title: string = `Trends Tracker`;
  public description: string = `See data, trends, and learn about the latest news all in one go`;
  public chartTrends: any;
  public search: string;
  public q: string;
  public data: any;
  public user: User;
  public predict: any;
  public _ = _;
  public collection: string = 'trends';
  public id: string = 'trends';
  public environment = environment;
  public url: string;

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
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: any
  ) {
  }

  ngOnInit() {
    this.ssrService.setSeo({
      title: this.title,
      description: this.description
    }, `trends`, true);
    this.activatedRoute.queryParams.subscribe(params => {
      this.url = this.router.url;
    });
    this.authService.user$.subscribe(user => this.user = user);
  }

  isPlatformBrowser() {
    return isPlatformBrowser(this.platformId);
  }
}
