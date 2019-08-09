import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

/* Guards */
import { AdminGuard } from './guards/admin/admin.guard';
import { EditorGuard } from './guards/editor/editor.guard';
import { SubscriberGuard } from './guards/subscriber/subscriber.guard';

/* Pages */
import { HomeComponent } from './pages/home/home.component';
import { DetailsComponent } from './pages/details/details.component';
import { ProfileComponent } from './pages/profile/profile.component';
import { PageComponent } from './pages/page/page.component';
import { AdminComponent } from './pages/admin/admin.component';

const routes: Routes = [
  {
    path: '',
    children: [
      { path: '', component: HomeComponent },
      { path: 'blog/:slug', component: DetailsComponent },
      { path: 'profile/:uid', component: ProfileComponent },
      { path: 'johnson-huynh', component: ProfileComponent },
      { path: 'contact', loadChildren: () => import('./pages/contact/contact.module').then(mod => mod.ContactModule)},
      { path: 'privacy', component: PageComponent },
      { path: 'terms', component: PageComponent },
      { path: 'about', component: PageComponent },
      { path: 'admin', component: AdminComponent, canActivate: [ AdminGuard ] }
    ]
  },
  { path: '**', redirectTo: '', pathMatch: 'full' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
