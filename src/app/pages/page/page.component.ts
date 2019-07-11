import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { Router } from '@angular/router';
import { map, tap, startWith } from 'rxjs/operators';
import { TransferState, makeStateKey, StateKey } from '@angular/platform-browser';
import { NgxSpinnerService } from 'ngx-spinner';
import { AngularFirestore } from '@angular/fire/firestore';
import { SeoService } from '../../services/seo/seo.service';
import { AuthService } from '../../services/firebase/auth/auth.service';
import { environment } from '../../../environments/environment';
import { User } from '../../interfaces/user';
import { fadeInUpOnEnterAnimation } from 'angular-animations';
import * as _ from 'lodash';
import { InputsConfig } from '../../interfaces/inputs-config';

@Component({
  selector: 'app-page',
  templateUrl: './page.component.html',
  styleUrls: ['./page.component.scss'],
  animations: [
    fadeInUpOnEnterAnimation({ anchor: 'enter', duration: 1000, delay: 100, translate: '30px' })
  ]
})
export class PageComponent implements OnInit {
  public inputsConfig: InputsConfig = {
    string: ['title', 'description'],
    url: [],
    quill: ['body'],
    date: [],
    boolean: [],
    disabled: []
  };
  public _ = _;
  public environment = environment;
  public isLoading = true;
  public data: any;

  public PAGE_KEY: any;
  public collection = 'pages';
  public id: string;
  public user: User;
  public url: string;

  constructor(
    private afs: AngularFirestore,
    private seoService: SeoService,
    private router: Router,
    private transferState: TransferState,
    private spinner: NgxSpinnerService,
    public authService: AuthService
  ) {}

  ngOnInit() {
    this.url = this.router.url;
    this.id = _.split(this.url, '/')[1];
    this.authService.user$.subscribe(user => this.user = user);

    this.spinner.show();
    this.ssrFirestoreDoc(`${this.collection}/${this.id}`)
    .subscribe(response => {
      if (!_.isEmpty(response) && !_.isNil(response)) {
        this.data = response;
        this.spinner.hide();
        this.isLoading = false;
      }
    }, () => {
        this.spinner.hide();
        this.isLoading = false;
    })
  }

  // Use Server-Side Rendered Data when it exists rather than fetching again on browser
  ssrFirestoreDoc(path: string) {
    const exists = this.transferState.get(this.PAGE_KEY, {} as any);
    return this.afs.doc<any>(path).valueChanges().pipe(
      tap(page => {
        this.transferState.set(this.PAGE_KEY, page);
        const metaTags = {};
        const title = _.get(page, ['title']);
        const description = _.get(page, ['description']);
        const image = _.get(page, ['image']);
        if (!_.isEmpty(title)) { metaTags['title'] = title; }
        if (!_.isEmpty(description)) { metaTags['description'] = description; }
        if (!_.isEmpty(image)) { metaTags['image'] = image; }
        this.seoService.setMetaTags(metaTags);
      }),
      startWith(exists)
    );
  }

}
