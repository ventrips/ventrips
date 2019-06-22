import { Component, OnInit } from '@angular/core';
import { SeoService } from '../../services/seo/seo.service';
import { environment } from '../../../environments/environment';
import * as _ from 'lodash';
@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  public environment = environment;

  constructor(
    private seoService: SeoService
  ) {
    this.seoService.setMetaTags({
      title: `Welcome to ${this.environment.name}!`,
      description: `Manually oputting custom description here`
    });
  }

  ngOnInit() {}

}
