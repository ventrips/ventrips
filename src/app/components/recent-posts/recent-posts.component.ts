import { Component, OnInit } from '@angular/core';
import * as faker from 'faker';
import * as _ from 'lodash';

@Component({
  selector: 'app-recent-posts',
  templateUrl: './recent-posts.component.html',
  styleUrls: ['./recent-posts.component.scss']
})
export class RecentPostsComponent implements OnInit {
  public featuredPosts = [];

  constructor() {}

  ngOnInit() {
    _.forEach(_.range(0, 6), (item) => {
      const featuredPost = {
        uid: faker.random.uuid(),
        name: faker.name.findName(),
        slug: faker.internet.domainWord(),
        title: faker.name.title(),
        category: faker.commerce.department(),
        caption: faker.lorem.sentences(),
        image: faker.random.image()
      };
      this.featuredPosts.push(featuredPost);
    });
  }

}
