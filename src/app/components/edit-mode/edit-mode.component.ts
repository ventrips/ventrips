import { Component, OnInit, Input } from '@angular/core';
import { NgbModal, ModalDismissReasons, NgbDateAdapter, NgbDateStruct, NgbDateNativeAdapter} from '@ng-bootstrap/ng-bootstrap';
import { PostsService } from '../../services/firebase/posts/posts.service';
import { Post } from '../../interfaces/post';
import * as _ from 'lodash';
@Component({
  selector: 'app-edit-mode',
  templateUrl: './edit-mode.component.html',
  styleUrls: ['./edit-mode.component.scss'],
  providers: [{ provide: NgbDateAdapter, useClass: NgbDateNativeAdapter }]
})
export class EditModeComponent implements OnInit {
  @Input() post: Post;
  @Input() isNew = false;
  public tempPost: Post;
  public _ = _;
  public keys: Array<string>;

  public modalTitle: string;
  public closeResult: string;
  public inputTypes = {
    string: ['slug', 'uid', 'topic', 'title', 'description', 'image'],
    quill: ['body'],
    date: ['created', 'modified'],
    boolean: ['published']
  };

  constructor(
    private modalService: NgbModal,
    private postsService: PostsService
  ) { }

  ngOnInit() {
    this.resetTempPost();

    this.modalTitle = (this.isNew) ? `Create` : `Update ${this.tempPost.title}`;
    this.keys = _.keys(this.tempPost);
  }

  resetTempPost() {
    this.tempPost = _.assign(new Post(), this.post);
    // Converting string dates to date type
    this.tempPost.created = !_.isDate(this.tempPost.created) ? new Date() : new Date(this.tempPost.created);
    this.tempPost.modified = !_.isDate(this.tempPost.modified) ? new Date() : new Date(this.tempPost.modified);
  }

  isValid() {
    return _.every(this.keys, (key) => {
      if (_.includes(this.inputTypes.date, this.tempPost[key]) && !_.isDate(this.tempPost[key])) {
        return false;
      }
      return !_.isNil(this.tempPost[key]);
    });
  }

  save(modal: any) {
    this.post = _.assign(this.post, this.tempPost);
    this.resetTempPost();
    modal.close();
  }

  dismiss(modal: any) {
    this.resetTempPost();
    modal.dismiss();
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
