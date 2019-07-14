import { Component, OnInit, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-edit-modal-confirm',
  templateUrl: './edit-modal-confirm.component.html',
  styleUrls: ['./edit-modal-confirm.component.scss']
})
export class EditModalConfirmComponent implements OnInit {
  @Input() title;
  @Input() body;

  constructor(public activeModal: NgbActiveModal) {}

  ngOnInit() {
  }


}
