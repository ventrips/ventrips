import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/firebase/auth/auth.service';
import { SeoService } from '../../services/seo/seo.service';
import { ToastrService } from 'ngx-toastr';
import * as _ from 'lodash';
@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  constructor(
    private router: Router,
    private authService: AuthService,
    private seoService: SeoService,
    private toastrService: ToastrService
  ) {}

  ngOnInit() {
    this.seoService.setMetaTags();
  }

  signInWithGoogle() {
    this.authService.signInWithGoogle();
  }

  signInWithFacebook() {
    this.authService.signInWithFacebook();
  }
}
