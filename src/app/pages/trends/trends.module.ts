import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TrendsRoutingModule } from './trends-routing.module';
import { SharedModule } from '../../shared/shared.module';
import { TrendsComponent } from './trends.component';
import { TrendingTickersComponent } from './trending-tickers/trending-tickers.component';

@NgModule({
  declarations: [
    TrendsComponent,
    TrendingTickersComponent
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
