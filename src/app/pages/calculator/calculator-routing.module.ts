import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { SplitBillCalculatorComponent } from './split-bill-calculator/split-bill-calculator.component';


const routes: Routes = [
  {
    path: 'split-bill-calculator',
    component: SplitBillCalculatorComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CalculatorRoutingModule { }
