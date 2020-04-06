import { Component, Inject, PLATFORM_ID, OnInit } from '@angular/core';
import { isPlatformBrowser, isPlatformServer } from '@angular/common';
import { firestore } from 'firebase/app';
import { Contact } from './../../../interfaces/contact';
import * as _ from 'lodash';
import { AuthService } from '../../../services/firestore/auth/auth.service';
import { User } from '../../../interfaces/user';
import { ToastrService } from 'ngx-toastr';
import { AngularFirestore } from '@angular/fire/firestore';

const COLLECTION = 'forms';
@Component({
  selector: 'app-contact-form',
  templateUrl: './contact-form.component.html',
  styleUrls: ['./contact-form.component.scss']
})
export class ContactFormComponent implements OnInit {
  public form: Contact = new Contact('', '', '', '', firestore.Timestamp.fromDate(new Date()));
  public user: User;
  public collection = COLLECTION;

  constructor(
    private afs: AngularFirestore,
    public authService: AuthService,
    public toastrService: ToastrService,
    @Inject(PLATFORM_ID) private platformId: any
  ) {}

  ngOnInit() {
    this.authService.user$.subscribe(user => {
      this.user = user;
      this.newContact();
    });
  }

  onSubmit() {
    this.form.date = firestore.Timestamp.fromDate(new Date());
    this.afs.collection(this.collection).add(_.assign({}, this.form))
    .then(success => {
      this.newContact();
      this.toastrService.success(`Form has been submitted.`, 'Submission Success!');
    }).catch(error => {
      this.toastrService.warning(_.get(error, ['message']), _.get(error, ['code']));
    });
  }

  newContact() {
    this.form = new Contact(
      _.get(this.user, ['uid']) || '',
      _.get(this.user, ['displayName'], '') || '',
      _.get(this.user, ['email'], '') || '',
      '',
      firestore.Timestamp.fromDate(new Date())
    );
  }

  isPlatformBrowser() {
    return isPlatformBrowser(this.platformId);
  }

}
