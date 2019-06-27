import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
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

  constructor(
    private seoService: SeoService,
    private activatedRoute: ActivatedRoute
  ) {
    this.slug = this.activatedRoute.snapshot.params.slug;
    this.category = this.activatedRoute.snapshot.params.category;
  }

  ngOnInit() {
    this.seoService.setMetaTags({
      title: `${_.capitalize(this.slug)} - ${_.capitalize(this.category)}`,
      description: `${_.capitalize(this.slug)}/${_.capitalize(this.category)} Description`
    });
  }

}
