import { Component, OnInit, Input } from '@angular/core';
import { NgbModal, ModalDismissReasons } from '@ng-bootstrap/ng-bootstrap';
import { firestore } from 'firebase/app';
import { AngularFirestore } from '@angular/fire/firestore';
import { ToastrService } from 'ngx-toastr';
import * as _ from 'lodash';
import { AuthService } from '../../services/firebase/auth/auth.service';
import { Router } from '@angular/router';
import { EditModalContentComponent } from './edit-modal-content/edit-modal-content.component';

@Component({
  selector: 'app-edit-modal',
  templateUrl: './edit-modal.component.html',
  styleUrls: ['./edit-modal.component.scss']
})
export class EditModalComponent implements OnInit {
  @Input() data: any;
  @Input() isNew = false;

  constructor(
    private modalService: NgbModal,
    private toastrService: ToastrService,
    private authService: AuthService,
    private afs: AngularFirestore,
    private router: Router
  ) {}

  ngOnInit() {
  }

  open() {
    const modalRef = this.modalService.open(EditModalContentComponent);
    modalRef.componentInstance.data = this.data;
    modalRef.componentInstance.isNew = this.isNew; 
    modalRef.result.then((result?) => {
      if (_.isEqual(result, 'delete')) {
        this.toastrService.success(`Item has been deleted.`, 'Delete Success!');
      }
    });
  }
}
