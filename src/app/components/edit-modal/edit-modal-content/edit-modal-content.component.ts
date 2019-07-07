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
  @Input() collection: string;
  @Input() id: string;
  @Input() data: any;
  @Input() isNew = false;
  @Input() string = [];
  @Input() quill = [];
  @Input() date = [];
  @Input() boolean = [];
  @Input() disabled = [];
  public _ = _;
  public keys = [];
  public user;

  constructor(
    private modalService: NgbModal,
    public activeModal: NgbActiveModal,
    public authService: AuthService
  ) {}

  ngOnInit() {
    this.authService.user$.subscribe(user => {
      this.user = user
      // this.keys = _.keys(this.data);
      this.keys = _.concat(this.string, this.quill, this.date, this.boolean);
      this.keys = _.orderBy(
        _.concat(this.string, this.quill, this.date, this.boolean),
        [(key) => _.includes(this.quill, key)], ['asc']
      );
    });
  }

  isDisabled(key: string) {
    if (_.get(this.user, ['roles', 'admin']) && !_.isEqual(key, 'slug')) {
      return false;
    }

    return !this.isNew && _.includes(this.disabled, key);
  }

  isValid() {
    return _.every(this.keys, (key) => {
      if (_.includes(this.date, key)) {
        return _.isDate(_.get(this.data, [key]).toDate());
      }
      if (_.includes(this.boolean, key)) {
        return true;
      }
      return !_.isEmpty(this.data[key]);
    });
  }

  delete() {
    if (!this.authService.canEdit(this.user, _.get(this.data, ['uid']))) {
      return;
    }
    const modalRef = this.modalService.open(EditModalConfirmComponent);
    modalRef.componentInstance.title = `Delete`;
    modalRef.componentInstance.body = `Are you sure you want to delete?`;
    modalRef.result.then((reason?) => {
      if (_.isEqual(reason, 'delete')) {
        this.activeModal.close({ reason: 'delete', data: this.data });
      }
    }, (reason?) => {});
  }
}
