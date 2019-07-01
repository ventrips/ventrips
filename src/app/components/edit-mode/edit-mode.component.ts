import { Component, OnInit, Input } from '@angular/core';
import { NgbModal, ModalDismissReasons } from '@ng-bootstrap/ng-bootstrap';
import { Post } from '../../interfaces/post';
import * as _ from 'lodash';
@Component({
  selector: 'app-edit-mode',
  templateUrl: './edit-mode.component.html',
  styleUrls: ['./edit-mode.component.scss']
})
export class EditModeComponent implements OnInit {
  @Input() post: Post;
  @Input() new = false;

  public closeResult: string;

  constructor(
    private modalService: NgbModal
  ) { }

  ngOnInit() {
    this.post = _.assign(new Post(), this.post);
  }

  open(content) {
    this.modalService.open(content,
      {
        ariaLabelledBy: 'modal-basic-title',
        windowClass: 'modal-100'
      }
    ).result.then((result) => {
      this.closeResult = `Closed with: ${result}`;
    }, (reason) => {
      this.closeResult = `Dismissed ${this.getDismissReason(reason)}`;
    });
  }

  private getDismissReason(reason: any): string {
    if (reason === ModalDismissReasons.ESC) {
      return 'by pressing ESC';
    } else if (reason === ModalDismissReasons.BACKDROP_CLICK) {
      return 'by clicking on a backdrop';
    } else {
      return  `with: ${reason}`;
    }
  }
}
