import { Injectable } from '@angular/core';
import { Post } from './../../../interfaces/post';
import { MockData } from './../../../../assets/mocks/mockData';
import * as _ from 'lodash';
import * as faker from 'faker';

@Injectable({
  providedIn: 'root'
})
export class PostsService {
  public posts = MockData.postsJSON;

  constructor() {}

  getPostByUID(uid: string) {
    return _.filter(this.posts, (post) => _.isEqual(post.uid, uid));
  }

  getPosts() {
    return this.posts;
  }
}
