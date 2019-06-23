import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import * as _ from 'lodash';
@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  public data;

  constructor(
    private activatedRoute: ActivatedRoute
  ) {
    this.data = this.activatedRoute.snapshot.data.data;
  }

  ngOnInit() {}

}
