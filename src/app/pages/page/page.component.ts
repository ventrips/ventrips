import { Component, OnInit, Inject, PLATFORM_ID, NgZone } from '@angular/core';
import { isPlatformBrowser, isPlatformServer } from '@angular/common';
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
import LazyLoad from "vanilla-lazyload";
import { QuillService } from '../../services/quill/quill.service';

@Component({
  selector: 'app-page',
  templateUrl: './page.component.html',
  styleUrls: ['./page.component.scss']
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
    public authService: AuthService,
    public quillService: QuillService,
    private ngZone: NgZone,
    @Inject(PLATFORM_ID) private platformId: any
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
        if (isPlatformBrowser(this.platformId)) {
          this.ngZone.runOutsideAngular(() => {
            setTimeout(() => {
              var myLazyLoad = new LazyLoad();
              myLazyLoad.update();
            }, 0);
          });
        }
      }
    }, () => {
        this.spinner.hide();
    })
  }
}
