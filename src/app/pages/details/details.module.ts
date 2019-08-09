import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DetailsRoutingModule } from './details-routing.module';
import { SharedModule } from '../../shared/shared.module';
import { DetailsComponent } from './details.component';

import { DisqusModule } from "ngx-disqus";


@NgModule({
  declarations: [
    DetailsComponent
  ],
  imports: [
    CommonModule,
    DetailsRoutingModule,
    SharedModule,
    DisqusModule.forRoot('ventrips')
  ],
  schemas: [
    CUSTOM_ELEMENTS_SCHEMA
  ]
})
export class DetailsModule { }
