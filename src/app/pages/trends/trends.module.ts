import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TrendsRoutingModule } from './trends-routing.module';
import { SharedModule } from '../../shared/shared.module';
import { TrendsComponent } from './trends.component';
import { TrendingTickersComponent } from './tickers/trending-tickers/trending-tickers.component';
import { ComboChartTrendsComponent } from './tickers/combo-chart-trends/combo-chart-trends.component';
import { ChartsModule } from 'ng2-charts';
import { NewsApiComponent } from './news-api/news-api.component';
import { NewsApiArticleComponent } from './news-api/news-api-article/news-api-article.component';
import { TravelComponent } from './travel/travel.component';
import { TickersComponent } from './tickers/tickers.component';
@NgModule({
  declarations: [
    TrendsComponent,
    TravelComponent,
    NewsApiComponent,
    NewsApiArticleComponent,
    TickersComponent,
    TrendingTickersComponent,
    ComboChartTrendsComponent,
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
