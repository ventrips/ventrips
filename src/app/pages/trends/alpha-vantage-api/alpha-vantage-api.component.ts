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
import { ChartDataSets, ChartOptions } from 'chart.js';
import { Color, BaseChartDirective, Label } from 'ng2-charts';
import * as pluginAnnotations from 'chartjs-plugin-annotation';
import * as moment from 'moment';
import * as _ from 'lodash';

@Component({
  selector: 'app-alpha-vantage-api',
  templateUrl: './alpha-vantage-api.component.html',
  styleUrls: ['./alpha-vantage-api.component.scss'],
  providers: [ NgbTypeaheadConfig ] // add NgbTypeaheadConfig to the component providers
})
export class AlphaVantageApiComponent implements OnInit {
  public environment = environment;
  public isLoading = true;
  public _ = _;
  public user: User;
  public url: string;
  public collection: string = 'trends'
  public id: string = 'get-alpha-vantage-api';
  public metaData: any;
  public data: any;
  public updated: string;
  public search: string = '';

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
    this.activatedRoute.queryParams.subscribe(params => {
      this.url = this.router.url;
    });
    this.authService.user$.subscribe(user => this.user = user);

    this.data = undefined;
    // this.spinner.show();
    this.ssrService.ssrFirestoreDoc(`${this.collection}/${this.id}`, `${this.collection}-${this.id}`, false)
    .subscribe(response => {
      if (_.isEmpty(response)) {
        return;
      }
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
      this.search = _.get(this.metaData, ['symbol'])
      this.isLoading = false;
      // this.spinner.hide();
    }, () => {
      this.isLoading = false;
      // this.spinner.hide();
    });
  }

  ngOnChanges(changes: any): void {
  }

  // Fetches latest and sets to firestore DB
  getData(): Observable<any> {
    return this.http.get(`${environment.apiUrl}/getAlphaVantageAPI?symbol=${this.search}`)
    .pipe(map((response: Response) => { return response }));
  };

  refreshData(): void {
    if (!this.authService.canEdit(this.user)) {
      return;
    }
    this.spinner.show();
    this.getData().subscribe(response => {
      this.spinner.hide();
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