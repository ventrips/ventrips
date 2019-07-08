import { Pipe, PipeTransform } from '@angular/core';
import { Post } from '../../interfaces/post';
import * as _ from 'lodash';

@Pipe({
  name: 'searchBy'
})
export class SearchByPipe implements PipeTransform {

  transform(posts: Array<Post>, searchTerm: string): any {
    if (_.isEmpty(searchTerm)) { return posts; }
    return _.filter(posts, (post: Post) =>
      _.includes(_.toLower(post.title), _.toLower(searchTerm)) ||
      _.includes(_.toLower(post.category), _.toLower(searchTerm)) ||
      _.includes(_.toLower(post.description), _.toLower(searchTerm)) ||
      _.includes(_.toLower(post.displayName), _.toLower(searchTerm))
    );
  }

}
