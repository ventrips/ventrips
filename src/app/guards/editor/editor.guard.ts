import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../../services/firestore/auth/auth.service';
import { ToastrService } from 'ngx-toastr';
import { take, map, tap } from 'rxjs/operators';
import * as _ from 'lodash';

@Injectable({
  providedIn: 'root'
})
export class EditorGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private toastrService: ToastrService,
    private router: Router
  ) {}

  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean> {

    return this.authService.user$.pipe(
      take(1),
      map(user => user && _.get(user, ['roles', 'editor']) ? true : false || _.get(user, ['roles', 'admin']) ? true: false),
      tap(isEditor => {
        if (!isEditor) {
          this.toastrService.warning(`Access denied - Editors only`);
          this.router.navigate([]);
        }
      })
    );

  }
}
