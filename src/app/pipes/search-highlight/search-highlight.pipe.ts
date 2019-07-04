import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import * as _ from 'lodash';

@Pipe({
  name: 'searchHighlight'
})
export class SearchHighlightPipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) {}

  transform(originalText: any, inputText: any): any {
    // Use original text if input text is empty
    if (_.isEmpty(inputText) || _.isNil(inputText)) {
      return originalText;
    }

    // Match in a case insensitive manner
    const filteredText = new RegExp(inputText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    const matchedText = originalText.match(filteredText);

    // If there's no match, just return the origianl text
    if (!matchedText) {
      return originalText;
    }

    const replacedText = originalText.replace(filteredText, `<span class="text-shadow bg-warning p-1">${matchedText[0]}</span>`);

    return this.sanitizer.bypassSecurityTrustHtml(replacedText);
  }

}
