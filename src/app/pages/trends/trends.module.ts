import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TrendsRoutingModule } from './trends-routing.module';
import { SharedModule } from '../../shared/shared.module';
import { TrendsComponent } from './trends.component';
import { TrendingTickersComponent } from './trending-tickers/trending-tickers.component';
import { ComboChartTrendsComponent } from './combo-chart-trends/combo-chart-trends.component';
import { ChartsModule } from 'ng2-charts';
import { NewsApiComponent } from './news-api/news-api.component';
@NgModule({
  declarations: [
    TrendsComponent,
    TrendingTickersComponent,
    ComboChartTrendsComponent,
    NewsApiComponent
  ],
  imports: [
    CommonModule,
    TrendsRoutingModule,
    SharedModule,
    ChartsModule
  ],
  schemas: [
    CUSTOM_ELEMENTS_SCHEMA
  ]
})
export class TrendsModule { }
