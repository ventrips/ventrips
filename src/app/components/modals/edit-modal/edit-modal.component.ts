import { Component, OnInit, Input } from '@angular/core';
import { NgbModal, ModalDismissReasons, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import { firestore } from 'firebase/app';
import { AngularFirestore } from '@angular/fire/firestore';
import { ToastrService } from 'ngx-toastr';
import * as _ from 'lodash';
import { AuthService } from '../../../services/firebase/auth/auth.service';
import { Router } from '@angular/router';
import { EditModalContentComponent } from './edit-modal-content/edit-modal-content.component';

@Component({
  selector: 'app-edit-modal',
  templateUrl: './edit-modal.component.html',
  styleUrls: ['./edit-modal.component.scss']
})
export class EditModalComponent implements OnInit {
  @Input() collection: string;
  @Input() id: string;
  @Input() data: any;
  @Input() isNew = false;
  @Input() posts: Array<any> = [];
  @Input() inputsConfig = {};
  public user;

  constructor(
    private modalService: NgbModal,
    private toastrService: ToastrService,
    private authService: AuthService,
    private afs: AngularFirestore,
    private router: Router
  ) {

  }

  ngOnInit() {
    this.authService.user$.subscribe(user => {
      this.user = user
      if (_.isEqual(this.collection, 'posts')) {
        // Converting string dates to date type
        this.data.created = _.get(this.data, ['created']) || firestore.Timestamp.fromDate(new Date());
        this.data.modified = _.get(this.data, ['modified']) || firestore.Timestamp.fromDate(new Date());
        // Initializing UID, Full Name, Photo URL
        this.data.uid = _.get(this.data, ['uid']) || _.get(this.user, ['uid']);
        this.data.displayName = _.get(this.data, ['displayName']) ||  _.get(this.user, ['displayName']);
        this.data.photoURL = _.get(this.data, ['photoURL']) ||  _.get(this.user, ['photoURL']);
      }
    });
  }

  open() {
    const modalOptions: NgbModalOptions = {
      backdrop: 'static',
      keyboard: false,
      windowClass: 'modal-100'
    }
    const modalRef = this.modalService.open(EditModalContentComponent, modalOptions);
    modalRef.componentInstance.collection = this.collection;
    modalRef.componentInstance.id = this.id;
    modalRef.componentInstance.data = _.assign({}, this.data);
    modalRef.componentInstance.isNew = this.isNew;
    modalRef.componentInstance.posts = this.posts;
    modalRef.componentInstance.inputsConfig = this.inputsConfig;

    modalRef.result.then((result?) => {
      if (_.isEqual(this.collection, 'posts')) {
        result.data.modified = firestore.Timestamp.fromDate(new Date());
      }
      if (_.isEqual(result.reason, 'delete') && _.isEqual(this.collection, 'posts')) {
        this.afs.collection(this.collection).doc(this.id).delete().
        then(success => {
          this.toastrService.success(`Item has been deleted.`, 'Delete Success!');
          this.router.navigate(['']);
        }).catch(error => {
          this.toastrService.warning(_.get(error, ['message']), _.get(error, ['code']));
        });
      } else if (_.isEqual(result.reason, 'create')) {
        this.afs.collection('posts').doc(result.data.slug).set(_.assign({}, result.data))
        .then(success => {
          this.toastrService.success(`Item has been created.`, 'Create Success!');
        }).catch(error => {
          this.toastrService.warning(_.get(error, ['message']), _.get(error, ['code']));
        });
      } else if (_.isEqual(result.reason, 'update')) {
        this.afs.collection(this.collection).doc(this.id).update(_.assign({}, result.data)).
        then(success => {
          this.toastrService.success(`Item has been updated.`, 'Update Success!');
        }).catch(error => {
          this.toastrService.warning(_.get(error, ['message']), _.get(error, ['code']));
        });
      }
    }, (reason?) => {
    });
  }
}
