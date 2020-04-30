import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { SymbolComponent } from './symbol/symbol.component';

const routes: Routes = [
  {
    path: '',
    component: SymbolComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class StocksRoutingModule { }
