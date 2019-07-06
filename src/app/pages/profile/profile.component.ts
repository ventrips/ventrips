import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser, isPlatformServer } from '@angular/common';
import { DomSanitizer, TransferState, makeStateKey } from '@angular/platform-browser';
import { filter, startWith, tap } from 'rxjs/operators';
import { ActivatedRoute, Router, NavigationEnd } from '@angular/router';
import { PostsService } from './../../services/firebase/posts/posts.service';
import { Post } from './../../interfaces/post';
import { SeoService } from '../../services/seo/seo.service';
import { AuthService } from '../../services/firebase/auth/auth.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { AngularFirestore } from '@angular/fire/firestore';
import * as faker from 'faker';
import * as _ from 'lodash';
import { User } from '../../interfaces/user';

const DETAILS_KEY = makeStateKey<any>('profile');

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {
  public uid: string;
  public profile: User;
  public isLoading = true;
  public user: User;

  constructor(
    private afs: AngularFirestore,
    private transferState: TransferState,
    private spinner: NgxSpinnerService,
    private seoService: SeoService,
    public authService: AuthService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private domSanitizer: DomSanitizer,
    @Inject(PLATFORM_ID) private platformId: any
  ) { }

  ngOnInit() {
    this.authService.user$.subscribe(user => this.user = user);
    this.uid = this.activatedRoute.snapshot.params.uid;
    this.spinner.show();
    this.ssrFirestoreDoc(`users/${this.uid}`)
      .subscribe(response => {
        if (!_.isEmpty(response) && !_.isNil(response)) {
          this.profile = response;
          this.seoService.setMetaTags({
            title: `${_.get(this.profile, ['displayName'])} - Profile`,
            description: `${_.get(this.profile, ['displayName'])}`,
            image: _.get(this.profile, ['photoURL'])
          });
          this.spinner.hide();
          this.isLoading = false;
        }
      }, () => {
        this.spinner.hide();
        this.isLoading = false;
        this.seoService.setMetaTags({
          title: `Sorry! This page does not exist`,
          description: `Return to home`
        });
      }
    );
  }

  // Use Server-Side Rendered Data when it exists rather than fetching again on browser
  ssrFirestoreDoc(path: string) {
    const exists = this.transferState.get(DETAILS_KEY, {} as any);
    return this.afs.doc<any>(path).valueChanges().pipe(
      tap(page => {
        this.transferState.set(DETAILS_KEY, page);
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