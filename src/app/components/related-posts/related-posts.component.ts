import { Component, OnInit, Input, SimpleChanges } from '@angular/core';
import { makeStateKey, TransferState } from '@angular/platform-browser';
import { tap, startWith } from 'rxjs/operators';
import { AngularFirestore } from '@angular/fire/firestore';
import { SsrService } from '../../services/firestore/ssr/ssr.service';
import * as _ from 'lodash';

@Component({
  selector: 'app-related-posts',
  templateUrl: './related-posts.component.html',
  styleUrls: ['./related-posts.component.scss']
})
export class RelatedPostsComponent implements OnInit {
  @Input() post;
  @Input() collection: string;
  @Input() inputsConfig: string;
  public relatedPosts;
  public _ = _;

  constructor(
    private afs: AngularFirestore,
    private transferState: TransferState,
    private ssrService: SsrService
  ) { }

  ngOnChanges(changes: SimpleChanges): void {
    this.ssrService.ssrFirestoreCollection(this.collection, `home`) // Use homepage cache if already exists
    .subscribe(response => {
      if (!_.isEmpty(response) && !_.isNil(response)) {
        this.relatedPosts = _.filter(response, (item) => _.isEqual(this.post.category, item.category) && !_.isEqual(this.post.slug, item.slug));
      }
    }, () => {

    });
  }

  ngOnInit() {}
}
