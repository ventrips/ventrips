import { Component, OnInit, Input } from '@angular/core';
import { NgbModal, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { AuthService } from '../../../services/firebase/auth/auth.service';
import { EditModalConfirmComponent } from '../edit-modal-confirm/edit-modal-confirm.component';
import { ToastrService } from 'ngx-toastr';
import * as _ from 'lodash';

@Component({
  selector: 'app-edit-modal-content',
  templateUrl: './edit-modal-content.component.html',
  styleUrls: ['./edit-modal-content.component.scss']
})
export class EditModalContentComponent implements OnInit {
  @Input() collection: string;
  @Input() id: string;
  @Input() data: any;
  @Input() isNew = false;
  @Input() inputsConfig = {};
  public _ = _;
  public keys = [];
  public user;

  constructor(
    private modalService: NgbModal,
    public activeModal: NgbActiveModal,
    public authService: AuthService,
    private toastrService: ToastrService
  ) {}

  ngOnInit() {
    this.authService.user$.subscribe(user => {
      this.user = user
      // this.keys = _.keys(this.data);
      this.keys = _.orderBy(
        _.concat(
          _.get(this.inputsConfig, ['string']),
          _.get(this.inputsConfig, ['quill']),
          _.get(this.inputsConfig, ['date']),
          _.get(this.inputsConfig, ['boolean'])
        ),
        [(key) => _.includes(_.get(this.inputsConfig, ['quill']), key)], ['asc']
      );
    });
  }

  isDisabled(key: string) {
    if (_.get(this.user, ['roles', 'admin']) && !_.isEqual(key, 'slug')) {
      return false;
    }

    return !this.isNew && _.includes(_.get(this.inputsConfig, ['disabled']), key);
  }

  isValid() {
    return _.every(this.keys, (key) => {
      if (_.includes(_.get(this.inputsConfig, ['date']), key)) {
        return _.isDate(_.get(this.data, [key]).toDate());
      }
      if (_.includes(_.get(this.inputsConfig, ['boolean']), key)) {
        return true;
      }
      return !_.isEmpty(this.data[key]);
    });
  }

  delete() {
    if (!this.authService.canEdit(this.user, _.get(this.data, ['uid']))) {
      return;
    }
    const modalOptions: NgbModalOptions = {
      backdrop: 'static',
      keyboard: false
    }
    const modalRef = this.modalService.open(EditModalConfirmComponent, modalOptions);
    modalRef.componentInstance.title = `Delete`;
    modalRef.componentInstance.body = `Are you sure you want to delete?`;
    modalRef.result.then((reason?) => {
      if (_.isEqual(reason, 'delete')) {
        this.activeModal.close({ reason: 'delete', data: this.data });
      }
    }, (reason?) => {});
  }

  copyToClipboard(record) {
    const content = JSON.stringify(record, null, 4);
    document.addEventListener('copy', (e: ClipboardEvent) => {
      e.clipboardData.setData('text/plain', content);
      e.preventDefault();
      document.removeEventListener('copy', () => {});
    });
    document.execCommand('copy');
    this.toastrService.info(`Copied. Paste where you want`);
  }
}
