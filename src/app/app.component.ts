import { Component, Inject, PLATFORM_ID, OnInit } from '@angular/core';
import { Angulartics2GoogleAnalytics } from 'angulartics2/ga';
import { isPlatformBrowser, isPlatformServer } from '@angular/common';
import { SeoService } from './services/seo/seo.service';
import { AuthService } from './services/firestore/auth/auth.service';
import { ElementScrollPercentage } from './directives/element-scroll-percentage/element-scroll-percentage.component';
import * as _ from 'lodash';
// import { FcmService } from './services/fcm/fcm.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  private elementScrollPercentage: ElementScrollPercentage;
  public pageScroll: number;
  public token;

  constructor(
    private seoService: SeoService,
    private authService: AuthService,
    // public fcmService: FcmService,
    @Inject(PLATFORM_ID) private platformId: any,
    elementScrollPercentage: ElementScrollPercentage,
    angulartics2GoogleAnalytics: Angulartics2GoogleAnalytics
  ) {
    if (isPlatformServer(this.platformId)) { return; }
    this.elementScrollPercentage = elementScrollPercentage;
    angulartics2GoogleAnalytics.startTracking();
  }

  // Scroll to top whenever route changes
  onActivate(event) {
    this.scrollToTop();
  }

  scrollToTop() {
    if (isPlatformServer(this.platformId)) { return; }
    window.scrollTo(0, 0);
  }

  ngOnInit() {
    if (isPlatformServer(this.platformId)) { return; }
    this.elementScrollPercentage.getScrollAsStream().subscribe((percent: number): void => {this.pageScroll = percent; });
    // this.fcmService.showMessages().subscribe();
  }

  isPlatformBrowser() {
    return isPlatformBrowser(this.platformId);
  }
}
