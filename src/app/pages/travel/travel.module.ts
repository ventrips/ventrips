import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TravelRoutingModule } from './travel-routing.module';
import { SharedModule } from '../../shared/shared.module';
import { TravelComponent } from './travel.component';

@NgModule({
  declarations: [
    TravelComponent
  ],
  imports: [
    CommonModule,
    TravelRoutingModule,
    SharedModule
  ],
  schemas: [
    CUSTOM_ELEMENTS_SCHEMA
  ]
})
export class TravelModule { }
