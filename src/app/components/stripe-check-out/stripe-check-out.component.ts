import { Component, OnInit, Input, HostListener } from '@angular/core';
import { AuthService } from '../../services/firebase/auth/auth.service';
import { AngularFireFunctions } from '@angular/fire/functions';
import { environment } from './../../../environments/environment';
import * as _ from 'lodash';

declare var StripeCheckout: any;

@Component({
  selector: 'app-stripe-check-out',
  templateUrl: './stripe-check-out.component.html',
  styleUrls: ['./stripe-check-out.component.scss']
})
export class StripeCheckOutComponent implements OnInit {
  @Input() amount;
  @Input() description;
  handler: any;
  confirmation: any;
  isLoading = false;
  environment = environment;

  constructor(private authService: AuthService, private angularFireFunctions: AngularFireFunctions) {

  }

  ngOnInit() {
   this.handler = StripeCheckout.configure({
    key: this.environment.stripe.secret,
    image: 'https://ventrips.com/pj-cruise-min.982eb894ebb4b5c7a705.jpg',
    locale: 'auto',
    source: async (source) => {
      this.isLoading = true;
      const user = await this.authService.getUser();
      const fun = this.angularFireFunctions.httpsCallable('stripeCheckOut');
      this.confirmation = await fun({ source: source.id, uid: user.uid, amount: this.amount }).toPromise();
      this.isLoading = false;
    }
   });
  }

  // Open the checkout handler
  async checkOut(e) {
    const user = await this.authService.getUser();
    this.handler.open({
      name: _.startCase(this.environment.name),
      description: this.description,
      amount: this.amount,
      email: user.email
    });
    e.preventDefault();
  }

  // Close on navigate
  @HostListener('window:popstate')
  onPopstate() {
    this.handler.close();
  }
}
