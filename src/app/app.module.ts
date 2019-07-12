import { BrowserModule, BrowserTransferStateModule } from '@angular/platform-browser';
import { TransferHttpCacheModule } from '@nguniversal/common';
import { NgModule } from '@angular/core';
import { AppRoutingModule } from './app-routing.module';
import { HttpClientModule, HttpClientJsonpModule } from '@angular/common/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule } from '@angular/forms';
import { NgbModule, NgbDateAdapter } from '@ng-bootstrap/ng-bootstrap';
import { environment } from '../environments/environment';

// Pipes
import { SanitizeHtmlPipe } from './pipes/sanitize-html/sanitize-html.pipe';
import { OrderByPipe } from './pipes/order-by/order-by.pipe';
import { FilterByPipe } from './pipes/filter-by/filter-by.pipe';
import { SearchByPipe } from './pipes/search-by/search-by.pipe';
import { SearchHighlightPipe } from './pipes/search-highlight/search-highlight.pipe';
import { TimeStampDatePipe } from './pipes/time-stamp-date/time-stamp-date.pipe';
import { TimeAgoPipe } from './pipes/time-ago/time-ago.pipe';
import { KeysPipe } from './pipes/keys/keys.pipe';

// Directives
import { ElementScrollPercentageDirective } from './directives/element-scroll-percentage/element-scroll-percentage.directive';

// Services
import { NgbDateFirestoreAdapter } from './services/firebase/ngb-date-firestore-adapter/ngb-date-firestore-adapter.service';
import { PostsService } from '../app/services/firebase/posts/posts.service';

// Libraries
import { Angulartics2Module } from 'angulartics2';
import { Angulartics2GoogleAnalytics } from 'angulartics2/ga';
import { AngularFireModule } from '@angular/fire';
import { AngularFirestoreModule } from '@angular/fire/firestore';
import { AngularFireStorageModule } from '@angular/fire/storage';
import { AngularFireFunctionsModule } from '@angular/fire/functions';
import { AngularFireAuthModule } from '@angular/fire/auth';
import { NgxSpinnerModule } from 'ngx-spinner';
import { ToastrModule } from 'ngx-toastr';
import { QuillModule } from 'ngx-quill';
import { ShareButtonsModule } from '@ngx-share/buttons';

// Pages
import { AppComponent } from './app.component';
import { HomeComponent } from './pages/home/home.component';
import { PageComponent } from './pages/page/page.component';
import { DetailsComponent } from './pages/details/details.component';
import { ProfileComponent } from './pages/profile/profile.component';

// Components
import { NavbarComponent } from './components/navbar/navbar.component';
import { FooterComponent } from './components/footer/footer.component';
import { StripeCheckOutComponent } from './components/stripe/stripe-check-out/stripe-check-out.component';
import { StripeElementsComponent } from './components/stripe/stripe-elements/stripe-elements.component';
import { EditModalComponent } from './components/edit-modal/edit-modal.component';
import { EditModalContentComponent } from './components/edit-modal/edit-modal-content/edit-modal-content.component';
import { EditModalConfirmComponent } from './components/edit-modal/edit-modal-confirm/edit-modal-confirm.component';
import { ServiceWorkerModule } from '@angular/service-worker';
import { ContactComponent } from './pages/contact/contact.component';
import { ContactFormComponent } from './components/forms/contact-form/contact-form.component';
import { LoginModalComponent } from './components/login-modal/login-modal.component';
import { ErrorNotFoundComponent } from './components/errors/error-not-found/error-not-found.component';

@NgModule({
  declarations: [
    SanitizeHtmlPipe,
    OrderByPipe,
    FilterByPipe,
    SearchByPipe,
    SearchHighlightPipe,
    TimeStampDatePipe,
    TimeAgoPipe,
    AppComponent,
    HomeComponent,
    PageComponent,
    DetailsComponent,
    ProfileComponent,
    NavbarComponent,
    FooterComponent,
    ElementScrollPercentageDirective,
    StripeCheckOutComponent,
    StripeElementsComponent,
    KeysPipe,
    EditModalComponent,
    EditModalContentComponent,
    EditModalConfirmComponent,
    ContactComponent,
    ContactFormComponent,
    LoginModalComponent,
    ErrorNotFoundComponent
  ],
  imports: [
    BrowserModule.withServerTransition({ appId: 'ventrips' }),
    AppRoutingModule,
    Angulartics2Module.forRoot(),
    BrowserTransferStateModule,
    TransferHttpCacheModule,
    FormsModule,
    HttpClientModule,       // (Required) For share counts
    HttpClientJsonpModule,  // (Optional) Add if you want tumblr share counts
    ShareButtonsModule,
    NgxSpinnerModule,
    QuillModule.forRoot(),
    NgbModule,
    BrowserAnimationsModule, // required animations module for ngx-toastr
    ToastrModule.forRoot({
      positionClass: 'toast-bottom-left',
      preventDuplicates: true
    }),
    AngularFireModule.initializeApp(environment.firebase), // imports firebase/app needed for everything
    AngularFirestoreModule.enablePersistence(), // enables caching of firebase data
    AngularFireAuthModule, // imports firebase/auth, only needed for auth features,
    AngularFireFunctionsModule, // imports firebase/functions only needed for functions features
    AngularFireStorageModule, // imports firebase/storage only needed for storage features
    AngularFirestoreModule, ServiceWorkerModule.register('ngsw-worker.js', { enabled: environment.production }), // imports firebase/firestore, only needed for database features
  ],
  providers: [{ provide: NgbDateAdapter, useClass: NgbDateFirestoreAdapter }],
  entryComponents: [
    EditModalContentComponent,
    EditModalConfirmComponent,
    LoginModalComponent
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
