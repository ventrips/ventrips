import { Component, OnInit } from '@angular/core';
import { environment } from './../../../environments/environment';
import * as _ from 'lodash';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss']
})
export class FooterComponent implements OnInit {
  public environment = environment;

  public socialMedia = [
    {
      name: 'Facebook',
      prefix: 'fab',
      icon: 'facebook-f',
      url: `https://www.facebook.com/JaMzTeR`
    },
    {
      name: 'LinkedIn',
      prefix: 'fab',
      icon: 'linkedin-in',
      url: `https://www.linkedin.com/in/johnsonhuynh`
    },
    {
      name: 'Email',
      prefix: 'fas',
      icon: 'envelope',
      url: `mailto:${_.startCase(environment.name)}@gmail.com?Subject=Hey ${_.startCase(environment.name)}`
    }
  ];
  public footerLinks = [
    {
      title: `Privacy`,
      url: `privacy`
    },
    {
      title: `Terms`,
      url: `terms`
    },
    {
      title: `About ${environment.name}`,
      url: `about`
    }
  ];

  constructor() { }

  ngOnInit() {}

}
