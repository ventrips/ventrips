import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/firebase/auth/auth.service';
import { environment } from './../../../environments/environment';
import * as _ from 'lodash';
import { User } from '../../interfaces/user';
@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnInit {
  public environment = environment;
  public navBarLinks = [
    {
      title: `About`,
      url: `about`
    },
    {
      title: `Contact`,
      url: `contact`
    }
  ];
  public user: User;

  constructor(
    private router: Router,
    public authService: AuthService
  ) { }

  ngOnInit() {
    this.authService.user$.subscribe(user => this.user = user);
  }

  isActive(currentNav: string): boolean {
    if (_.isEqual(this.router.url, '') ||
      (_.isEqual(currentNav, '') &&
      _.includes(this.router.url, '/?q'))) {
      return true;
    }

    return _.isEqual(this.router.url, `/${currentNav}`);
  }

}
