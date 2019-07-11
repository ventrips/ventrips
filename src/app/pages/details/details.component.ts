import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser, isPlatformServer } from '@angular/common';
import { TransferState, makeStateKey } from '@angular/platform-browser';
import { filter, startWith, tap } from 'rxjs/operators';
import { ActivatedRoute, Router, NavigationEnd } from '@angular/router';
import { PostsService } from './../../services/firebase/posts/posts.service';
import { Post } from './../../interfaces/post';
import { SeoService } from '../../services/seo/seo.service';
import { AuthService } from '../../services/firebase/auth/auth.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { AngularFirestore } from '@angular/fire/firestore';
import { User } from '../../interfaces/user';
import { fadeInUpOnEnterAnimation } from 'angular-animations';
import { InputsConfig } from '../../interfaces/inputs-config';
import { environment } from '../../../environments/environment';
import * as _ from 'lodash';

const COLLECTION = 'posts';
const PAGE_KEY = makeStateKey<any>('details');

@Component({
  selector: 'app-details',
  templateUrl: './details.component.html',
  styleUrls: ['./details.component.scss'],
  animations: [
    fadeInUpOnEnterAnimation({ anchor: 'enter', duration: 1000, delay: 100, translate: '30px' })
  ]
})
export class DetailsComponent implements OnInit {
  public inputsConfig: InputsConfig = {
    string: ['slug', 'category', 'title', 'description'],
    url: ['image'],
    quill: ['body'],
    date: [],
    boolean: ['publish'],
    disabled: ['slug']
  };
  public post: Post;
  public posts: Array<Post>;
  public slug: string;
  public isLoading = true;
  public user: User;
  public collection = COLLECTION;
  public id: string;
  public url: string;
  public environment = environment;

  constructor(
    private afs: AngularFirestore,
    private transferState: TransferState,
    private spinner: NgxSpinnerService,
    private seoService: SeoService,
    public authService: AuthService,
    private postsService: PostsService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    @Inject(PLATFORM_ID) private platformId: any
  ) {}

  ngOnInit() {
    this.url = this.router.url;
    this.authService.user$.subscribe(user => this.user = user);

    this.id = this.activatedRoute.snapshot.params.slug;
    this.spinner.show();
    this.ssrFirestoreDoc(`${this.collection}/${this.id}`)
    .subscribe(response => {
      if (!_.isEmpty(response) && !_.isNil(response)) {
        this.post = response;
        this.spinner.hide();
        this.isLoading = false;
      }
    }, () => {
      this.spinner.hide();
      this.isLoading = false;
    });
  }

  // Use Server-Side Rendered Data when it exists rather than fetching again on browser
  ssrFirestoreDoc(path: string) {
    const exists = this.transferState.get(PAGE_KEY, {} as any);
    return this.afs.doc<any>(path).valueChanges().pipe(
      tap(page => {
        this.transferState.set(PAGE_KEY, page);
        this.seoService.setMetaTags({
          title: page.title,
          description: page.description,
          image: page.image
        });
      }),
      startWith(exists)
    );
  }
}
