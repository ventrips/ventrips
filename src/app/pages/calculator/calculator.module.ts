import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';

import { CalculatorRoutingModule } from './calculator-routing.module';
import { SharedModule } from '../../shared/shared.module';
import { SplitBillCalculatorComponent } from './split-bill-calculator/split-bill-calculator.component';


@NgModule({
  declarations: [
    SplitBillCalculatorComponent
  ],
  imports: [
    CommonModule,
    CalculatorRoutingModule,
    SharedModule
  ],
  schemas: [
    CUSTOM_ELEMENTS_SCHEMA
  ]
})
export class CalculatorModule { }
