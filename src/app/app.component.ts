import { Component, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser, isPlatformServer } from '@angular/common';
import { SeoService } from './services/seo/seo.service';
import { AuthService } from './services/auth/auth.service';
import * as _ from 'lodash';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  public user: any;

  constructor(
    private seoService: SeoService,
    private authService: AuthService,
    @Inject(PLATFORM_ID) private platformId: any
  ) {}


  // Scroll to top whenever route changes
  onActivate(event) {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    window.scrollTo(0, 0);
    this.seoService.setMetaTags();
  }
}
