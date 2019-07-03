import { Component, Inject, PLATFORM_ID, OnInit } from '@angular/core';
import { isPlatformBrowser, isPlatformServer } from '@angular/common';
import { SeoService } from './services/seo/seo.service';
import { AuthService } from './services/firebase/auth/auth.service';
import { ElementScrollPercentage } from './directives/element-scroll-percentage/element-scroll-percentage.component';
import * as _ from 'lodash';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  private elementScrollPercentage: ElementScrollPercentage;
  public pageScroll: number;

  constructor(
    private seoService: SeoService,
    private authService: AuthService,
    @Inject(PLATFORM_ID) private platformId: any,
    elementScrollPercentage: ElementScrollPercentage
  ) {
    this.elementScrollPercentage = elementScrollPercentage;
  }

  // Scroll to top whenever route changes
  onActivate(event) {
    if (isPlatformServer(this.platformId)) {
      return;
    }
    window.scrollTo(0, 0);
    this.seoService.setMetaTags();
  }

  ngOnInit() {
    if (isPlatformServer(this.platformId)) {
      return;
    }
    this.elementScrollPercentage.getScrollAsStream().subscribe((percent: number): void => {this.pageScroll = percent; });
  }
}
