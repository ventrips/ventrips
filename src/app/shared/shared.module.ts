import { NgModule, ModuleWithProviders } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdsenseModule } from 'ng2-adsense';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { QuillModule } from 'ngx-quill';
import { ShareButtonsModule } from '@ngx-share/buttons';

// Components
import { EditButtonComponent } from './../components/edit-button/edit-button.component';

// Pipes
import { TimeStampDatePipe } from '../pipes/time-stamp-date/time-stamp-date.pipe';
import { TimeAgoPipe } from '../pipes/time-ago/time-ago.pipe';
import { KeysPipe } from '../pipes/keys/keys.pipe';

@NgModule({
  declarations: [
    EditButtonComponent,
    TimeStampDatePipe,
    TimeAgoPipe,
    KeysPipe
  ],
  imports: [
    CommonModule,
    FormsModule,
    FontAwesomeModule,
    AdsenseModule.forRoot(),
    QuillModule.forRoot(),
    ShareButtonsModule
  ],
  exports: [
    CommonModule,
    FormsModule,
    FontAwesomeModule,
    AdsenseModule,
    QuillModule,
    ShareButtonsModule,
    EditButtonComponent,
    TimeStampDatePipe,
    TimeAgoPipe,
    KeysPipe
  ]
})
export class SharedModule {
  static forRoot(): ModuleWithProviders {
    return {
      ngModule: SharedModule
    }
  }
}
