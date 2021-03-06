import { Injectable, Inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { DOCUMENT } from '@angular/common';
import { environment } from './../../../environments/environment';
import * as _ from 'lodash';
@Injectable({
  providedIn: 'root'
})
export class SeoService {
  private environment = environment;
  private link: HTMLLinkElement;

  constructor(
    private title: Title,
    private meta: Meta,
    private router: Router,
    @Inject(DOCUMENT) private document
  ) {}

  createLinkForCanonicalURL() {
    if (_.isNil(this.link)) {
      this.link = this.document.createElement('link');
      this.link.setAttribute('rel', 'canonical');
      this.document.head.appendChild(this.link);
    }
    this.link.setAttribute('href', this.environment.url + this.router.url);
  }

  setMetaTags(config?: any) {
    // Default Metatags if not set
    const baseUrl = _.split(this.router.url, '/')[1];
    config = {
      title: `${!_.isEmpty(_.startCase(baseUrl)) ? _.capitalize(baseUrl) : environment.name}`,
      description: environment.description,
      image: `${environment.url}/assets/icons/apple-touch-icon.png`,
      url: `${environment.url}${!_.isEmpty(_.startCase(this.router.url)) ? this.router.url : ''}`,
      ...config
    };

    if (!_.isEqual(_.toLower(config.title), _.toLower(environment.name))) {
      config.title = `${config.title} - ${_.startCase(environment.name)}`;
    }

    // Set title
    this.title.setTitle(config.title);

    // Keywords
    this.meta.updateTag({ name: 'keywords', content: _.join(_.compact(_.union(_.split(_.replace(_.toLower(`${config.title} ${config.description}`), new RegExp(/[^a-zA-Z0-9]/g), ' '), ' '))), ', ')});

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
    this.meta.updateTag({ property: 'fb:app_id', content: environment.facebookAppId });
  }
}
