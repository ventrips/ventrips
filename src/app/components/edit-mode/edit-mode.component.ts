import { Component, OnInit, Input } from '@angular/core';
import { NgbModal, ModalDismissReasons } from '@ng-bootstrap/ng-bootstrap';
import { firestore } from 'firebase/app';
import { AngularFirestore } from '@angular/fire/firestore';
import { PostsService } from '../../services/firebase/posts/posts.service';
import { ToastrService } from 'ngx-toastr';
import { Post } from '../../interfaces/post';
import * as _ from 'lodash';
import { AuthService } from '../../services/firebase/auth/auth.service';
import { Router } from '@angular/router';
import { User } from '../../interfaces/user';
@Component({
  selector: 'app-edit-mode',
  templateUrl: './edit-mode.component.html',
  styleUrls: ['./edit-mode.component.scss'],
  providers: []
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
  public user: User;

  constructor(
    private modalService: NgbModal,
    private postsService: PostsService,
    private toastrService: ToastrService,
    private authService: AuthService,
    private afs: AngularFirestore,
    private router: Router
  ) {}

  ngOnInit() {
    this.authService.user$.subscribe(user => {
      this.user = user
      this.resetTempPost();
      this.modalTitle = (this.isNew) ? `Create` : `${this.tempPost.title}`;
      this.keys = _.orderBy(
        _.keys(this.tempPost),
        [(key) => _.isEqual(key, 'body')], ['asc']
      );
    });
  }

  resetTempPost() {
    this.tempPost = _.assign(new Post(), this.post);
    // Converting string dates to date type
    this.tempPost.created = _.get(this.tempPost, ['created']) || firestore.Timestamp.fromDate(new Date());
    this.tempPost.modified = firestore.Timestamp.fromDate(new Date())
    // Initializing UID & Full Name
    this.tempPost.uid = _.get(this.tempPost, ['uid']) || _.get(this.user, ['uid']);
    this.tempPost.displayName = _.get(this.tempPost, ['displayName']) ||  _.get(this.user, ['displayName']);
  }

  isDisabled(key: string) {
    if (_.get(this.user, ['roles', 'admin']) && !_.isEqual(key, 'slug')) {
      return false;
    }

    return !this.isNew && _.includes(['slug', 'created', 'modified'], key);
  }

  isValid() {
    return _.every(this.keys, (key) => {
      if (_.includes(this.inputTypes.date, key)) {
        return _.isDate((this.tempPost[key].toDate()));
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
    if (!this.authService.canEdit(this.user, _.get(this.post, ['uid']))) {
      return;
    }
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
        this.afs.collection('posts').doc(newPost.slug).set(_.assign({}, newPost))
        .then(success => {
          this.toastrService.success('New Post Created!');
        }).catch(error => {
          this.toastrService.warning('New Post Failed!');
        });
      } else {
        this.afs.collection('posts').doc(newPost.slug).update(_.assign({}, newPost)).
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
