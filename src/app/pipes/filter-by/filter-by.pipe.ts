import { Pipe, PipeTransform } from '@angular/core';
import { AuthService } from '../../services/firestore/auth/auth.service';
import { User } from '../../interfaces/user';
import * as _ from 'lodash';

@Pipe({
  name: 'filterBy'
})
export class FilterByPipe implements PipeTransform {
  constructor(private authService: AuthService) {}

  transform(items: any[], field: string, value: string, user?: User): any[] {
    if (!items) return [];
    return items.filter(item => {
      if (!_.isEmpty(user) && !_.isNil(user)) {
        if (this.authService.canEdit(user, _.get(item, ['uid']))) {
          return true;
        }
      }
      return _.isEqual(item[field], value);
    });
  }
}
