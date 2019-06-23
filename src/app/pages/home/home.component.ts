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
  public test = 'testing string from home component ts';

  constructor(
    private seoService: SeoService,
    private http: HttpClient
  ) {
    this.seoService.setMetaTags({
      title: `Custom Homepage Title`,
      description: `Manually putting custom description here`
    });
  }

  ngOnInit() {
    this.http.get(`https://reqres.in/api/users?delay=2`).toPromise()
    .then(response => {
      if (!_.isNil(response)) {
        this.data = response;
      }
    }).catch(error => {});
  }

}
