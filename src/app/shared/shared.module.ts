import { NgModule, ModuleWithProviders } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AdsenseModule } from 'ng2-adsense';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { QuillModule } from 'ngx-quill';
import { ShareButtonsModule } from '@ngx-share/buttons';

// Components
import { PostComponent } from '../components/post/post.component';
import { EditButtonComponent } from './../components/edit-button/edit-button.component';
import { PaymentButtonComponent } from './../components/payment-button/payment-button.component';
import { ErrorNotFoundComponent } from './../components/errors/error-not-found/error-not-found.component';

// Pipes
import { TimeStampDatePipe } from '../pipes/time-stamp-date/time-stamp-date.pipe';
import { TimeAgoPipe } from '../pipes/time-ago/time-ago.pipe';
import { KeysPipe } from '../pipes/keys/keys.pipe';
import { SearchHighlightPipe } from '../pipes/search-highlight/search-highlight.pipe';

@NgModule({
  declarations: [
    PostComponent,
    EditButtonComponent,
    PaymentButtonComponent,
    ErrorNotFoundComponent,
    TimeStampDatePipe,
    TimeAgoPipe,
    KeysPipe,
    SearchHighlightPipe
  ],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    FontAwesomeModule,
    AdsenseModule.forRoot(),
    QuillModule.forRoot(),
    ShareButtonsModule
  ],
  exports: [
    CommonModule,
    FormsModule,
    RouterModule,
    NgbModule,
    FontAwesomeModule,
    AdsenseModule,
    QuillModule,
    ShareButtonsModule,
    PostComponent,
    EditButtonComponent,
    PaymentButtonComponent,
    ErrorNotFoundComponent,
    TimeStampDatePipe,
    TimeAgoPipe,
    KeysPipe,
    SearchHighlightPipe
  ]
})
export class SharedModule {
  static forRoot(): ModuleWithProviders {
    return {
      ngModule: SharedModule
    }
  }
}
