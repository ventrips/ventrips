import { Component, OnInit, Input } from '@angular/core';
import { NgbModal, ModalDismissReasons, NgbDateAdapter, NgbDateStruct, NgbDateNativeAdapter} from '@ng-bootstrap/ng-bootstrap';
import { AngularFirestore } from '@angular/fire/firestore';
import { PostsService } from '../../services/firebase/posts/posts.service';
import { ToastrService } from 'ngx-toastr';
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
    private postsService: PostsService,
    private toastrService: ToastrService,
    private afs: AngularFirestore
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
      if (_.includes(this.inputTypes.date, key)) {
        return _.isDate(this.tempPost[key]);
      }
      if (_.includes(this.inputTypes.boolean, key)) {
        return true;
      }
      return !_.isEmpty(this.tempPost[key]);
    });
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

  save(modal: any) {
    this.post = _.assign(this.post, this.tempPost);
    if (this.isNew) {
      this.afs.collection('posts').doc(this.post.slug).set(this.post)
      .then(success => {
        this.toastrService.success('New Post Freated!');
        this.close(modal);
      }).catch(error => {
        this.toastrService.warning('New Post Failed!');
        this.close(modal);
      });
    } else {
      this.afs.collection('posts').doc(this.post.slug).update(JSON.parse(JSON.stringify(this.post))).
      then(success => {
        this.toastrService.success('Post Update Success!');
        this.close(modal);
      }).catch(error => {
        this.toastrService.warning('Post Update Failed!');
        this.close(modal);
      });
    }
  }

  delete(modal: any) {
    this.afs.collection('posts').doc(this.post.slug).delete().
    then(success => {
      this.toastrService.success('Delete Success!');
      this.close(modal);
    }).catch(error => {
      this.toastrService.warning('Delete Failed!');
    });
  }

  dismiss(modal: any) {
    this.resetTempPost();
    modal.dismiss();
  }

  close(modal: any) {
    this.resetTempPost();
    modal.close();
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
