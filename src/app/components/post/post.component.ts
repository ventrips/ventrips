import { Component, OnInit, Input } from '@angular/core';
import { Post } from './../../interfaces/post';
import * as faker from 'faker';
import * as _ from 'lodash';

@Component({
  selector: 'app-post',
  templateUrl: './post.component.html',
  styleUrls: ['./post.component.scss']
})
export class PostComponent implements OnInit {
  @Input() post: Post;

  constructor() {}

  ngOnInit() {
  }

}
