import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DetailsRoutingModule } from './details-routing.module';
import { SharedModule } from '../../shared/shared.module';
import { DetailsComponent } from './details.component';
import { RelatedPostsComponent } from '../../components/related-posts/related-posts.component';


@NgModule({
  declarations: [
    DetailsComponent,
    RelatedPostsComponent
  ],
  imports: [
    CommonModule,
    DetailsRoutingModule,
    SharedModule
  ],
  schemas: [
    CUSTOM_ELEMENTS_SCHEMA
  ]
})
export class DetailsModule { }
