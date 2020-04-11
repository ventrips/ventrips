import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';

import { BlogRoutingModule } from './blog-routing.module';
import { SharedModule } from '../../shared/shared.module';
import { BlogComponent } from './blog.component';

import { SanitizeHtmlPipe } from './../../pipes/sanitize-html/sanitize-html.pipe';
import { FilterByPipe } from './../../pipes/filter-by/filter-by.pipe';
import { SearchByPipe } from './../../pipes/search-by/search-by.pipe';

@NgModule({
  declarations: [
    BlogComponent,
    SanitizeHtmlPipe,
    FilterByPipe,
    SearchByPipe
  ],
  imports: [
    CommonModule,
    BlogRoutingModule,
    SharedModule
  ],
  schemas: [
    CUSTOM_ELEMENTS_SCHEMA
  ]
})
export class BlogModule { }
