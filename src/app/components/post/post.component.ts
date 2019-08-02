import { Component, OnInit, Input, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser, isPlatformServer } from '@angular/common';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../services/firestore/auth/auth.service';
import LazyLoad from "vanilla-lazyload";

@Component({
  selector: 'app-post',
  templateUrl: './post.component.html',
  styleUrls: ['./post.component.scss']
})
export class PostComponent implements OnInit {
  @Input() showEditButton = false;
  @Input() searchTerm;
  @Input() post;
  @Input() collection;
  @Input() id;
  @Input() inputsConfig;

  public user;
  public environment = environment;

  constructor(
    public authService: AuthService,
    @Inject(PLATFORM_ID) private platformId: any
  ) {}

  ngOnInit() {
    this.authService.user$.subscribe(user => this.user = user);
    if (isPlatformBrowser(this.platformId)) {
      setTimeout(() => {
        var myLazyLoad = new LazyLoad();
        myLazyLoad.update();
      }, 0);
    }
  }

  scrollToTop() {
    if (isPlatformBrowser(this.platformId)) {
      window.scrollTo(0, 0);
    }
  }
}
