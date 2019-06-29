import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth/auth.service';
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
      title: `Home`,
      url: `''`
    },
    {
      title: `About`,
      url: `about`
    },
    {
      title: `Contact`,
      url: `contact`
    }
  ];

  constructor(
    private router: Router,
    public authService: AuthService
  ) { }

  ngOnInit() {
  }

  isActive(currentNav: string): boolean {
    if (_.isEqual(this.router.url, '')) {
      return true;
    }

    return _.includes(this.router.url, currentNav);
  }

}
