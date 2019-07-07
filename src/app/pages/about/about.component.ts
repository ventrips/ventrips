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

const ID = 'about';
const COLLECTION = 'pages';
const PAGE_KEY = makeStateKey<any>(ID);
@Component({
  selector: 'app-about',
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.scss']
})
export class AboutComponent implements OnInit {
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
      }
      this.spinner.hide();
      this.isLoading = false;  
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
