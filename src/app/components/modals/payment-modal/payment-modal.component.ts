import { Component, OnInit, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { IPayPalConfig, ICreateOrderRequest } from 'ngx-paypal';
import { environment } from '../../../../environments/environment';
import * as _ from 'lodash';
import { AuthService } from '../../../services/firebase/auth/auth.service';
@Component({
  selector: 'app-payment-modal',
  templateUrl: './payment-modal.component.html',
  styleUrls: ['./payment-modal.component.scss']
})
export class PaymentModalComponent implements OnInit {
  @Input() amount: number;
  @Input() category: string = 'DONATION';
  public currency = 'USD';

  public payPalConfig ? : IPayPalConfig;

  public environment = environment;
  public user;

  constructor(
    public activeModal: NgbActiveModal,
    public authService: AuthService
  ) {}

  ngOnInit(): void {
    this.authService.user$.subscribe(user => {
      this.user = user
      this.initConfig();
    });
  }

  public isDonation() {
    return _.isEqual(_.toUpper(this.category), 'DONATION');
  }

  public isValidAmount() {
    return !_.isNil(this.amount) && this.amount > 0;
  }

  public displayTitle() {
    if (!this.isValidAmount()) {
      return `Enter Donation Amount`;
    }
    return `Submit $${this.amount} for ${_.capitalize(this.category)}`;
  }

  private initConfig(): void {
    this.payPalConfig = {
        currency: _.toUpper(this.currency),
        clientId: this.environment.paypal.clientId,
        createOrderOnClient: (data) => < ICreateOrderRequest > {
            intent: 'CAPTURE',
            purchase_units: [{
                amount: {
                    currency_code: _.toUpper(this.currency),
                    value: _.toString(this.amount),
                    breakdown: {
                        item_total: {
                            currency_code: _.toUpper(this.currency),
                            value: _.toString(this.amount)
                        }
                    }
                },
                items: [{
                    name: `${this.environment.name} - ${this.category}`,
                    quantity: '1',
                    category: 'DIGITAL_GOODS',
                    unit_amount: {
                        currency_code: _.toUpper(this.currency),
                        value: _.toString(this.amount),
                    },
                }]
            }]
        },
        advanced: {
            commit: 'true'
        },
        style: {
            label: 'paypal',
            layout: 'vertical'
        },
        onApprove: (data, actions) => {
            console.log('onApprove - transaction was approved, but not authorized', data, actions);
            actions.order.get().then(details => {
                console.log('onApprove - you can get full order details inside onApprove: ', details);
            });

        },
        onClientAuthorization: (data) => {
            console.log('onClientAuthorization - you should probably inform your server about completed transaction at this point', data);
        },
        onCancel: (data, actions) => {
            console.log('OnCancel', data, actions);
        },
        onError: err => {
            console.log('OnError', err);
        },
        onClick: (data, actions) => {
            console.log('onClick', data, actions);
        },
    };
  }}
