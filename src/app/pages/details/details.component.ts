import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser, isPlatformServer } from '@angular/common';
import { ActivatedRoute, Router, NavigationEnd, NavigationStart } from '@angular/router';
import { Post } from './../../interfaces/post';
import { SeoService } from '../../services/seo/seo.service';
import { AuthService } from '../../services/firestore/auth/auth.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { AngularFirestore } from '@angular/fire/firestore';
import { User } from '../../interfaces/user';
import { InputsConfig } from '../../interfaces/inputs-config';
import { environment } from '../../../environments/environment';
import { SsrService } from '../../services/firestore/ssr/ssr.service';
import * as _ from 'lodash';
// import { FcmService } from '../../services/fcm/fcm.service';
import LazyLoad from "vanilla-lazyload";
import { QuillService } from '../../services/quill/quill.service';

@Component({
  selector: 'app-details',
  templateUrl: './details.component.html',
  styleUrls: ['./details.component.scss']
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
  public post = new Post();
  public posts: Array<Post>;
  public user: User;
  public slug: string;
  public url: string;
  public environment = environment;
  public collection: string = 'blog';
  public _ = _;

  constructor(
    private afs: AngularFirestore,
    private spinner: NgxSpinnerService,
    private seoService: SeoService,
    public authService: AuthService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private ssrService: SsrService,
    // public fcmService: FcmService,
    public quillService: QuillService,
    @Inject(PLATFORM_ID) private platformId: any
  ) {

  }

  ngOnInit() {
    this.authService.user$.subscribe(user => this.user = user);
    this.activatedRoute.params
    .subscribe(params => {
      this.url = this.router.url;
      this.slug = params.slug;
      this.init();
    });
  }

  init() {
    this.spinner.show();
    this.ssrService.ssrFirestoreDoc(`${this.collection}/${this.slug}`, `${this.collection}-${this.slug}`, true)
    .subscribe(response => {
      if (!_.isEmpty(response) && !_.isNil(response)) {
        this.post = response;
        this.spinner.hide();
        if (isPlatformBrowser(this.platformId)) {
          setTimeout(() => {
            var myLazyLoad = new LazyLoad();
            myLazyLoad.update();
          }, 0);
        }
      }
    }, () => {
      this.spinner.hide();
    });
  }

  // sendPostPushNotification(post: Post) {
  //   if (isPlatformServer(this.platformId)) { return; }
  //   this.fcmService.sendPushNotification({
  //     title: post.title,
  //     body: post.description,
  //     icon: post.image,
  //     link: `${environment.url}/blog/${post.slug}`,
  //   })
  // }
}
