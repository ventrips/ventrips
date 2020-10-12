import { Component, OnInit, Input } from '@angular/core';
import { makeStateKey, TransferState } from '@angular/platform-browser';
import { tap, startWith, filter } from 'rxjs/operators';
import { AngularFirestore } from '@angular/fire/firestore';
import { SsrService } from '../../services/firestore/ssr/ssr.service';
import * as _ from 'lodash';
import { NavigationEnd, Router } from '@angular/router';

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
    private router: Router,
    private afs: AngularFirestore,
    private transferState: TransferState,
    private ssrService: SsrService
  ) {}

  ngOnChanges(changes: any): void {
    this.init();
  }

  ngOnInit() {}

  init() {
    this.ssrService.ssrFirestoreCollection(this.collection, `blog`) // Use blog cache if already exists
    .subscribe(response => {
      if (!_.isEmpty(response) && !_.isNil(response)) {
        this.relatedPosts = _.filter(response, (item) =>
          _.isEqual(_.toLower(this.post.category), _.toLower(item.category)) &&
          !_.isEqual(_.toLower(this.post.slug), _.toLower(item.slug)) &&
          item.publish);
      }
    }, () => {

    });
  }
}
