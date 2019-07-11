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
import { LoginComponent } from './pages/login/login.component';
import { PageComponent } from './pages/page/page.component';
import { ContactComponent } from './pages/contact/contact.component';

const routes: Routes = [
  {
    path: '',
    children: [
      { path: '', component: HomeComponent },
      { path: 'posts/:slug', component: DetailsComponent },
      { path: 'profile/:uid', component: ProfileComponent },
      { path: 'contact', component: ContactComponent },
      { path: 'privacy', component: PageComponent },
      { path: 'terms', component: PageComponent },
      { path: 'about', component: PageComponent },
      { path: 'login', component: LoginComponent }
    ]
  },
  { path: '**', redirectTo: '', pathMatch: 'full' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
