import { Component, OnInit } from '@angular/core';
import { Post } from './../../interfaces/post';
import * as faker from 'faker';
import * as _ from 'lodash';

@Component({
  selector: 'app-recent-posts',
  templateUrl: './recent-posts.component.html',
  styleUrls: ['./recent-posts.component.scss']
})
export class RecentPostsComponent implements OnInit {
  public posts = [];

  constructor() {}

  ngOnInit() {
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
        published: true,
        dateEdited: faker.date.recent(),
        dateCreated: faker.date.past()
      };
      this.posts.push(post);
    });
  }

}
