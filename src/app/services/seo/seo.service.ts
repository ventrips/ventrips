import { Injectable } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { environment } from './../../../environments/environment';
import * as _ from 'lodash';
@Injectable({
  providedIn: 'root'
})
export class SeoService {
  constructor(
    private title: Title,
    private meta: Meta,
    private router: Router
  ) {}

  setMetaTags(config?: any) {
    // Default Metatags if not set
    config = {
      title: `${!_.isEmpty(_.startCase(this.router.url)) ? _.startCase(this.router.url) : 'Home'}`,
      description: environment.description,
      image: `${environment.url}/favicon.ico`,
      url: `${environment.url}${!_.isEmpty(_.startCase(this.router.url)) ? this.router.url : ''}`,
      ...config
    };

    config.title = `${config.title} - ${environment.name}`;
    config.description = config.description;

    // Set HTML Document Title
    this.title.setTitle(config.title);

    // Google
    this.meta.updateTag({ name: 'Description', content: config.description });

    // Twitter
    this.meta.updateTag({ name: 'twitter:card', content: 'summary' });
    this.meta.updateTag({ name: 'twitter:site', content: `@${environment.name}` });
    this.meta.updateTag({ name: 'twitter:title', content: config.title });
    this.meta.updateTag({ name: 'twitter:description', content: config.description });
    this.meta.updateTag({ name: 'twitter:image', content: config.image });

    // Facebook and other social sites
    this.meta.updateTag({ property: 'og:type', content: 'article' });
    this.meta.updateTag({ property: 'og:site_name', content: `${environment.name}` });
    this.meta.updateTag({ property: 'og:title', content: config.title });
    this.meta.updateTag({ property: 'og:description', content: config.description });
    this.meta.updateTag({ property: 'og:image', content: config.image });
    this.meta.updateTag({ property: 'og:url', content: config.url });
  }
}
