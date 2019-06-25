import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from './../../../environments/environment';
import * as _ from 'lodash';
@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnInit {
  public environment = environment;
  public navBarLinks = [
    {
      title: `Contact`,
      url: `contact`
    }
  ];

  constructor(
    private router: Router
  ) { }

  ngOnInit() {
  }

  isActive(currentNav: string): boolean {
    if (_.isEqual(this.router.url, '')) {
      return true;
    }

    return _.isEqual(this.router.url, currentNav);
  }

}
