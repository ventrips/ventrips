import { Component, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser, isPlatformServer } from '@angular/common';
import { SeoService } from './services/seo/seo.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {

  constructor(
    private seoService: SeoService,
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
