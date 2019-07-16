import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Observable, Subject, merge } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { debounceTime, distinctUntilChanged, map, tap, startWith } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { NgxSpinnerService } from 'ngx-spinner';
import { NgbTypeaheadConfig } from '@ng-bootstrap/ng-bootstrap';
import { Post } from '../../interfaces/post';
import { SeoService } from '../../services/seo/seo.service';
import { AuthService } from '../../services/firestore/auth/auth.service';
import { environment } from '../../../environments/environment';
import { AngularFirestore } from '@angular/fire/firestore';
import { User } from '../../interfaces/user';
import { fadeInUpOnEnterAnimation } from 'angular-animations';
import { InputsConfig } from '../../interfaces/inputs-config';
import { SsrService } from '../../services/firestore/ssr/ssr.service';
import * as _ from 'lodash';
@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  providers: [ NgbTypeaheadConfig ], // add NgbTypeaheadConfig to the component providers
  animations: [
    fadeInUpOnEnterAnimation({ anchor: 'enter', duration: 1000, delay: 100}),
  ]
})
export class HomeComponent implements OnInit {
  public inputsConfig: InputsConfig = {
    string: ['slug', 'category', 'title', 'description'],
    number: [],
    url: ['image'],
    quill: ['body'],
    date: [],
    boolean: ['publish'],
    disabled: ['slug']
  };
  public environment = environment;
  public orderByOptions: Array<any> = [
    {
      label: 'Date: Newest',
      type: 'modified',
      direction: 'desc'
    },
    {
      label: 'Date: Oldest',
      type: 'modified',
      direction: 'asc'
    },
    {
      label: 'Title: A - Z',
      type: 'title',
      direction: 'asc'
    },
    {
      label: 'Title: Z - A',
      type: 'title',
      direction: 'desc'
    },
    {
      label: 'Author: A - Z',
      type: 'displayName',
      direction: 'asc'
    },
    {
      label: 'Author: Z - A',
      type: 'displayName',
      direction: 'desc'
    },
    {
      label: 'Category: A - Z',
      type: 'category',
      direction: 'asc'
    },
    {
      label: 'Category: Z - A',
      type: 'category',
      direction: 'desc'
    }
  ];
  public selectedOrderBy = this.orderByOptions[0];
  public orderByDirection: string;
  public orderByType: string;
  public searchTerm: any;
  public searchOptions: Array<string>;
  public posts: Array<Post>;
  public isLoading = true;
  public _ = _;
  public user: User;
  public newPost = _.assign({}, new Post());
  public url: string;

  constructor(
    private afs: AngularFirestore,
    private http: HttpClient,
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private spinner: NgxSpinnerService,
    private seoService: SeoService,
    private ssrService: SsrService,
    public authService: AuthService,
    @Inject(PLATFORM_ID) private platformId: any
  ) {}

  ngOnInit() {
    this.authService.user$.subscribe(user => this.user = user);
    this.activatedRoute.queryParams.subscribe(params => {
      this.searchTerm = params.q;
      this.url = this.router.url;
    });
    this.spinner.show();
    this.ssrService.ssrFirestoreCollection(`posts`, `home`, true).subscribe(response => {
      if (!_.isEmpty(response) && !_.isNil(response)) {
        this.posts = response;
        // Adding Search Options
        this.searchOptions = [];
        _.forEach(this.posts, (post) => {
          this.searchOptions.push(post.title);
          this.searchOptions.push(post.category);
          this.searchOptions.push(post.displayName);
        });
        this.searchOptions = _.uniq(this.searchOptions);
        this.isLoading = false;
        this.spinner.hide();
      }
    }, () => {
      this.isLoading = false;
      this.spinner.hide();
    });
  }

  search = (text$: Observable<string>) => text$.pipe(
    debounceTime(0),
    distinctUntilChanged(),
    map(term => {
      const queryParams = _.isEmpty(term) ? {} : { queryParams: { q: term } };
      this.scrollToTop();
      this.router.navigate( [], queryParams);
      return term.length < 1 ? []
      : this.searchOptions.filter(v => v.toLowerCase().startsWith(term.toLocaleLowerCase())).splice(0, 10);
    })
  )

  scrollToTop() {
    if (isPlatformBrowser(this.platformId)) {
      window.scrollTo(0, 0);
    }
  }
}
