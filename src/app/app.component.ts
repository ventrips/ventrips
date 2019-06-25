import { Component } from '@angular/core';
import { SeoService } from './services/seo/seo.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {

  constructor(
    private seoService: SeoService,
  ) {}

  // Scroll to top whenever route changes
  onActivate(event) {
    window.scrollTo(0, 0);
    this.seoService.setMetaTags();
  }
}
