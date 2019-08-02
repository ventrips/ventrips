import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { Router } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import { AngularFirestore } from '@angular/fire/firestore';
import { SeoService } from '../../services/seo/seo.service';
import { AuthService } from '../../services/firestore/auth/auth.service';
import { environment } from '../../../environments/environment';
import { User } from '../../interfaces/user';
import * as _ from 'lodash';
import { InputsConfig } from '../../interfaces/inputs-config';
import { SsrService } from '../../services/firestore/ssr/ssr.service';
@Component({
  selector: 'app-contact',
  templateUrl: './contact.component.html',
  styleUrls: ['./contact.component.scss']
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
  public data: any;
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
  ) {
  }

  ngOnInit() {
    this.url = this.router.url;
    this.authService.user$.subscribe(user => this.user = user);

    this.spinner.show();
    this.ssrService.ssrFirestoreDoc(`${this.collection}/contact`, `${this.collection}-contact`, true)
    .subscribe(response => {
      if (!_.isEmpty(response) && !_.isNil(response)) {
        this.data = response;
        this.spinner.hide();
      }
    }, () => {
        this.spinner.hide();
    });
  }
}
