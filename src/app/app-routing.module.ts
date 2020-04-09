import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

/* Guards */
import { AdminGuard } from './guards/admin/admin.guard';
import { EditorGuard } from './guards/editor/editor.guard';
import { SubscriberGuard } from './guards/subscriber/subscriber.guard';

const routes: Routes = [
  { path: '', loadChildren: () => import('./pages/home/home.module').then(mod => mod.HomeModule)},
  { path: 'blog/:slug', loadChildren: () => import('./pages/details/details.module').then(mod => mod.DetailsModule)},
  { path: 'profile/:uid', loadChildren: () => import('./pages/profile/profile.module').then(mod => mod.ProfileModule)},
  { path: 'johnson-huynh', loadChildren: () => import('./pages/profile/profile.module').then(mod => mod.ProfileModule)},
  { path: 'contact', loadChildren: () => import('./pages/contact/contact.module').then(mod => mod.ContactModule)},
  { path: 'privacy', loadChildren: () => import('./pages/page/page.module').then(mod => mod.PageModule)},
  { path: 'terms', loadChildren: () => import('./pages/page/page.module').then(mod => mod.PageModule)},
  { path: 'about', loadChildren: () => import('./pages/page/page.module').then(mod => mod.PageModule)},
  { path: 'admin', canActivate: [AdminGuard], loadChildren: () => import('./pages/admin/admin.module').then(mod => mod.AdminModule)},
  { path: 'travel', loadChildren: () => import('./pages/travel/travel.module').then(mod => mod.TravelModule)},
  { path: 'trends', canActivate: [SubscriberGuard], loadChildren: () => import('./pages/trends/trends.module').then(mod => mod.TrendsModule)},
  { path: 'calculator', loadChildren: () => import('./pages/calculator/calculator.module').then(mod => mod.CalculatorModule)},
  { path: '**', redirectTo: '', pathMatch: 'full' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
