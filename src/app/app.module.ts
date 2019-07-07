import { BrowserModule, BrowserTransferStateModule } from '@angular/platform-browser';
import { TransferHttpCacheModule } from '@nguniversal/common';
import { NgModule } from '@angular/core';
import { AppRoutingModule } from './app-routing.module';
import { HttpClientModule } from '@angular/common/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule } from '@angular/forms';
import { NgbModule, NgbDateAdapter } from '@ng-bootstrap/ng-bootstrap';
import { environment } from '../environments/environment';

// Pipes
import { OrderByPipe } from './pipes/order-by/order-by.pipe';
import { SearchByPipe } from './pipes/search-by/search-by.pipe';
import { SearchHighlightPipe } from './pipes/search-highlight/search-highlight.pipe';
import { TimeAgoPipe } from './pipes/time-ago/time-ago.pipe';
import { KeysPipe } from './pipes/keys/keys.pipe';

// Directives
import { ElementScrollPercentageDirective } from './directives/element-scroll-percentage/element-scroll-percentage.directive';

// Services
import { NgbDateFirestoreAdapter } from './services/firebase/ngb-date-firestore-adapter/ngb-date-firestore-adapter.service';
import { PostsService } from '../app/services/firebase/posts/posts.service';

// Libraries
import { AngularFireModule } from '@angular/fire';
import { AngularFirestoreModule } from '@angular/fire/firestore';
import { AngularFireStorageModule } from '@angular/fire/storage';
import { AngularFireFunctionsModule } from '@angular/fire/functions';
import { AngularFireAuthModule } from '@angular/fire/auth';
import { NgxSpinnerModule } from 'ngx-spinner';
import { ToastrModule } from 'ngx-toastr';
import { QuillModule } from 'ngx-quill';

// Pages
import { AppComponent } from './app.component';
import { HomeComponent } from './pages/home/home.component';
import { ContactComponent } from './pages/contact/contact.component';
import { PrivacyComponent } from './pages/privacy/privacy.component';
import { TermsComponent } from './pages/terms/terms.component';
import { AboutComponent } from './pages/about/about.component';
import { LoginComponent } from './pages/login/login.component';

// Components
import { NavbarComponent } from './components/navbar/navbar.component';
import { FooterComponent } from './components/footer/footer.component';
import { DetailsComponent } from './pages/details/details.component';
import { ProfileComponent } from './pages/profile/profile.component';
import { StripeCheckOutComponent } from './components/stripe/stripe-check-out/stripe-check-out.component';
import { StripeElementsComponent } from './components/stripe/stripe-elements/stripe-elements.component';
import { EditModalComponent } from './components/edit-modal/edit-modal.component';
import { EditModalContentComponent } from './components/edit-modal/edit-modal-content/edit-modal-content.component';
import { EditModalConfirmComponent } from './components/edit-modal/edit-modal-confirm/edit-modal-confirm.component';

@NgModule({
  declarations: [
    OrderByPipe,
    SearchByPipe,
    SearchHighlightPipe,
    TimeAgoPipe,
    AppComponent,
    HomeComponent,
    ContactComponent,
    PrivacyComponent,
    TermsComponent,
    AboutComponent,
    LoginComponent,
    NavbarComponent,
    FooterComponent,
    DetailsComponent,
    ProfileComponent,
    ElementScrollPercentageDirective,
    StripeCheckOutComponent,
    StripeElementsComponent,
    KeysPipe,
    EditModalComponent,
    EditModalContentComponent,
    EditModalConfirmComponent
  ],
  imports: [
    BrowserModule.withServerTransition({ appId: 'ventrips' }),
    BrowserTransferStateModule,
    TransferHttpCacheModule,
    FormsModule,
    HttpClientModule,
    AppRoutingModule,
    NgxSpinnerModule,
    QuillModule,
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
    AngularFirestoreModule, // imports firebase/firestore, only needed for database features
  ],
  providers: [{ provide: NgbDateAdapter, useClass: NgbDateFirestoreAdapter }],
  entryComponents: [
    EditModalContentComponent,
    EditModalConfirmComponent
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
