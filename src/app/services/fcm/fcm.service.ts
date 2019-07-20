import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser, isPlatformServer } from '@angular/common';
import { AngularFireMessaging } from '@angular/fire/messaging';
import { AngularFireFunctions } from '@angular/fire/functions';
import { tap, take } from 'rxjs/operators';

// Import firebase to fix temporary bug in AngularFire
import * as app from 'firebase/app';
import { ToastrService } from 'ngx-toastr';
import { Observable } from 'rxjs';
import * as _ from 'lodash';
import { AngularFirestore } from '@angular/fire/firestore';
import { environment } from '../../../environments/environment.prod';
import { Fcm } from '../../interfaces/fcm';

@Injectable({
  providedIn: 'root'
})
export class FcmService {
  public token;

  constructor(
    private afMessaging: AngularFireMessaging,
    private angularFireFunctions: AngularFireFunctions,
    private afs: AngularFirestore,
    private toastrService: ToastrService,
    @Inject(PLATFORM_ID) private platformId: any
  ) {
    if (isPlatformServer(this.platformId)) { return; }

    // Bind methods to fix temporary bug in AngularFire
    try {
      const _messaging = app.messaging();
      _messaging.onTokenRefresh = _messaging.onTokenRefresh.bind(_messaging);
      _messaging.onMessage = _messaging.onMessage.bind(_messaging);
    } catch(e) {}

  }

  /// METHODS GO HERE ///

  getPermission(): Observable<any>  {
    return this.afMessaging.requestToken.pipe(
      tap(token => {
        this.token = token;
      }),
      take(1)
    )
  }

  showMessages(): Observable<any> {
    return this.afMessaging.messages.pipe(
      tap(msg => {
        const notification: any = (msg as any).notification;
        this.toastrService.info(_.truncate(notification.body, {length: 80}), _.truncate(notification.title, {length: 80}));
      })
    );
  }

  subscribeToTopic(topic) {
    this.angularFireFunctions
      .httpsCallable('subscribeToTopic')({ topic, token: this.token })
      .pipe(tap(() => this.toastrService.info(`You will now receive Push Notifications`, `Subscribed to ${_.capitalize(topic)}!`)))
      .subscribe();
  }

  unsubscribeFromTopic(topic) {
    this.angularFireFunctions
      .httpsCallable('unsubscribeFromTopic')({ topic, token: this.token })
      .pipe(tap(() => this.toastrService.info(`You will no longer receive Push Notifications`,`Unsubscribed from ${_.capitalize(topic)}`)))
      .subscribe();
  }

  sendPushNotification(fcm: Fcm) {
    this.afs.collection('notifications').add(
      _.assign({}, fcm)
    ).then((success) => {
      this.toastrService.success(_.truncate(fcm.title, {length: 80}), `Your post has been notified!`);
    }).catch((error) => {
      this.toastrService.success(error, `Your post failed to notify!`);
    });
  }
}