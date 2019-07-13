import { Component, OnInit } from '@angular/core';
import { environment } from './../../../environments/environment';
import { PaymentModalComponent } from '../modals/payment-modal/payment-modal.component';
import { NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import * as _ from 'lodash';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss']
})
export class FooterComponent implements OnInit {
  public environment = environment;

  public socialMedia = [
    {
      name: 'Email',
      class: 'fa fa-envelope',
      url: `mailto:${_.startCase(environment.name)}@gmail.com?Subject=Hey ${_.startCase(environment.name)}`
    },
    {
      name: 'Facebook',
      class: 'fab fa-facebook-square',
      url: `https://www.facebook.com/JaMzTeR`
    },
    {
      name: 'Instagram',
      class: 'fab fa-instagram',
      url: `https://www.instagram.com/jamztuh`
    },
    {
      name: 'LinkedIn',
      class: 'fab fa-linkedin',
      url: `https://www.linkedin.com/in/johnsonhuynh`
    }
  ];
  public footerLinks = [
    {
      title: `Privacy`,
      url: `privacy`
    },
    {
      title: `Terms`,
      url: `terms`
    },
    {
      title: `About ${environment.name}`,
      url: `about`
    }
  ];

  constructor(
    private modalService: NgbModal
  ) { }

  ngOnInit() {
  }

  donate() {
    const modalOptions: NgbModalOptions = {
      backdrop: 'static',
      keyboard: false
    }
    const modalRef = this.modalService.open(PaymentModalComponent, modalOptions);
    modalRef.result.then((result?) => {}, (reason?) => {});
  }

}
