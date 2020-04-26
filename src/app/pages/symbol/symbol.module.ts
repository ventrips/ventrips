import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SymbolRoutingModule } from './symbol-routing.module';
import { SharedModule } from '../../shared/shared.module';
import { ChartsModule } from 'ng2-charts';
import { SymbolComponent } from './symbol.component';
import { DynamicChartComponent } from './dynamic-chart/dynamic-chart.component';
@NgModule({
  declarations: [
    SymbolComponent,
    DynamicChartComponent
  ],
  imports: [
    CommonModule,
    SymbolRoutingModule,
    SharedModule,
    ChartsModule
  ],
  schemas: [
    CUSTOM_ELEMENTS_SCHEMA
  ]
})
export class SymbolModule { }
