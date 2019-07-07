import { Component, OnInit, Input } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { AuthService } from '../../../services/firebase/auth/auth.service';
import { EditModalConfirmComponent } from '../edit-modal-confirm/edit-modal-confirm.component';
import * as _ from 'lodash';

@Component({
  selector: 'app-edit-modal-content',
  templateUrl: './edit-modal-content.component.html',
  styleUrls: ['./edit-modal-content.component.scss']
})
export class EditModalContentComponent implements OnInit {
  @Input() data: any;
  @Input() isNew = false;

  constructor(
    private modalService: NgbModal,
    public activeModal: NgbActiveModal,
    public authService: AuthService
  ) {}

  ngOnInit() {
  }

  delete() {
    const modalRef = this.modalService.open(EditModalConfirmComponent);
    modalRef.componentInstance.title = `Delete`;
    modalRef.componentInstance.body = `Are you sure you want to delete?`;
    modalRef.result.then((result?) => {
      if (_.isEqual(result, 'delete')) {
        this.activeModal.close(result);
      }
    }, (reason?) => {

    });
  }
}
