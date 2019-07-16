import { Component, OnInit, Input, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { environment } from '../../../environments/environment';
import { fadeInUpOnEnterAnimation } from 'angular-animations';
import { AuthService } from '../../services/firestore/auth/auth.service';

@Component({
  selector: 'app-post',
  templateUrl: './post.component.html',
  styleUrls: ['./post.component.scss'],
  animations: [
    fadeInUpOnEnterAnimation({ anchor: 'enter', duration: 1000, delay: 100})
  ]
})
export class PostComponent implements OnInit {
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
  ) { }

  ngOnInit() {
    this.authService.user$.subscribe(user => this.user = user);
  }

  scrollToTop() {
    if (isPlatformBrowser(this.platformId)) {
      window.scrollTo(0, 0);
    }
  }
}
