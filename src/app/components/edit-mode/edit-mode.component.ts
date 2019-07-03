import { Component, OnInit, Input } from '@angular/core';
import { NgbModal, ModalDismissReasons, NgbDateAdapter, NgbDateStruct, NgbDateNativeAdapter} from '@ng-bootstrap/ng-bootstrap';
import { AngularFirestore } from '@angular/fire/firestore';
import { PostsService } from '../../services/firebase/posts/posts.service';
import { ToastrService } from 'ngx-toastr';
import { Post } from '../../interfaces/post';
import * as _ from 'lodash';
import { AuthService } from '../../services/firebase/auth/auth.service';
import { Router } from '@angular/router';
@Component({
  selector: 'app-edit-mode',
  templateUrl: './edit-mode.component.html',
  styleUrls: ['./edit-mode.component.scss'],
  providers: [{ provide: NgbDateAdapter, useClass: NgbDateNativeAdapter }]
})
export class EditModeComponent implements OnInit {
  @Input() post: Post;
  @Input() isNew = false;
  public tempPost: any;
  public _ = _;
  public keys: Array<string>;

  public modalTitle: string;
  public closeResult: string;
  public inputTypes = {
    string: ['slug', 'uid', 'displayName', 'topic', 'title', 'description', 'image'],
    quill: ['body'],
    date: ['created', 'modified'],
    boolean: ['publish']
  };

  constructor(
    private modalService: NgbModal,
    private postsService: PostsService,
    private toastrService: ToastrService,
    private authService: AuthService,
    private afs: AngularFirestore,
    private router: Router
  ) { }

  ngOnInit() {
    this.resetTempPost();

    this.modalTitle = (this.isNew) ? `Create` : `${this.tempPost.title}`;
    this.keys = _.orderBy(
      _.keys(this.tempPost),
      [(key) => _.isEqual(key, 'body')], ['asc']
    );
  }

  resetTempPost() {
    this.tempPost = _.assign(new Post(), this.post);
    // Converting string dates to date type
    this.tempPost.created = this.tempPost.created ? new Date(this.tempPost.created) : new Date();
    this.tempPost.modified = new Date();
    // Initializing UID & Full Name
    this.tempPost.uid = this.authService.getUid();
    this.tempPost.displayName = this.authService.getDisplayName();
  }

  isDisabled(key: string) {
    return !this.isNew && _.includes(['slug', 'created', 'modified'], key);
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

  delete(modal: any) {
    this.afs.collection('posts').doc(this.post.slug).delete().
    then(success => {
      this.toastrService.success('Delete Success!');
      modal.dismiss();
    }).catch(error => {
      this.toastrService.warning('Delete Failed!');
      modal.dismiss();
    });
  }

  open(content) {
    this.modalService.open(content,
      {
        ariaLabelledBy: 'modal-basic-title',
        windowClass: 'modal-100'
      }
    ).result.then((newPost: Post) => {
      if (this.isNew) {
        this.afs.collection('posts').doc(newPost.slug).set(JSON.parse(JSON.stringify(newPost)))
        .then(success => {
          this.toastrService.success('New Post Created!');
        }).catch(error => {
          this.toastrService.warning('New Post Failed!');
        });
      } else {
        this.afs.collection('posts').doc(newPost.slug).update(JSON.parse(JSON.stringify(newPost))).
        then(success => {
          this.toastrService.success('Post Update Success!');
        }).catch(error => {
          this.toastrService.warning('Post Update Failed!');
        });
      }
    }, (reason) => {
      this.closeResult = `Dismissed ${this.getDismissReason(reason)}`;
      this.router.navigate(['']);
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
