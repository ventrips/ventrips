import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser, isPlatformServer } from '@angular/common';
import { ActivatedRoute, Router, NavigationEnd, NavigationStart } from '@angular/router';
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
import { FcmService } from '../../services/fcm/fcm.service';
import { Fcm } from '../../interfaces/fcm';
import LazyLoad from "vanilla-lazyload";

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
    date: ['created'],
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
  public collection: string = 'blog';
  public fcm: Fcm;
  public _ = _;

  constructor(
    private afs: AngularFirestore,
    private spinner: NgxSpinnerService,
    private seoService: SeoService,
    public authService: AuthService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private ssrService: SsrService,
    public fcmService: FcmService,
    @Inject(PLATFORM_ID) private platformId: any
  ) {

  }

  ngOnInit() {
    this.authService.user$.subscribe(user => this.user = user);
    this.activatedRoute.params
    .subscribe(params => {
      this.url = this.router.url;
      this.slug = params.slug;
      // TODO: Temporary Until Google Removes /posts
      if (_.startsWith(this.url, '/posts')) {
        this.router.navigate(['/blog', this.slug]);
        return;
      }
      this.init();
    });
    // Lazy Load Images
    var myLazyLoad = new LazyLoad();
    myLazyLoad.update();
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

  sendPostPushNotification(post: Post) {
    if (isPlatformServer(this.platformId)) { return; }
    this.fcmService.sendPushNotification({
      title: post.title,
      body: post.description,
      icon: post.image,
      link: `${environment.url}/blog/${post.slug}`,
    })
  }
}
