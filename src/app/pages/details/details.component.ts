import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser, isPlatformServer } from '@angular/common';
import { ActivatedRoute, Router, NavigationEnd } from '@angular/router';
import { Post } from './../../interfaces/post';
import { SeoService } from '../../services/seo/seo.service';
import { AuthService } from '../../services/firestore/auth/auth.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { AngularFirestore } from '@angular/fire/firestore';
import { User } from '../../interfaces/user';
import { fadeInUpOnEnterAnimation } from 'angular-animations';
import { InputsConfig } from '../../interfaces/inputs-config';
import { environment } from '../../../environments/environment';
import { SsrService } from '../../services/firestore/ssr/ssr.service';
import * as _ from 'lodash';
import { filter } from 'rxjs/internal/operators/filter';
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
    number: [],
    url: ['image'],
    quill: ['body'],
    date: [],
    boolean: ['publish'],
    disabled: ['slug']
  };
  public post: Post;
  public posts: Array<Post>;
  public isLoading = true;
  public user: User;
  public slug: string;
  public url: string;
  public environment = environment;
  public collection: string = 'posts';

  constructor(
    private afs: AngularFirestore,
    private spinner: NgxSpinnerService,
    private seoService: SeoService,
    public authService: AuthService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private ssrService: SsrService,
    @Inject(PLATFORM_ID) private platformId: any
  ) {}

  ngOnInit() {
    this.url = this.router.url;
    this.authService.user$.subscribe(user => this.user = user);
    this.slug = this.activatedRoute.snapshot.params.slug;
    this.router.events.pipe(filter(event => event instanceof NavigationEnd)).subscribe(event => {
      console.log(Event);
      this.slug = this.activatedRoute.snapshot.params.slug;
      this.init();
    });
    this.init();
  }

  init() {
    this.isLoading = true;
    this.spinner.show();
    this.ssrService.ssrFirestoreDoc(`${this.collection}/${this.slug}`, `${this.collection}-${this.slug}`, true)
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
}
