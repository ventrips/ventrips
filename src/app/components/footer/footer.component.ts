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
      name: 'Email',
      class: 'fa fa-envelope',
      url: `mailto:${_.startCase(environment.name)}@gmail.com?Subject=Hey ${_.startCase(environment.name)}`
    },
    {
      name: 'Facebook',
      class: 'fab fa-facebook-square',
      url: `https://www.facebook.com/JaMzTeR`
    },
    {
      name: 'Instagram',
      class: 'fab fa-instagram',
      url: `https://www.instagram.com/jamztuh`
    },
    {
      name: 'LinkedIn',
      class: 'fab fa-linkedin',
      url: `https://www.linkedin.com/in/johnsonhuynh`
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
