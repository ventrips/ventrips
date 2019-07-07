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
  ) {
    this.setMetaTags();
  }

  setMetaTags(config?: any) {
    // Default Metatags if not set
    const baseUrl = _.split(this.router.url, '/')[1];
    config = {
      title: `${!_.isEmpty(_.startCase(baseUrl)) ? _.capitalize(baseUrl) : environment.name}`,
      description: environment.description,
      image: `${environment.url}/assets/img/horse-shoe-bend-min.jpg`,
      url: `${environment.url}${!_.isEmpty(_.startCase(this.router.url)) ? this.router.url : ''}`,
      ...config
    };

    config.title = `${config.title} - ${_.startCase(environment.name)}`;

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
