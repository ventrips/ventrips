import { Component, OnInit, Input } from '@angular/core';
import { NgbModal, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { AuthService } from '../../../services/firebase/auth/auth.service';
import { EditModalConfirmComponent } from '../edit-modal-confirm/edit-modal-confirm.component';
import { ToastrService } from 'ngx-toastr';
import * as _ from 'lodash';
import { AngularFireStorage, AngularFireUploadTask } from '@angular/fire/storage';
import { finalize, tap } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { AngularFirestore } from '@angular/fire/firestore';
import { InputsConfig } from '../../../interfaces/inputs-config';

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
  @Input() inputsConfig: InputsConfig;
  public _ = _;
  public keys = [];
  public user;

  public quillKey;
  public quillEditorRef;
  public task: AngularFireUploadTask;
  public percentage: Observable<number>;
  public snapshot: Observable<any>;
  public downloadURL: string;

  constructor(
    private modalService: NgbModal,
    public activeModal: NgbActiveModal,
    public authService: AuthService,
    private toastrService: ToastrService,
    private afs: AngularFirestore,
    private afStorage: AngularFireStorage
  ) {}

  ngOnInit() {
    this.authService.user$.subscribe(user => {
      this.user = user
      // this.keys = _.keys(this.data);
      this.keys = _.orderBy(
        _.concat(
          _.get(this.inputsConfig, ['string']),
          _.get(this.inputsConfig, ['url']),
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

  isValidUrl(str) {
    var pattern = new RegExp('^(https?:\\/\\/)?'+ // protocol
      '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|'+ // domain name
      '((\\d{1,3}\\.){3}\\d{1,3}))'+ // OR ip (v4) address
      '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+ // port and path
      '(\\?[;&a-z\\d%_.~+=-]*)?'+ // query string
      '(\\#[-a-z\\d_]*)?$','i'); // fragment locator
    return !!pattern.test(str);
  }

  isValid() {
    return _.every(this.keys, (key) => {
      if (_.includes(_.get(this.inputsConfig, ['url']), key)) {
        return this.isValidUrl(_.get(this.data, [key]));
      }
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


  getEditorInstance(editorInstance: any, key: string) {
    this.quillKey = key;
    this.quillEditorRef = editorInstance;
    const toolbar = editorInstance.getModule('toolbar');
    toolbar.addHandler('image', this.imageHandler);
  }

  imageHandler = (image, callback) => {
    this.selectLocalImage();
  }

  /**
   * Step1. select local image
   *
   */
  selectLocalImage(inputKey?: string) {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.click();

    // Listen upload local image and save to server
    input.onchange = () => {
      // The File object
      const file = input.files[0];

      // Client-side validation example
      if (!_.isEqual(file.type.split('/')[0], 'image')) { 
        this.toastrService.warning(`Unsupported file type: ${file.type.split('/')[0]}`, `Only images are allowed`);
        return;
      }

      if (file.size > 1000000) {
        this.toastrService.warning('Image needs to be less than 1MB', `Image size is too large`);
        return;
      }

      this.saveToServer(file, inputKey);
    };
  }

  /**
   * Step2. save to server
   *
   * @param {File} file
   */
  saveToServer(file: File, inputKey?: string) {
    // The storage path
    const path = `files/${Date.now()}_${file.name}`;

    // Reference to storage bucket
    const ref = this.afStorage.ref(path);

    // The main task
    this.task = this.afStorage.upload(path, file);

    // Progress monitoring
    this.percentage = this.task.percentageChanges();

    this.snapshot = this.task.snapshotChanges().pipe(
      tap(console.log),
      // The file's download URL
      finalize(async() =>  {
        this.downloadURL = await ref.getDownloadURL().toPromise();
        if (!_.isNil(inputKey)) {
          this.data[inputKey] = _.cloneDeep(this.downloadURL);
        } else{
          this.insertToEditor(this.downloadURL);
        }
        // this.afs.collection('files').add( { downloadURL: this.downloadURL, path });
      }),
    );
    this.snapshot.subscribe();
  }

  /**
   * Step3. insert image url to rich editor.
   *
   * @param {string} url
   */
  insertToEditor(url: string) {
    // push image url to rich editor.
    const range = this.quillEditorRef.getSelection();
    this.quillEditorRef.insertEmbed(range.index, 'image', `${url}`);
    const newValue = (this.quillEditorRef.container).querySelector('.ql-editor').innerHTML;
    this.data[this.quillKey] = _.cloneDeep(newValue);
    // Reset
    this.quillKey = undefined;
    this.quillEditorRef = undefined;
  }
}