import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser, isPlatformServer } from '@angular/common';
import { ActivatedRoute, Router, NavigationEnd } from '@angular/router';
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
import LazyLoad from "vanilla-lazyload";
import { QuillService } from '../../services/quill/quill.service';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
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
  public id;
  public profile: User;
  public isLoading = true;
  public user: User;
  public environment = environment;
  public url: string;
  public collection: string = 'users';
  public _ = _;

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private afs: AngularFirestore,
    private spinner: NgxSpinnerService,
    private seoService: SeoService,
    private ssrService: SsrService,
    public authService: AuthService,
    public quillService: QuillService,
    @Inject(PLATFORM_ID) private platformId: any
  ) { }

  ngOnInit() {
    this.url = this.router.url;
    this.authService.user$.subscribe(user => this.user = user);
    // If profile component initiates and doesn't have uid in params, direct to johnson huynh's uid
    this.id = !_.isNil(this.activatedRoute.snapshot.params.uid) ?
      this.activatedRoute.snapshot.params.uid : `quU47PyHKEZWJaklZeRpJeMKOGy1`;
    this.spinner.show();
    this.ssrService.ssrFirestoreDoc(`${this.collection}/${this.id}`, `${this.collection}-${this.id}`, true)
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
    if (isPlatformServer(this.platformId)) {
      return;
    }
    // Lazy Load Images
    var myLazyLoad = new LazyLoad();
    myLazyLoad.update();
  }
}