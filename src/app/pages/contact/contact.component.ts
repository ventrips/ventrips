import { Component, OnInit } from '@angular/core';
import { SeoService } from '../../services/seo/seo.service';
import { AngularFirestore } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { Params } from '@angular/router';
import { map } from 'rxjs/operators';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import * as _ from 'lodash';

@Component({
  selector: 'app-contact',
  templateUrl: './contact.component.html',
  styleUrls: ['./contact.component.scss']
})
export class ContactComponent implements OnInit {
  public _ = _;
  public environment = environment;
  public url: string;
  public collection: string;
  public id = `GvfJVJeR9TeTDVF7OGRf`;
  public isLoading = true;
  public item: any;

  constructor(
    private seoService: SeoService,
    private router: Router,
    public db: AngularFirestore
  ) {
    this.url = this.router.url;
    this.collection = this.router.url.split('/')[1];
    db.collection(this.collection).doc(this.id).valueChanges()
    .subscribe(response => {
      if (!_.isNil(response)) {
        this.item = response;
        this.seoService.setMetaTags({
          title: this.item.title,
          description: this.item.description
        });
      }
      this.isLoading = false;
    }, () => {
      this.isLoading = false;
    });
  }

  ngOnInit() {}

}
