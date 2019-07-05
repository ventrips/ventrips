import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser, isPlatformServer } from '@angular/common';
import { Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { AngularFirestore } from '@angular/fire/firestore';
import { AngularFireAuth } from '@angular/fire/auth';
import { ToastrService } from 'ngx-toastr';
import * as firebase from 'firebase/app';
import * as _ from 'lodash';
import { environment } from './../../../../environments/environment';
import { switchMap } from 'rxjs/internal/operators/switchMap';
import { User } from './../../../interfaces/user'
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  public environment = environment;
  public roles: any;
  public user: any;

  constructor(
    private router: Router,
    private afs: AngularFirestore,
    private angularFireAuth: AngularFireAuth,
    private toastrService: ToastrService,
    @Inject(PLATFORM_ID) private platformId: any,
  ) {
    if (isPlatformBrowser) {
      this.roles = this.environment.roles;
      this.angularFireAuth.authState.pipe(
        switchMap((user: User) => {
          if (user) {
            return this.afs.doc<User>(`users/${user.uid}`).valueChanges();
          } else {
            return of(null);
          }
       }))
       .subscribe((user) => {
        if (!_.isNil(user)) {
            this.user = user;
            this.toastrService.info(`Welcome, ${this.getDisplayName()}`);
          } else {
            this.user = undefined;
          }
        });
    }
  }

  public updateUserData(user: User) {
    return this.afs.doc(`users/${user.uid}`).set({
      uid: this.getUid(),
      displayName: this.getDisplayName(),
      photoURL: this.getPhotoURL(),
      email: this.getEmail()
    }, { merge: true});
  }

  signInWithGoogle() {
    return new Promise<any>((resolve, reject) => {
      const provider = new firebase.auth.GoogleAuthProvider();
      provider.addScope('profile');
      provider.addScope('email');
      this.angularFireAuth.auth
      .signInWithPopup(provider)
      .then(response => {
        const user = _.get(response, 'user');
        this.updateUserData(user);
        resolve(user);
      });
    });
  }

  signInWithFacebook() {
    return new Promise<any>((resolve, reject) => {
      const provider = new firebase.auth.FacebookAuthProvider();
      provider.addScope('public_profile');
      provider.addScope('email');
      this.angularFireAuth.auth
      .signInWithPopup(provider)
      .then(response => {
        const user = _.get(response, 'user')
        this.updateUserData(user);
        resolve(user);
      }).catch(error => {
        
      });
    });
  }

  getUser(): any {
    return this.user;
  }

  getUid(): string {
    return _.get(this.user, 'uid');
  }

  getDisplayName(): string {
    return _.get(this.user, 'displayName');
  }

  getPhotoURL(): string {
    return _.get(this.user, 'photoURL');
  }

  getEmail(): string {
    return _.get(this.user, 'email');
  }

  getRole(): string {
    return _.get(this.user, 'role');
  }

  getAdmins(): Array<string> {
    return this.roles.admins;
  }

  getContributors(): Array<string> {
    return this.roles.contributors;
  }

  isUser(): boolean {
    return !_.isNil(this.user);
  }

  isAdmin(): boolean {
    // _.includes(this.roles.admins, this.user['uid'])
    return this.isUser() && _.isEqual(this.getRole(), 'admin');
  }

  isContributor(): boolean {
    if (this.isAdmin()) {
      return true;
    }
    // _.includes(this.roles.contributors, this.user['uid'])
    return this.isUser() && _.isEqual(this.getRole(), 'contributor');

  }

  isAuthor(uid: string): boolean {
    if (this.isAdmin()) {
      return true;
    }

    return this.isContributor() && _.isEqual(this.getUid(), uid);
  }

  signOut(): void {
    this.angularFireAuth.auth.signOut().then(() => {
      this.user = undefined;
    });
  }
}
