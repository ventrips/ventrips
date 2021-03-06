import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { Router } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import { AngularFirestore } from '@angular/fire/firestore';
import { SeoService } from '../../services/seo/seo.service';
import { AuthService } from '../../services/firestore/auth/auth.service';
import { environment } from '../../../environments/environment';
import { User } from '../../interfaces/user';
import { InputsConfig } from '../../interfaces/inputs-config';
import { SsrService } from '../../services/firestore/ssr/ssr.service';
import * as _ from 'lodash';
@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss']
})
export class AdminComponent implements OnInit {
  public _ = _;
  public environment = environment;
  public isLoading = true;
  public payments: any;
  public forms: any;
  public user: User;
  public url: string;
  public collection: string = 'notifications';
  public inputsConfig: InputsConfig = {
    string: ['slug', 'title', 'body'],
    number: [],
    url: ['icon', 'link'],
    quill: [],
    date: [],
    boolean: [],
    disabled: []
  };

  constructor(
    private afs: AngularFirestore,
    private seoService: SeoService,
    private router: Router,
    private spinner: NgxSpinnerService,
    private ssrService: SsrService,
    public authService: AuthService
  ) {}

  ngOnInit() {
    this.url = this.router.url;
    this.authService.user$.subscribe(user => this.user = user);

    this.ssrService.ssrFirestoreCollectionGroup(`payments`, `payments-group`, false)
    .subscribe(response => {
      if (!_.isEmpty(response) && !_.isNil(response)) {
        this.payments = response;
      }
    }, () => {})

    this.ssrService.ssrFirestoreCollection(`forms`, `forms`, false)
    .subscribe(response => {
      if (!_.isEmpty(response) && !_.isNil(response)) {
        this.forms = response;
      }
    }, () => {});
  }
}
