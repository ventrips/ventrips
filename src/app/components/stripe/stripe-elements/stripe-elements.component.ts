import { Component, OnInit, ViewChild, ElementRef, Input } from '@angular/core';
import { AuthService } from './../../../services/firebase/auth/auth.service';
import { AngularFireFunctions } from '@angular/fire/functions';
import { environment } from './../../../../environments/environment';
import * as _ from 'lodash';

declare var Stripe: stripe.StripeStatic;

@Component({
  selector: 'app-stripe-elements',
  templateUrl: './stripe-elements.component.html',
  styleUrls: ['./stripe-elements.component.scss']
})
export class StripeElementsComponent implements OnInit {

  constructor(private auth: AuthService, private functions: AngularFireFunctions) {}

  @Input() amount: number;
  @Input() description: string;
  @ViewChild('cardElement', { static: false }) cardElement: ElementRef;

  stripe: stripe.Stripe;
  card;
  cardErrors;

  loading = false;
  confirmation;
  environment = environment;


  ngOnInit() {
    this.stripe = Stripe(this.environment.stripe.publishable);
    const elements = this.stripe.elements();
    this.card = elements.create('card');

    this.card.mount(this.cardElement.nativeElement);

    this.card.addEventListener('change', ({ error }) => {
        this.cardErrors = error && error.message;
    });
  }

  async handleForm(e) {
    e.preventDefault();

    const { source, error } = await this.stripe.createSource(this.card);

    if (error) {
      // Inform the customer that there was an error.
      const cardErrors = error.message;
    } else {
      // Send the token to your server.
      this.loading = true;
      const user = await this.auth.getUser();
      const fun = this.functions.httpsCallable('stripeCheckOutCharge');
      this.confirmation = await fun({ source: source.id, amount: this.amount, description: this.description }).toPromise();
      this.loading = false;

    }
  }
}
