import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser, isPlatformServer } from '@angular/common';
import { filter } from 'rxjs/operators';
import { ActivatedRoute, Router, NavigationEnd } from '@angular/router';
import { SeoService } from '../../services/seo/seo.service';
import * as faker from 'faker';
import * as _ from 'lodash';

@Component({
  selector: 'app-details',
  templateUrl: './details.component.html',
  styleUrls: ['./details.component.scss']
})
export class DetailsComponent implements OnInit {
  public slug;
  public category;
  public tempAd = faker.image.imageUrl();
  public data = {
    uid: faker.random.uuid(),
    firstName: faker.name.firstName(),
    lastName: faker.name.lastName(),
    title: faker.name.title(),
    description: faker.lorem.sentences(),
    timestamp: faker.date.past(),
    content: ``
  };

  constructor(
    private seoService: SeoService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    @Inject(PLATFORM_ID) private platformId: any
  ) {
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.slug = this.activatedRoute.snapshot.params.slug;
        this.category = this.activatedRoute.snapshot.params.category;
        if (isPlatformServer(this.platformId)) {
          window.scrollTo(0, 0);
        }
      }
    });
  }

  ngOnInit() {
    this.seoService.setMetaTags({
      title: `${_.capitalize(this.slug)} - ${_.capitalize(this.category)}`,
      description: `${_.capitalize(this.slug)}/${_.capitalize(this.category)} Description`
    });
  }
}
