import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { Params, ActivatedRoute } from '@angular/router';
import { map, tap, startWith } from 'rxjs/operators';
import { TransferState, makeStateKey, StateKey } from '@angular/platform-browser';
import { NgxSpinnerService } from 'ngx-spinner';
import { AngularFirestore } from '@angular/fire/firestore';
import { SeoService } from '../../services/seo/seo.service';
import { AuthService } from '../../services/firebase/auth/auth.service';
import { environment } from '../../../environments/environment';
import { User } from '../../interfaces/user';
import * as _ from 'lodash';

const ID = 'terms';
const COLLECTION = 'pages';
const PAGE_KEY = makeStateKey<any>(ID);
@Component({
  selector: 'app-terms',
  templateUrl: './terms.component.html',
  styleUrls: ['./terms.component.scss']
})
export class TermsComponent implements OnInit {
  public inputsConfig = {
    string: ['title', 'description'],
    quill: ['body'],
    date: [],
    boolean: [],
    disabled: []
  };
  public _ = _;
  public environment = environment;
  public isLoading = true;
  public data: any;
  public collection = COLLECTION;
  public id = ID;
  public user: User;

  constructor(
    private afs: AngularFirestore,
    private seoService: SeoService,
    private router: ActivatedRoute,
    private transferState: TransferState,
    private spinner: NgxSpinnerService,
    public authService: AuthService
  ) {}

  ngOnInit() {
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
    const exists = this.transferState.get(PAGE_KEY, {} as any);
    return this.afs.doc<any>(path).valueChanges().pipe(
      tap(page => {
        this.transferState.set(PAGE_KEY, page);
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
