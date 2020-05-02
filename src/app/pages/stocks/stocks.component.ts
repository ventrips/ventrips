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
import * as moment from 'moment-timezone';
import * as _ from 'lodash';
import {firestore} from 'firebase/app';
@Component({
  selector: 'app-stocks',
  templateUrl: './stocks.component.html',
  styleUrls: ['./stocks.component.scss']
})
export class StocksComponent implements OnInit {
  public isLoading = true;
  public environment = environment;
  public _ = _;
  public user: User;
  public url: string;
  public title: string = `Free Historical Intraday Charts`;
  public description: string  = `Current Historical Intraday Charts to perform technical analysis. Look for trading strategies, patterns, and trends in 1 minute intervals of data`;
  public collection: string = 'symbol'
  public searchTerm: any;
  public searchOptions: Array<string> = ['AAPL', 'AMZN', 'FB', 'MSFT', 'SPY', 'TSLA', 'VIX', 'WTI'];
  public data: any;
  @ViewChild('searchBar', {static: false}) searchInputText: ElementRef; // Remove aria-multiline to improve SEO

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

  ngAfterViewInit(): void {  // Remove aria-multiline to improve SEO
    if (this.searchInputText !== undefined ) {
        this.renderer.removeAttribute(this.searchInputText.nativeElement, 'aria-multiline');
    }
  }

  ngOnInit() {
    this.authService.user$.subscribe(user => this.user = user);
    this.activatedRoute.params
    .subscribe(params => {
      this.url = this.router.url;
    });
    this.ssrService.setSeo({
      title: this.title,
      description: this.description,
    }, `${this.collection}`, false);
    this.ssrService.ssrFirestoreCollection(`${this.collection}`, `symbol`, true)
    .subscribe(response => {
      this.data = _.orderBy(response, [(item: any) => _.get(item, ['updated'])], ['desc']);
      this.searchOptions = _.map(this.data, (item) => _.get(item, ['metaData', 'symbol']));
    }, () => {});
  }

  search = (text$: Observable<string>) => text$.pipe(
    debounceTime(0),
    distinctUntilChanged(),
    map(term => {
      this.searchTerm = _.replace(_.toUpper(term), new RegExp(/[^a-zA-Z0-9]/g), '');
      return term.length < 1 ? []
      : this.searchOptions.filter(v => v.toLowerCase().startsWith(term.toLocaleLowerCase())).splice(0, 10);
    })
  )

  isPlatformBrowser() {
    return isPlatformBrowser(this.platformId);
  }
}
