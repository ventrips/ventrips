import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth/auth.service';
import { SeoService } from '../../services/seo/seo.service';
import { ToastrService } from 'ngx-toastr';
import * as _ from 'lodash';
@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  public user: any;

  constructor(
    private authService: AuthService,
    private seoService: SeoService,
    private toastrService: ToastrService
  ) {}

  ngOnInit() {
    this.seoService.setMetaTags();
  }


  signInWithGoogle() {
    this.authService.signInWithGoogle().then(response => {
      if (!_.isNil(response)) {
        this.user = response.user;
      } else {
        this.user = undefined;
      }
    }).catch(error => {
      this.user = undefined;
    });
  }

  signInWithFacebook() {
    this.authService.signInWithFacebook().then(response => {
      if (!_.isNil(response)) {
        this.user = response.user;
      } else {
        this.user = undefined;
      }
    }).catch(error => {
      this.user = undefined;
    });
  }
}
