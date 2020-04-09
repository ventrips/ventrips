import { Component, OnInit, Inject, PLATFORM_ID, ViewChild, ElementRef, Renderer2, NgZone } from '@angular/core';
import { isPlatformBrowser, isPlatformServer } from '@angular/common';
import { Observable, Subject, merge } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { debounceTime, distinctUntilChanged, map, tap, startWith } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { NgxSpinnerService } from 'ngx-spinner';
import { NgbTypeaheadConfig } from '@ng-bootstrap/ng-bootstrap';
import { Post } from '../../interfaces/post';
import { AuthService } from '../../services/firestore/auth/auth.service';
import { environment } from '../../../environments/environment';
import { AngularFirestore } from '@angular/fire/firestore';
import { User } from '../../interfaces/user';
import { InputsConfig } from '../../interfaces/inputs-config';
import { SsrService } from '../../services/firestore/ssr/ssr.service';
import * as _ from 'lodash';
import LazyLoad from "vanilla-lazyload";

@Component({
  selector: 'app-travel',
  templateUrl: './travel.component.html',
  styleUrls: ['./travel.component.scss'],
  providers: [ NgbTypeaheadConfig ] // add NgbTypeaheadConfig to the component providers
})
export class TravelComponent implements OnInit {
  public title: string = `Real-Time Travel Dashboard Tracker`;
  public description: string = `See data, social media trends, and learn about travel news`;
  public environment = environment;
  public posts: Array<Post>;
  public isLoading = true;
  public _ = _;
  public user: User;
  public url: string;
  public collection: string = 'travel'
  public id: string = 'travelNumbers';
  public travelCharts: Array<any> = [];

  constructor(
    private afs: AngularFirestore,
    private http: HttpClient,
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private spinner: NgxSpinnerService,
    private ssrService: SsrService,
    public authService: AuthService,
    private renderer: Renderer2,
    private ngZone: NgZone,
    @Inject(PLATFORM_ID) private platformId: any
  ) {}

  ngOnInit() {
    this.authService.user$.subscribe(user => this.user = user);
    this.spinner.show();
    this.ssrService.setSeo({
      title: this.title,
      description: this.description
    }, `travel`, true);
    this.ssrService.ssrFirestoreDoc(`${this.collection}/${this.id}`, `${this.collection}-${this.id}`, false)
    .subscribe(response => {
      if (_.isEmpty(response)) {
        return;
      }
      this.travelCharts = response;
      this.isLoading = false;
      this.spinner.hide();
    }, () => {
      this.isLoading = false;
      this.spinner.hide();
    });
  }

  scrollToTop() {
    if (isPlatformBrowser(this.platformId)) {
      window.scrollTo(0, 0);
    }
  }

  isPlatformBrowser() {
    return isPlatformBrowser(this.platformId);
  }
}
