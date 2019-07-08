import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../../services/firebase/auth/auth.service';
import { ToastrService } from 'ngx-toastr';
import { take, map, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class SubscriberGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private toastrService: ToastrService
  ) {}

  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean> {

    return this.authService.user$.pipe(
      take(1),
      map(user => user && user.roles.subscriber ? true : false || user.roles.editor ? true : false || user.roles.admin ? true: false),
      tap(isSubscriber => {
        if (!isSubscriber) {
          this.toastrService.warning(`Access denied - Subscribers only`);

        }
      })
    );

  }  
}
