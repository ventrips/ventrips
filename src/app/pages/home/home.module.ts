import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';

import { HomeRoutingModule } from './home-routing.module';
import { SharedModule } from '../../shared/shared.module';
import { HomeComponent } from './home.component';

import { SanitizeHtmlPipe } from './../../pipes/sanitize-html/sanitize-html.pipe';
import { OrderByPipe } from './../../pipes/order-by/order-by.pipe';
import { FilterByPipe } from './../../pipes/filter-by/filter-by.pipe';
import { SearchByPipe } from './../../pipes/search-by/search-by.pipe';

@NgModule({
  declarations: [
    HomeComponent,
    SanitizeHtmlPipe,
    OrderByPipe,
    FilterByPipe,
    SearchByPipe
  ],
  imports: [
    CommonModule,
    HomeRoutingModule,
    SharedModule
  ],
  schemas: [
    CUSTOM_ELEMENTS_SCHEMA
  ]
})
export class HomeModule { }
