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

const PAYMENTS_COLLECTION = 'payments';
const PAYMENTS_KEY = makeStateKey<any>(PAYMENTS_COLLECTION);

@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss'],
  animations: [
    fadeInUpOnEnterAnimation({ anchor: 'enter', duration: 1000, delay: 100, translate: '30px' })
  ]
})
export class AdminComponent implements OnInit {
  public _ = _;
  public environment = environment;
  public isLoading = true;
  public payments: any;
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
    this.authService.user$.subscribe(user => this.user = user);

    this.spinner.show();
    this.ssrFirestoreCollection(PAYMENTS_COLLECTION)
    .subscribe(response => {
      if (!_.isEmpty(response) && !_.isNil(response)) {
        this.payments = response;
        this.spinner.hide();
        this.isLoading = false;
      }
    }, () => {
        this.spinner.hide();
        this.isLoading = false;
    })
  }

  // Use Server-Side Rendered Data when it exists rather than fetching again on browser
  ssrFirestoreCollection(path: string) {
    const exists = this.transferState.get(PAYMENTS_KEY, {} as any);
    return this.afs.collection<any>(path).valueChanges().pipe(
      tap(page => {
        this.transferState.set(PAYMENTS_KEY, page);
      }),
      startWith(exists)
    );
  }

}
