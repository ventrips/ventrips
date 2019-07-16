import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { Router } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import { AngularFirestore } from '@angular/fire/firestore';
import { SeoService } from '../../services/seo/seo.service';
import { AuthService } from '../../services/firebase/auth/auth.service';
import { environment } from '../../../environments/environment';
import { User } from '../../interfaces/user';
import { fadeInUpOnEnterAnimation } from 'angular-animations';
import * as _ from 'lodash';
import { InputsConfig } from '../../interfaces/inputs-config';
import { SsrService } from '../../services/firebase/ssr/ssr.service';
@Component({
  selector: 'app-contact',
  templateUrl: './contact.component.html',
  styleUrls: ['./contact.component.scss'],
  animations: [
    fadeInUpOnEnterAnimation({ anchor: 'enter', duration: 1000, delay: 100, translate: '30px' })
  ]
})
export class ContactComponent implements OnInit {
  public inputsConfig: InputsConfig = {
    string: ['title', 'description'],
    number: [],
    url: [],
    quill: [],
    date: [],
    boolean: [],
    disabled: []
  };
  public _ = _;
  public environment = environment;
  public isLoading = true;
  public data: any;
  public user: User;
  public url: string;

  constructor(
    private afs: AngularFirestore,
    private seoService: SeoService,
    private router: Router,
    private spinner: NgxSpinnerService,
    private ssrService: SsrService,
    public authService: AuthService
  ) {
  }

  ngOnInit() {
    this.url = this.router.url;
    this.authService.user$.subscribe(user => this.user = user);

    this.spinner.show();
    this.ssrService.ssrFirestoreDoc(`pages/contact`, `pages-contact`, true)
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
}
