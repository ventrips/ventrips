import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { isPlatformBrowser, isPlatformServer } from '@angular/common';
import { TransferState, makeStateKey, StateKey } from '@angular/platform-browser';
import { filter, startWith, tap } from 'rxjs/operators';
import { SeoService } from '../../seo/seo.service';
import * as _ from 'lodash';

@Injectable({
  providedIn: 'root'
})
export class SsrService {

  constructor(
    private afs: AngularFirestore,
    private transferState: TransferState,
    private seoService: SeoService
  ) { }

  setSeo(page: any, stateKey: string, setSeo: boolean = false): void {
    if (_.isEqual(setSeo, true) && !_.isNil(page) && !_.isEmpty(page)) {
      const metaTags = {};
      // Default
      let title = _.get(page, ['title']);
      let description = _.get(page, ['description']);
      let image = _.get(page, ['image']);
      if (_.includes(stateKey, 'users')) {
        // Profile Page
        title = _.get(page, ['displayName'], 'Profile');
        description = _.get(page, ['description']);
        image = _.get(page, ['photoURL']);
      } else if (_.includes(stateKey, 'blog')) {
        // Home Page
        title = 'Home';
      }

      if (!_.isEmpty(title)) { metaTags['title'] = title; }
      if (!_.isEmpty(description)) { metaTags['description'] = description; }
      if (!_.isEmpty(image)) { metaTags['image'] = image; }
      this.seoService.setMetaTags(metaTags);
      this.seoService.createLinkForCanonicalURL();
    }
  }

  /* Use Server-Side Rendered Data when it exists rather than fetching again on browser */

  ssrFirestoreDoc(path: string, stateKey: string, setSeo: boolean = false) {
    const key = makeStateKey<any>(stateKey);
    const exists = this.transferState.get(key, {} as any);
    return this.afs.doc<any>(path).valueChanges().pipe(
      tap(page => {
        this.transferState.set(key, page);
        this.setSeo(page, stateKey, setSeo);
      }),
      startWith(exists)
    );
  }

  ssrFirestoreCollection(path: string, stateKey: string, setSeo: boolean = false) {
    const key = makeStateKey<any>(stateKey);
    const exists = this.transferState.get(key, {} as any);
    return this.afs.collection<any>(path).valueChanges().pipe(
      tap(page => {
        this.transferState.set(key, page);
        this.setSeo(page, stateKey, setSeo);
      }),
      startWith(exists)
    );
  }

  ssrFirestoreCollectionGroup(path: string, stateKey: string, setSeo: boolean = false) {
    const key = makeStateKey<any>(stateKey);
    const exists = this.transferState.get(key, {} as any);
    return this.afs.collectionGroup<any>(path).valueChanges().pipe(
      tap(page => {
        this.transferState.set(key, page);
        this.setSeo(page, stateKey, setSeo);
      }),
      startWith(exists)
    );
  }

}
