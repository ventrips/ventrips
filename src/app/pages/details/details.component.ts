import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser, isPlatformServer } from '@angular/common';
import { DomSanitizer } from '@angular/platform-browser';
import { filter } from 'rxjs/operators';
import { ActivatedRoute, Router, NavigationEnd } from '@angular/router';
import { PostsService } from './../../services/firebase/posts/posts.service';
import { Post } from './../../interfaces/post';
import { SeoService } from '../../services/seo/seo.service';
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
  public posts: Array<Post>;

  constructor(
    private seoService: SeoService,
    private postsService: PostsService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private domSanitizer: DomSanitizer,
    @Inject(PLATFORM_ID) private platformId: any
  ) {
    this.posts = this.postsService.getPosts();
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.post = _.find(this.posts, {
          slug: this.activatedRoute.snapshot.params.slug
        });
        if (isPlatformBrowser(this.platformId)) {
          window.scrollTo(0, 0);
        }
      }
    });
  }

  ngOnInit() {
    this.seoService.setMetaTags({
      title: `${_.capitalize(this.post.slug)}`,
      description: `${_.capitalize(this.post.slug)} Description`
    });
  }

  byPassHTML(html: string) {
    return this.domSanitizer.bypassSecurityTrustHtml(html);
  }
}
