import { Component, OnInit } from '@angular/core';
import { SeoService } from '../../services/seo/seo.service';
import { AngularFirestore } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { Params, ActivatedRoute } from '@angular/router';
import { map, tap, startWith } from 'rxjs/operators';
import { TransferState, makeStateKey, StateKey } from '@angular/platform-browser';
import { environment } from '../../../environments/environment';
import * as _ from 'lodash';

const CONTACT_KEY = makeStateKey<any>('contact');

@Component({
  selector: 'app-contact',
  templateUrl: './contact.component.html',
  styleUrls: ['./contact.component.scss']
})
export class ContactComponent implements OnInit {
  public _ = _;
  public environment = environment;
  public data$: any;

  constructor(
    private afs: AngularFirestore,
    private seoService: SeoService,
    private router: ActivatedRoute,
    private transferState: TransferState
  ) {}

  ngOnInit() {
    const id = `contact`;
    this.data$ = this.ssrFirestoreDoc(`pages/${id}`);
  }

  ssrFirestoreDoc(path: string) {
    const exists = this.transferState.get(CONTACT_KEY, {} as any);
    return this.afs.doc<any>(path).valueChanges().pipe(
      tap(page => {
        this.transferState.set(CONTACT_KEY, page);
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
