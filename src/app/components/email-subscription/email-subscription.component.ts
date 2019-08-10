import { Component, Inject, PLATFORM_ID, OnInit } from '@angular/core';
import { isPlatformBrowser, isPlatformServer } from '@angular/common';
import { ToastrService } from 'ngx-toastr';
import { AngularFirestore } from '@angular/fire/firestore';
import * as _ from 'lodash';

@Component({
  selector: 'app-email-subscription',
  templateUrl: './email-subscription.component.html',
  styleUrls: ['./email-subscription.component.scss']
})
export class EmailSubscriptionComponent implements OnInit {

  public email;
  public emailSubmitted = false;
  private collection = 'emails';

  constructor(
    private afs: AngularFirestore,
    private toastrService: ToastrService,
    @Inject(PLATFORM_ID) private platformId: any
  ) { }

  ngOnInit() {
  }

  subscribeToNewsLetter() {
    if (!this.validateEmail()) {
      return;
    }
    this.afs.collection(this.collection).doc(this.email).set({ email: this.email })
    .then(success => {
      this.toastrService.success(`You will get notified for new updates!`, `Subscribed to Newsletter`)
      this.email = undefined;
      this.emailSubmitted = true;
    }).catch(error => {
      this.toastrService.warning(`${this.email} could already be subscribed`, _.get(error, ['code']));
    });
  }

  validateEmail() {
    var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(this.email).toLowerCase());
  }

  isPlatformBrowser() {
    return isPlatformBrowser(this.platformId);
  }
}
