import { Component, OnInit, Input } from '@angular/core';
import { makeStateKey, StateKey } from '@angular/platform-browser';
import { startWith } from 'rxjs/internal/operators/startWith';
import { AngularFirestore } from '@angular/fire/firestore';
import { SsrService } from '../../services/firebase/ssr/ssr.service';
import * as _ from 'lodash';

@Component({
  selector: 'app-related-posts',
  templateUrl: './related-posts.component.html',
  styleUrls: ['./related-posts.component.scss']
})
export class RelatedPostsComponent implements OnInit {
  @Input() path: string;
  @Input() stateKey: string;
  public data;

  constructor(
    private ssrService: SsrService
  ) { }

  ngOnInit() {
    this.ssrService.ssrFirestoreCollectionGroup(this.path, this.stateKey, false)
    .subscribe(response => {
      if (!_.isEmpty(response) && !_.isNil(response)) {
        this.data = response;
      }
    }, () => {

    });
  }
}
