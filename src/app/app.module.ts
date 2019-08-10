import { BrowserModule, BrowserTransferStateModule } from '@angular/platform-browser';
import { TransferHttpCacheModule } from '@nguniversal/common';
import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { AppRoutingModule } from './app-routing.module';
import { HttpClientModule, HttpClientJsonpModule } from '@angular/common/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgbModule, NgbDateAdapter } from '@ng-bootstrap/ng-bootstrap';
import { environment } from '../environments/environment';

// Directives
import { ElementScrollPercentageDirective } from './directives/element-scroll-percentage/element-scroll-percentage.directive';

// Services
import { NgbDateFirestoreAdapter } from './services/firestore/ngb-date-firestore-adapter/ngb-date-firestore-adapter.service';

// Libraries
import { Angulartics2Module } from 'angulartics2';
import { Angulartics2GoogleAnalytics } from 'angulartics2/ga';
import { AngularFireModule } from '@angular/fire';
import { AngularFirestoreModule } from '@angular/fire/firestore';
import { AngularFireStorageModule } from '@angular/fire/storage';
import { AngularFireFunctionsModule } from '@angular/fire/functions';
import { AngularFireAuthModule } from '@angular/fire/auth';
import { AngularFireMessagingModule } from '@angular/fire/messaging';
import { NgxSpinnerModule } from 'ngx-spinner';
import { ToastrModule } from 'ngx-toastr';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { NgxPayPalModule } from 'ngx-paypal';

// Pages
import { AppComponent } from './app.component';

// Modals
import { NavbarComponent } from './components/navbar/navbar.component';
import { FooterComponent } from './components/footer/footer.component';
import { EmailSubscriptionComponent } from './components/email-subscription/email-subscription.component';
import { EditModalContentComponent } from './components/edit-button/edit-modal-content/edit-modal-content.component';
import { EditModalConfirmComponent } from './components/edit-button/edit-modal-confirm/edit-modal-confirm.component';
import { LoginModalComponent } from './components/modals/login-modal/login-modal.component';
import { PaymentModalComponent } from './components/payment-button/payment-modal/payment-modal.component';

import { ServiceWorkerModule } from '@angular/service-worker';

import { SharedModule } from './shared/shared.module';

@NgModule({
  declarations: [
    AppComponent,
    NavbarComponent,
    FooterComponent,
    EmailSubscriptionComponent,
    EditModalContentComponent,
    EditModalConfirmComponent,
    LoginModalComponent,
    PaymentModalComponent,
    ElementScrollPercentageDirective
  ],
  imports: [
    BrowserModule.withServerTransition({ appId: 'ventrips' }),
    AppRoutingModule,
    Angulartics2Module.forRoot(),
    BrowserTransferStateModule,
    TransferHttpCacheModule,
    HttpClientModule,       // (Required) For share counts
    HttpClientJsonpModule,  // (Optional) Add if you want tumblr share counts
    NgxSpinnerModule,
    NgxPayPalModule,
    NgbModule,
    FontAwesomeModule,
    BrowserAnimationsModule, // required animations module for ngx-toastr
    ToastrModule.forRoot({
      positionClass: 'toast-bottom-left',
      preventDuplicates: true
    }),
    SharedModule.forRoot(),
    AngularFireModule.initializeApp(environment.firebase), // imports firebase/app needed for everything
    AngularFirestoreModule.enablePersistence(), // enables caching of firebase data
    AngularFireAuthModule, // imports firebase/auth, only needed for auth features,
    AngularFireFunctionsModule, // imports firebase/functions only needed for functions features
    AngularFireStorageModule, // imports firebase/storage only needed for storage features
    AngularFirestoreModule, // imports firebase/firestore, only needed for database features
    AngularFireMessagingModule, // For firebase cloud messaging push up notification
    ServiceWorkerModule.register('ngsw-worker.js', {
      enabled: environment.production
    })
  ],
  exports: [
    FontAwesomeModule
  ],
  providers: [{ provide: NgbDateAdapter, useClass: NgbDateFirestoreAdapter }],
  entryComponents: [
    EditModalContentComponent,
    EditModalConfirmComponent,
    LoginModalComponent,
    PaymentModalComponent
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  bootstrap: [AppComponent]
})
export class AppModule { }
