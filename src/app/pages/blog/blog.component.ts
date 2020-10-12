import { Component, OnInit, Inject, PLATFORM_ID, ViewChild, ElementRef, Renderer2, NgZone } from '@angular/core';
import { isPlatformBrowser, isPlatformServer } from '@angular/common';
import { Observable, Subject, merge } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { debounceTime, distinctUntilChanged, map, tap, startWith } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { NgxSpinnerService } from 'ngx-spinner';
import { NgbTypeaheadConfig } from '@ng-bootstrap/ng-bootstrap';
import { Post } from '../../interfaces/post';
import { AuthService } from '../../services/firestore/auth/auth.service';
import { environment } from '../../../environments/environment';
import { AngularFirestore } from '@angular/fire/firestore';
import { User } from '../../interfaces/user';
import { InputsConfig } from '../../interfaces/inputs-config';
import { SsrService } from '../../services/firestore/ssr/ssr.service';
import * as _ from 'lodash';
import LazyLoad from "vanilla-lazyload";
// import { FcmService } from '../../services/fcm/fcm.service';
@Component({
  selector: 'app-blog',
  templateUrl: './blog.component.html',
  styleUrls: ['./blog.component.scss'],
  providers: [ NgbTypeaheadConfig ] // add NgbTypeaheadConfig to the component providers
})
export class BlogComponent implements OnInit {
  public inputsConfig: InputsConfig = {
    string: ['slug', 'category', 'title', 'description'],
    number: [],
    url: ['image'],
    quill: ['body'],
    date: ['created'],
    boolean: ['publish'],
    disabled: ['slug']
  };
  public environment = environment;
  public orderByOptions: Array<any> = [
    {
      label: 'Date: Newest',
      type: 'created',
      direction: 'desc'
    },
    {
      label: 'Date: Oldest',
      type: 'created',
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
  public collection: string = 'blog';
  public token: string;
  @ViewChild('searchBar') searchInputText: ElementRef; // Remove aria-multiline to improve SEO

  constructor(
    private afs: AngularFirestore,
    private http: HttpClient,
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private spinner: NgxSpinnerService,
    private ssrService: SsrService,
    public authService: AuthService,
    // public fcmService: FcmService,
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
    this.activatedRoute.queryParams.subscribe(params => {
      this.searchTerm = params.q;
      this.url = this.router.url;
    });
    this.spinner.show();
    this.ssrService.ssrFirestoreCollection(this.collection, `blog`, true).subscribe(response => {
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
        if (isPlatformBrowser(this.platformId)) {
          this.ngZone.runOutsideAngular(() => {
            setTimeout(() => {
              var myLazyLoad = new LazyLoad();
              myLazyLoad.update();
            }, 0);
          });
        }
      }
    }, () => {
      this.isLoading = false;
      this.spinner.hide();
    });
    // if (isPlatformServer(this.platformId)) { return; }
    // this.fcmService.getPermission().subscribe();
  }

  search = (text$: Observable<string>) => text$.pipe(
    debounceTime(0),
    distinctUntilChanged(),
    map(term => {
      const queryParams = _.isEmpty(term) ? {} : { queryParams: { q: term } };
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

  isPlatformBrowser() {
    return isPlatformBrowser(this.platformId);
  }
}
