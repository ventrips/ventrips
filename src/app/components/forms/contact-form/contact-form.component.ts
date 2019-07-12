import { Component, OnInit } from '@angular/core';
import { Contact } from './../../../interfaces/contact';
import * as _ from 'lodash';
import { AuthService } from '../../../services/firebase/auth/auth.service';
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
  public form: Contact = new Contact('', '', '', '');
  public user: User;
  public collection = COLLECTION;

  constructor(
    private afs: AngularFirestore,
    public authService: AuthService,
    public toastrService: ToastrService
  ) {}

  ngOnInit() {
    this.authService.user$.subscribe(user => {
      this.user = user;
      this.newContact();
    });
  }

  onSubmit() {
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
      ''
    );
  }

}