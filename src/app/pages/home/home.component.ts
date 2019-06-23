import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
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
  public data;

  constructor(
    private seoService: SeoService,
    private http: HttpClient
  ) {

    this.http.get(`https://api.myjson.com/bins/12qook`).toPromise()
    .then(response => {
      if (!_.isNil(response)) {
        this.data = response;
      }
    }).catch(error => {});

    this.seoService.setMetaTags({
      title: `Custom Homepage Title`,
      description: `Manually putting custom description here`
    });
  }

  ngOnInit() {}

}
