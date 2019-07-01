import { Injectable } from '@angular/core';
import { Post } from './../../../interfaces/post';
import * as _ from 'lodash';
import * as faker from 'faker';

@Injectable({
  providedIn: 'root'
})
export class PostsService {
  public posts: Array<Post> = _.map(_.range(0, 6), (item) => {
    const post: Post = {
      slug: faker.lorem.slug(),
      uid: faker.random.uuid(),
      topic: faker.name.jobArea(),
      title: faker.name.title(),
      description: faker.lorem.sentence(),
      image: faker.image.image(),
      body: faker.lorem.sentences(),
      created: faker.date.past(),
      modified: faker.date.recent(),
      published: true
    };
    return post;
  });

  constructor() {}

  getPostByUID(uid: string) {
    return _.filter(this.posts, (post) => _.isEqual(post.uid, uid));
  }

  getPosts() {
    return this.posts;
  }
}
