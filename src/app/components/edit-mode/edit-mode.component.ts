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
  @Input() isNew = false;

  public modalTitle: string;
  public closeResult: string;

  constructor(
    private modalService: NgbModal
  ) { }

  ngOnInit() {
    this.post = _.assign(new Post(), this.post);
    this.modalTitle = (this.isNew) ? `Create` : `Update ${this.post.title}`;
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
    if (_.isEqual(reason, ModalDismissReasons.ESC)) {
      return 'by pressing ESC';
    } else if (_.isEqual(reason, ModalDismissReasons.BACKDROP_CLICK)) {
      return 'by clicking on a backdrop';
    } else {
      return  `with: ${reason}`;
    }
  }
}
