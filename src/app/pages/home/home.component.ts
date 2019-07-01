import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { TransferState, makeStateKey, StateKey } from '@angular/platform-browser';
import { NgxSpinnerService } from 'ngx-spinner';
import { PostsService } from '../../services/firebase/posts/posts.service';
import { Post } from '../../interfaces/post';
import { SeoService } from '../../services/seo/seo.service';
import { environment } from '../../../environments/environment';
import * as _ from 'lodash';
@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  public environment = environment;
  public posts: Array<Post>;
  public test;

  constructor(
    private http: HttpClient,
    private spinner: NgxSpinnerService,
    private postsService: PostsService,
    private seoService: SeoService
  ) {}

  ngOnInit() {
    this.posts = this.postsService.getPosts();

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

}
