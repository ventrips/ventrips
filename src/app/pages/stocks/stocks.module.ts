import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';

import { StocksRoutingModule } from './stocks-routing.module';
import { SharedModule } from '../../shared/shared.module';
import { ChartsModule } from 'ng2-charts';
import { StocksComponent } from './stocks.component';
import { SymbolComponent } from './symbol/symbol.component';
import { DynamicChartComponent } from './symbol/dynamic-chart/dynamic-chart.component';
import { StockChartAllModule, ChartAnnotationService, RangeNavigatorAllModule, ChartAllModule } from '@syncfusion/ej2-angular-charts';
@NgModule({
  declarations: [
    StocksComponent,
    SymbolComponent,
    DynamicChartComponent
  ],
  imports: [
    CommonModule,
    StocksRoutingModule,
    SharedModule,
    ChartsModule,
    StockChartAllModule, RangeNavigatorAllModule, ChartAllModule
  ],
  schemas: [
    CUSTOM_ELEMENTS_SCHEMA
  ]
})
export class StocksModule { }
