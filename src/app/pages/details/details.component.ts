import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser, isPlatformServer } from '@angular/common';
import { DomSanitizer } from '@angular/platform-browser';
import { filter } from 'rxjs/operators';
import { ActivatedRoute, Router, NavigationEnd } from '@angular/router';
import { SeoService } from '../../services/seo/seo.service';
import { Post } from './../../interfaces/post';
import * as faker from 'faker';
import * as _ from 'lodash';

@Component({
  selector: 'app-details',
  templateUrl: './details.component.html',
  styleUrls: ['./details.component.scss']
})
export class DetailsComponent implements OnInit {
  public tempAd = faker.image.imageUrl();
  public post: Post;

  constructor(
    private seoService: SeoService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private domSanitizer: DomSanitizer,
    @Inject(PLATFORM_ID) private platformId: any
  ) {
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.post = {
          postId: faker.random.uuid(),
          uid: faker.random.uuid(),
          slug: this.activatedRoute.snapshot.params.slug,
          topic: this.activatedRoute.snapshot.params.topic,
          title: faker.name.title(),
          description: faker.lorem.sentence(),
          image: faker.image.image(),
          body: faker.lorem.sentences(),
          published: false,
          dateEdited: faker.date.recent(),
          dateCreated: faker.date.past()
        };
        if (isPlatformBrowser(this.platformId)) {
          window.scrollTo(0, 0);
        }
      }
    });
  }

  ngOnInit() {
    this.seoService.setMetaTags({
      title: `${_.capitalize(this.post.slug)} - ${_.capitalize(this.post.topic)}`,
      description: `${_.capitalize(this.post.slug)}/${_.capitalize(this.post.topic)} Description`
    });
  }

  byPassHTML(html: string) {
    return this.domSanitizer.bypassSecurityTrustHtml(html);
  }
}
