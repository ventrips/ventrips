import { Component, OnInit } from '@angular/core';
import { Observable, Subject, merge } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { debounceTime, distinctUntilChanged, map } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { TransferState, makeStateKey, StateKey } from '@angular/platform-browser';
import { NgxSpinnerService } from 'ngx-spinner';
import { NgbTypeaheadConfig } from '@ng-bootstrap/ng-bootstrap';
import { PostsService } from '../../services/firebase/posts/posts.service';
import { Post } from '../../interfaces/post';
import { SeoService } from '../../services/seo/seo.service';
import { environment } from '../../../environments/environment';
import * as _ from 'lodash';
@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  providers: [ NgbTypeaheadConfig ] // add NgbTypeaheadConfig to the component providers

})
export class HomeComponent implements OnInit {
  public environment = environment;
  public orderByOptions: Array<any> = [
    {
      label: 'Title: A - Z',
      type: 'title',
      direction: 'asc'
    },
    {
      label: 'Title: Z - A',
      type: 'title',
      direction: 'desc'
    }
  ];
  public selectedOrderBy: any;

  public orderByDirection: string;
  public orderByType: string;

  public searchTerm: any;
  public searchOptions: Array<string>;
  public posts: Array<Post>;
  public test;
  public _ = _;

  constructor(
    private http: HttpClient,
    private spinner: NgxSpinnerService,
    private postsService: PostsService,
    private seoService: SeoService,
    private activatedRoute: ActivatedRoute
  ) {}

  ngOnInit() {
    this.activatedRoute.queryParams.subscribe(params => {
      this.searchTerm = params.topic;
    });
    this.posts = this.postsService.getPosts();
    this.searchOptions = _.map(this.posts, (post) => post.title);

    this.spinner.show();
    this.http.get(`https://reqres.in/api/users?delay=1`).toPromise()
    .then(response => {
      if (!_.isNil(response)) {
        this.test = response;
        this.seoService.setMetaTags({
          title: `${this.test.data[0].first_name} - Test API`,
          description: `${this.test.data[0].email}`
        });
      }
      this.spinner.hide();
    }).catch(error => {
      this.spinner.hide();
    });
  }

  search = (text$: Observable<string>) =>
    text$.pipe(
      debounceTime(0),
      distinctUntilChanged(),
      map(term => term.length < 1 ? []
        : this.searchOptions.filter(v => v.toLowerCase().startsWith(term.toLocaleLowerCase())).splice(0, 10))
    )

}
