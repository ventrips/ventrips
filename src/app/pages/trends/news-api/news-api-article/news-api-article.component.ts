import { Component, OnInit, Input, Inject, PLATFORM_ID, NgZone } from '@angular/core';
import { isPlatformBrowser, isPlatformServer } from '@angular/common';
import LazyLoad from "vanilla-lazyload";

@Component({
  selector: 'app-news-api-article',
  templateUrl: './news-api-article.component.html',
  styleUrls: ['./news-api-article.component.scss']
})
export class NewsApiArticleComponent implements OnInit {
  @Input() article;

  constructor(
    private ngZone: NgZone,
    @Inject(PLATFORM_ID) private platformId: any
  ) {}

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.ngZone.runOutsideAngular(() => {
        setTimeout(() => {
          var myLazyLoad = new LazyLoad();
          myLazyLoad.update();
        }, 0);
      });
    }
  }

}
