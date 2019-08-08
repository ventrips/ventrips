import { NgModule, ModuleWithProviders } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdsenseModule } from 'ng2-adsense';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

// Components
import { EditButtonComponent } from './../components/edit-button/edit-button.component';

@NgModule({
  declarations: [
    EditButtonComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    FontAwesomeModule,
    AdsenseModule.forRoot()
  ],
  exports: [
    CommonModule,
    FormsModule,
    FontAwesomeModule,
    AdsenseModule,
    EditButtonComponent
  ]
})
export class SharedModule {
  static forRoot(): ModuleWithProviders {
    return {
      ngModule: SharedModule
    }
  }
}
