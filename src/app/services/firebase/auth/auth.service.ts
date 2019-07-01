import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser, isPlatformServer } from '@angular/common';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AngularFirestore } from '@angular/fire/firestore';
import { AngularFireAuth } from '@angular/fire/auth';
import { ToastrService } from 'ngx-toastr';
import * as firebase from 'firebase/app';
import * as _ from 'lodash';
import { environment } from './../../../../environments/environment';
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
      this.angularFireAuth.authState.subscribe((user) => {
        if (!_.isNil(user)) {
          this.user = user;
          this.toastrService.info(`Welcome, ${this.user.displayName}`);
        } else {
          this.user = undefined;
        }
      });
    }
  }

  signInWithGoogle() {
    return new Promise<any>((resolve, reject) => {
      const provider = new firebase.auth.GoogleAuthProvider();
      provider.addScope('profile');
      provider.addScope('email');
      this.angularFireAuth.auth
      .signInWithPopup(provider)
      .then(res => {
        resolve(res);
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
      .then(res => {
        resolve(res);
      });
    });
  }

  getUser(): any {
    return this.user;
  }

  getUid(): string {
    return this.user.uid;
  }

  getDisplayName(): string {
    return this.user.displayName;
  }

  getPhotoURL(): string {
    return this.user.photoURL;
  }

  getAdmins(): Array<string> {
    return this.roles.admins;
  }

  getContributors(): Array<string> {
    return this.roles.contributors;
  }

  getAdminIds(): Observable<any[]> {
    return this.afs.collection('/admins').snapshotChanges()
    .pipe(map(actions => actions.map((obj: any) => {
        return obj.payload.doc.id;
    })));
  }

  getContributorIds(): Observable<any[]> {
    return this.afs.collection('/contributors').snapshotChanges()
    .pipe(map(actions => actions.map((obj: any) => {
        return obj.payload.doc.id;
    })));
  }

  isUser(): boolean {
    return !_.isNil(this.user);
  }

  isAdmin(): boolean {
    return this.isUser() && !_.isNil(this.roles.admins) && _.includes(this.roles.admins, this.user.uid);
  }

  isContributor(): boolean {
    if (this.isAdmin()) {
      return true;
    }

    return this.isUser() && !_.isNil(this.roles.contributors) && _.includes(this.roles.contributors, this.user.uid);
  }

  isAuthor(uid: string): boolean {
    if (this.isAdmin()) {
      return true;
    }

    return this.isContributor() && _.isEqual(this.user.uid, uid);
  }

  signOut(): void {
    this.angularFireAuth.auth.signOut().then();
  }
}
