import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TrendsRoutingModule } from './trends-routing.module';
import { SharedModule } from '../../shared/shared.module';
import { TrendsComponent } from './trends.component';
import { TickerComponent } from './ticker/ticker.component';

@NgModule({
  declarations: [
    TrendsComponent,
    TickerComponent
  ],
  imports: [
    CommonModule,
    TrendsRoutingModule,
    SharedModule
  ],
  schemas: [
    CUSTOM_ELEMENTS_SCHEMA
  ]
})
export class TrendsModule { }
