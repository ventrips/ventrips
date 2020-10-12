import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { StocksComponent } from './stocks.component';
import { SymbolComponent } from './symbol/symbol.component';

const routes: Routes = [
  {
    path: '',
    component: StocksComponent
  },
  {
    path: ':symbol',
    component: SymbolComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class StocksRoutingModule { }
