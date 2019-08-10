import { Component, Inject, PLATFORM_ID, OnInit } from '@angular/core';
import { isPlatformBrowser, isPlatformServer } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/firestore/auth/auth.service';
import { environment } from './../../../environments/environment';
import { User } from '../../interfaces/user';
import { NgbModal, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
import { LoginModalComponent } from '../modals/login-modal/login-modal.component';
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
    public authService: AuthService,
    private modalService: NgbModal,
    private toastrService: ToastrService,
    @Inject(PLATFORM_ID) private platformId: any
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

  login() {
    const modalOptions: NgbModalOptions = {
      backdrop: 'static',
      keyboard: false
    }
    const modalRef = this.modalService.open(LoginModalComponent, modalOptions);
    modalRef.result.then((result?) => {}, (reason?) => {});
  }

  isPlatformBrowser() {
    return isPlatformBrowser(this.platformId);
  }
}
