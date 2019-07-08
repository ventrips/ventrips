import {formatDate} from '@angular/common';
import {Inject, LOCALE_ID, Pipe, PipeTransform} from '@angular/core';
import {firestore} from 'firebase/app';

@Pipe({
    name: 'timeStampDate'
})
export class TimeStampDatePipe implements PipeTransform {

    constructor(@Inject(LOCALE_ID) private locale: string) {}

    transform(timeStamp: firestore.Timestamp, format?: string): string {
      try {
        return formatDate(timeStamp.toDate(), format || 'longDate', this.locale);
      } catch(e) {
        return '';
      }
    }
}