import { Injectable, Inject, PLATFORM_ID, NgZone } from '@angular/core';
import { isPlatformBrowser, isPlatformServer } from '@angular/common';
import { Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { AngularFirestore, AngularFirestoreDocument } from '@angular/fire/firestore';
import { AngularFireAuth } from '@angular/fire/auth';
import { ToastrService } from 'ngx-toastr';
import * as firebase from 'firebase/app';
import * as _ from 'lodash';
import { switchMap } from 'rxjs/internal/operators/switchMap';
import { User } from './../../../interfaces/user'
import { firestore } from 'firebase/app';
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  public user$: Observable<any>;

  constructor(
    private router: Router,
    private afs: AngularFirestore,
    private angularFireAuth: AngularFireAuth,
    private toastrService: ToastrService,
    private ngZone: NgZone,
    @Inject(PLATFORM_ID) private platformId: any,
  ) {
    if (isPlatformBrowser) {
      //// Get auth data, then get firestore user document || null
      this.user$ = this.angularFireAuth.authState.pipe(switchMap(user => {
          if (user) {
            return this.afs.doc<User>(`users/${user.uid}`).valueChanges()
          } else {
            return of(null);
          }
        })
      )
    }
  }

  ///// Login/Signup //////
  signInWithGoogle() {
    const provider = new firebase.auth.GoogleAuthProvider();
    provider.addScope('profile');
    provider.addScope('email');
    return this.oAuthLogin(provider);
  }

  signInWithFacebook() {
    const provider = new firebase.auth.FacebookAuthProvider();
    provider.addScope('public_profile');
    provider.addScope('email');
    return this.oAuthLogin(provider);
  }

  private oAuthLogin(provider) {
    return this.angularFireAuth.auth.signInWithPopup(provider)
      .then((credential) => {
        this.updateUserData(credential.user);
        this.ngZone.run(() => {
          this.router.navigate(['']);
        });
      }).catch((error) => {
        if (_.isEqual(_.get(error, ['code']), 'auth/cancelled-popup-request')) {
          return;
        }
        this.toastrService.warning(_.get(error, ['message'], _.get(error, ['code'])));
      });
  }

  public updateUserData(user: User) {
    // Sets user data to firestore on login
    const userRef: AngularFirestoreDocument<any> = this.afs.doc(`users/${user.uid}`);
    // Sets user data to firestore on login
    const data: User = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      roles: {
        subscriber: true
      },
      lastActive: firestore.Timestamp.fromDate(new Date())
    }
    return userRef.set(data, { merge: true })
  }

  signOut(): void {
    this.angularFireAuth.auth.signOut();
  }

  ///// Role-based Authorization //////

  canRead(user: User): boolean {
    const allowed = ['admin', 'editor', 'subscriber']
    return this.checkAuthorization(user, allowed);
  }

  canEdit(user: User, postUid?: string): boolean {
    // If it is a post, check if the post's UID is the author of post or admin
    if (!_.isNil(postUid)) {
      return (_.get(user, ['roles', 'editor']) && _.isEqual(user.uid, postUid)) || _.get(user, ['roles', 'admin']);
    } else {
      const allowed = ['admin', 'editor']
      return this.checkAuthorization(user, allowed);
    }
  }

  canDelete(user: User): boolean {
    const allowed = ['admin']
    return this.checkAuthorization(user, allowed)
  }

  // determines if user has matching role
  private checkAuthorization(user: User, allowedRoles: string[]): boolean {
    // user is not authenticated
    if (!user) return false

    // user has permission
    for (const role of allowedRoles) {
      if ( user.roles[role] ) {
        return true
      }
    }

    // user has no permissions
    return false
  }
}
