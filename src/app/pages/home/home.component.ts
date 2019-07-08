import { Component, OnInit } from '@angular/core';
import { Observable, Subject, merge } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { debounceTime, distinctUntilChanged, map, tap, startWith } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { TransferState, makeStateKey, StateKey } from '@angular/platform-browser';
import { NgxSpinnerService } from 'ngx-spinner';
import { NgbTypeaheadConfig } from '@ng-bootstrap/ng-bootstrap';
import { PostsService } from '../../services/firebase/posts/posts.service';
import { Post } from '../../interfaces/post';
import { SeoService } from '../../services/seo/seo.service';
import { AuthService } from '../../services/firebase/auth/auth.service';
import { environment } from '../../../environments/environment';
import * as _ from 'lodash';
import { AngularFirestore } from '@angular/fire/firestore';
import { User } from '../../interfaces/user';
import { flipInXOnEnterAnimation } from 'angular-animations';
import { InputsConfig } from '../../interfaces/inputs-config';

const COLLECTION = 'posts';
const PAGE_KEY = makeStateKey<any>('home');
@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  providers: [ NgbTypeaheadConfig ], // add NgbTypeaheadConfig to the component providers
  animations: [
    flipInXOnEnterAnimation({ anchor: 'enter', duration: 1000, delay: 100}),
  ]
})
export class HomeComponent implements OnInit {
  public inputsConfig: InputsConfig = {
    string: ['slug', 'category', 'title', 'description'],
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
  public collection = COLLECTION;

  constructor(
    private afs: AngularFirestore,
    private transferState: TransferState,
    private http: HttpClient,
    private spinner: NgxSpinnerService,
    private postsService: PostsService,
    private seoService: SeoService,
    public authService: AuthService,
    private activatedRoute: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    this.authService.user$.subscribe(user => this.user = user);
    this.activatedRoute.queryParams.subscribe(params => {
      this.searchTerm = params.query;
    });
    this.spinner.show();
    this.ssrFirestoreCollection(this.collection).subscribe(response => {
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
      const queryParams = _.isEmpty(term) ? {} : { queryParams: { query: term } };
      this.router.navigate( [], queryParams);
      return term.length < 1 ? []
      : this.searchOptions.filter(v => v.toLowerCase().startsWith(term.toLocaleLowerCase())).splice(0, 10);
    })
  )

  // Use Server-Side Rendered Data when it exists rather than fetching again on browser
  ssrFirestoreCollection(path: string) {
    const exists = this.transferState.get(PAGE_KEY, {} as any);

    return this.afs.collection<any>(path).valueChanges().pipe(
      tap(page => {
        this.transferState.set(PAGE_KEY, page);
        this.seoService.setMetaTags({
          title: `Ventrips - Dedicated to providing latest news and trends`,
          description: `Search for articles`
        });
      }),
      startWith(exists)
    );
  }
}
