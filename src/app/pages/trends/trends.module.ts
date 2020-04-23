import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TrendsRoutingModule } from './trends-routing.module';
import { SharedModule } from '../../shared/shared.module';
import { TrendsComponent } from './trends.component';
import { TrendingTickersComponent } from './stocks/trending-tickers/trending-tickers.component';
import { ComboChartTrendsComponent } from './stocks/combo-chart-trends/combo-chart-trends.component';
import { ChartsModule } from 'ng2-charts';
import { NewsApiComponent } from './news-api/news-api.component';
import { NewsApiArticleComponent } from './news-api/news-api-article/news-api-article.component';
import { TravelComponent } from './travel/travel.component';
import { StocksComponent } from './stocks/stocks.component';
import { AlphaVantageApiComponent } from './alpha-vantage-api/alpha-vantage-api.component';
import { DynamicChartComponent } from './alpha-vantage-api/dynamic-chart/dynamic-chart.component';
@NgModule({
  declarations: [
    TrendsComponent,
    TravelComponent,
    NewsApiComponent,
    NewsApiArticleComponent,
    StocksComponent,
    TrendingTickersComponent,
    ComboChartTrendsComponent,
    AlphaVantageApiComponent,
    DynamicChartComponent
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
