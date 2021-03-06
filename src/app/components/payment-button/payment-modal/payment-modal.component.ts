import { Component, OnInit, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { IPayPalConfig, ICreateOrderRequest } from 'ngx-paypal';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../../../services/firestore/auth/auth.service';
import { ToastrService } from 'ngx-toastr';
import { AngularFirestore } from '@angular/fire/firestore';
import * as _ from 'lodash';

@Component({
  selector: 'app-payment-modal',
  templateUrl: './payment-modal.component.html',
  styleUrls: ['./payment-modal.component.scss']
})
export class PaymentModalComponent implements OnInit {
  @Input() amount: number;
  @Input() category: string = 'Donation';
  public currency = 'USD';

  public payPalConfig ? : IPayPalConfig;

  public environment = environment;
  public user;
  public _ = _;

  constructor(
    public activeModal: NgbActiveModal,
    public authService: AuthService,
    private toastrService: ToastrService,
    private afs: AngularFirestore
  ) {}

  ngOnInit(): void {
    this.authService.user$.subscribe(user => {
      this.user = user
      this.initConfig();
    });
  }

  public isDonation() {
    return _.isEqual(_.toLower(this.category), 'donation');
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
                    name: `${_.capitalize(this.category)}`,
                    quantity: '1',
                    category: 'DIGITAL_GOODS',
                    unit_amount: {
                        currency_code: _.toUpper(this.currency),
                        value: _.toString(this.amount),
                    },
                }]
            }],
            payer: {
                name: {
                    given_name: "PayPal",
                    surname: "Customer"
                  },
                  address: {
                    address_line_1: '123 ABC Street',
                    address_line_2: 'Apt 2',
                    admin_area_2: 'San Jose',
                    admin_area_1: 'CA',
                    postal_code: '95121',
                    country_code: 'US'
                  },
                  email_address: "customer@domain.com",
                  phone: {
                    phone_type: "MOBILE",
                    phone_number: {
                      national_number: "14082508100"
                    }
                  }
            }
        },
        advanced: {
            commit: 'true'
        },
        style: {
            label: 'paypal',
            layout: 'vertical'
        },
        onApprove: (data, actions) => {
            actions.order.get().then(details => {});
        },
        onClientAuthorization: (data) => {
            if (!_.isNil(this.user)) {
                this.afs.collection('users').doc(this.user.uid).collection('payments').add(data)
                .then(success => {
                    this.toastrService.success('Transaction completed!');
                    this.activeModal.close();
                })
                .catch(error => {
                    this.toastrService.warning(_.get(error, ['message']), _.get(error, ['code']));
                });
            } else {
                this.afs.collection('payments').add(data)
                .then(success => {
                    this.toastrService.success('Transaction completed!');
                    this.activeModal.close();
                })
                .catch(error => {
                  this.toastrService.warning(_.get(error, ['message']), _.get(error, ['code']));
                });
            }
        },
        onCancel: (data, actions) => {
        },
        onError: err => {
            this.toastrService.warning(err);
        },
        onClick: (data, actions) => {
        },
    };
  }}
