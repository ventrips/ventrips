import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { Router } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import { AngularFirestore } from '@angular/fire/firestore';
import { SeoService } from '../../services/seo/seo.service';
import { AuthService } from '../../services/firestore/auth/auth.service';
import { environment } from '../../../environments/environment';
import { User } from '../../interfaces/user';
import { fadeInUpOnEnterAnimation } from 'angular-animations';
import { InputsConfig } from '../../interfaces/inputs-config';
import { SsrService } from '../../services/firestore/ssr/ssr.service';
import * as _ from 'lodash';

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
    number: [],
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
  public id: string;
  public user: User;
  public url: string;
  public collection: string = 'pages';

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
    this.id = _.split(this.url, '/')[1];
    this.authService.user$.subscribe(user => this.user = user);

    this.spinner.show();
    this.ssrService.ssrFirestoreDoc(`${this.collection}/${this.id}`, `${this.collection}-${this.id}`, true)
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
