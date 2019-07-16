import { Component, OnInit, Input } from '@angular/core';
import { environment } from '../../../environments/environment';
import { PaymentModalComponent } from '../payment-button/payment-modal/payment-modal.component';
import { NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { AuthService } from '../../services/firestore/auth/auth.service';
import * as _ from 'lodash';

@Component({
  selector: 'app-payment-button',
  templateUrl: './payment-button.component.html',
  styleUrls: ['./payment-button.component.scss']
})
export class PaymentButtonComponent implements OnInit {
  @Input() amount: number;
  @Input() category: string = 'Donation';

  constructor(
    public authService: AuthService,
    private modalService: NgbModal
  ) { }

  ngOnInit() {
  }

  isDonation() {
    return _.isEqual(_.toLower(this.category), 'donation');
  }

  openPayment() {
    const modalOptions: NgbModalOptions = {
      backdrop: 'static',
      keyboard: false
    }
    const modalRef = this.modalService.open(PaymentModalComponent, modalOptions);
    modalRef.componentInstance.amount = this.amount;
    modalRef.componentInstance.category = this.category;
    modalRef.result.then((result?) => {}, (reason?) => {});
  }
}
