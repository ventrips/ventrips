import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser, isPlatformServer } from '@angular/common';
import { TransferState, makeStateKey } from '@angular/platform-browser';
import { filter, startWith, tap } from 'rxjs/operators';
import { ActivatedRoute, Router, NavigationEnd } from '@angular/router';
import { Post } from './../../interfaces/post';
import { SeoService } from '../../services/seo/seo.service';
import { AuthService } from '../../services/firebase/auth/auth.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { AngularFirestore } from '@angular/fire/firestore';
import * as _ from 'lodash';
import { fadeInUpOnEnterAnimation } from 'angular-animations';
import { User } from '../../interfaces/user';
import { InputsConfig } from '../../interfaces/inputs-config';
import { environment } from '../../../environments/environment';

const COLLECTION = 'users';
const PAGE_KEY = makeStateKey<any>('profile');
@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
  animations: [
    fadeInUpOnEnterAnimation({ anchor: 'enter', duration: 1000, delay: 100, translate: '30px' })
  ]
})
export class ProfileComponent implements OnInit {
  public inputsConfig: InputsConfig = {
    string: ['description'],
    number: [],
    url: [],
    quill: ['bio'],
    date: [],
    boolean: [],
    disabled: []
  };
  public collection = COLLECTION;
  public id;
  public profile: User;
  public isLoading = true;
  public user: User;
  public _ = _;
  public environment = environment;
  public url: string;

  constructor(
    private afs: AngularFirestore,
    private transferState: TransferState,
    private spinner: NgxSpinnerService,
    private seoService: SeoService,
    public authService: AuthService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    @Inject(PLATFORM_ID) private platformId: any
  ) { }

  ngOnInit() {
    this.url = this.router.url;
    this.authService.user$.subscribe(user => this.user = user);
    // If profile component initiates and doesn't have uid in params, direct to johnson huynh's uid
    this.id = !_.isNil(this.activatedRoute.snapshot.params.uid) ?
      this.activatedRoute.snapshot.params.uid : `quU47PyHKEZWJaklZeRpJeMKOGy1`;
    this.spinner.show();
    this.ssrFirestoreDoc(`${this.collection}/${this.id}`)
      .subscribe(response => {
        if (!_.isEmpty(response) && !_.isNil(response)) {
          this.profile = response;
          this.spinner.hide();
          this.isLoading = false;
        }
      }, () => {
        this.spinner.hide();
        this.isLoading = false;
      }
    );
  }

  // Use Server-Side Rendered Data when it exists rather than fetching again on browser
  ssrFirestoreDoc(path: string) {
    const exists = this.transferState.get(PAGE_KEY, {} as any);
    return this.afs.doc<any>(path).valueChanges().pipe(
      tap(page => {
        this.transferState.set(PAGE_KEY, page);
        const metaTags = {};
        const title = _.get(page, ['displayName'], 'Profile');
        const description = _.get(page, ['description']);
        const image = _.get(page, ['photoURL']);
        if (!_.isEmpty(title)) { metaTags['title'] = title; }
        if (!_.isEmpty(description)) { metaTags['description'] = description; }
        if (!_.isEmpty(image)) { metaTags['image'] = image; }
        this.seoService.setMetaTags(metaTags);
    }),
      startWith(exists)
    );
  }
}