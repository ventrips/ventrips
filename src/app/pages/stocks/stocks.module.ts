import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';

import { StocksRoutingModule } from './stocks-routing.module';
import { SharedModule } from '../../shared/shared.module';
import { ChartsModule } from 'ng2-charts';
import { StocksComponent } from './stocks.component';
import { DynamicChartComponent } from './dynamic-chart/dynamic-chart.component';
@NgModule({
  declarations: [
    StocksComponent,
    DynamicChartComponent
  ],
  imports: [
    CommonModule,
    StocksRoutingModule,
    SharedModule,
    ChartsModule
  ],
  schemas: [
    CUSTOM_ELEMENTS_SCHEMA
  ]
})
export class StocksModule { }
