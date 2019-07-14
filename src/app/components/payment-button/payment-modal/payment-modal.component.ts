import { Component, OnInit, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { IPayPalConfig, ICreateOrderRequest } from 'ngx-paypal';
import { environment } from '../../../../environments/environment';
import * as _ from 'lodash';
import { AuthService } from '../../../services/firebase/auth/auth.service';
import { ToastrService } from 'ngx-toastr';
import { AngularFirestore } from '@angular/fire/firestore';

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
                    name: `${_.capitalize(this.environment.name)} - ${_.capitalize(this.category)}`,
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
            this.toastrService.success('Transaction was approved');
            actions.order.get().then(details => {
                this.toastrService.success('Transaction was authorized');
            });
        },
        onClientAuthorization: (data) => {
            this.afs.collection('payments').add(data)
            .then(success => {
                if (!_.isNil(this.user)) {
                    this.afs.collection('users').doc(this.user.uid).collection('payments').doc(success.id).set(data)
                    .then(success => {})
                    .catch(error => {
                        this.toastrService.warning(_.get(error, ['message']), _.get(error, ['code']));
                    });
                }
                this.toastrService.success('Transaction completed!');
            })
            .catch(error => {
              this.toastrService.warning(_.get(error, ['message']), _.get(error, ['code']));
            });
        },
        onCancel: (data, actions) => {
            this.toastrService.info('Transaction was cancelled');
        },
        onError: err => {
            this.toastrService.warning(err);
        },
        onClick: (data, actions) => {
        },
    };
  }}
