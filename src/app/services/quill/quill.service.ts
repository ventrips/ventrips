import { Injectable } from '@angular/core';
import * as _ from 'lodash';

@Injectable({
  providedIn: 'root'
})
export class QuillService {

  constructor() { }

  // Formats to Lazy Load Images and Pass SEO
  format(body: string) {
    if (_.isNil(body) || _.isEmpty(body)) {
      return '';
    }

    let copy = _.cloneDeep(body);
    copy = copy.replace(new RegExp(`<img src=`,`g`), `<img alt="Quill Image" src="../assets/img/image-placeholder.jpg" data-src=`);
    copy = copy.replace(new RegExp(`<iframe`,`g`), `<iframe title="Quill IFrame"`);
    return copy;
  }

}
