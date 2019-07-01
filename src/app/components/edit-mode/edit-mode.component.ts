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
    this.post = _.assign(new Post(), this.post);
    // Converting string dates to date type
    this.post.created = !_.isDate(this.post.created) ? new Date() : new Date(this.post.created);
    this.post.modified = !_.isDate(this.post.modified) ? new Date() : new Date(this.post.modified);

    this.modalTitle = (this.isNew) ? `Create` : `Update ${this.post.title}`;
    this.keys = _.keys(this.post);
  }

  isValid() {
    return _.every(this.keys, (key) => {
      if (_.includes(this.inputTypes.date, this.post[key]) && !_.isDate(this.post[key])) {
        return false;
      }
      return !_.isNil(this.post[key]);
    });
  }

  save() {
    // Update Post
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
