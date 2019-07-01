import { Injectable } from '@angular/core';
import { Post } from './../../../interfaces/post';
import * as _ from 'lodash';
import * as faker from 'faker';

@Injectable({
  providedIn: 'root'
})
export class PostsService {
  public posts = [];

  constructor() {
    _.forEach(_.range(0, 6), (item) => {
      const post: Post = {
        postId: faker.random.uuid(),
        uid: faker.random.uuid(),
        topic: _.toLower(faker.name.jobArea()),
        slug: faker.lorem.slug(),
        title: faker.name.title(),
        description: faker.lorem.sentence(),
        image: faker.image.image(),
        body: faker.lorem.sentences(),
        created: faker.date.past(),
        modified: faker.date.recent(),
        published: true
      };
      this.posts.push(post);
    });
  }

  getPostByUID() {

  }

  getPosts() {
    return this.posts;
  }
}
