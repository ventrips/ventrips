import { Resolve, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser, isPlatformServer } from '@angular/common';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { SeoService } from '../../services/seo/seo.service';

@Injectable()
export class HomeResolve implements Resolve<Observable<any>> {
   constructor(
       @Inject(PLATFORM_ID) private platformId: any,
       private http: HttpClient,
       private seoService: SeoService
    ) { }

   resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<any> {
        if (!isPlatformBrowser(this.platformId)) {
            console.log('hey');
            return null;
        }
        return new Observable<any>(observer => {
            this.http.get(`https://reqres.in/api/users?delay=2`).toPromise()
            .then(data => {
                this.seoService.setMetaTags({
                    title: `${data['page']} About`,
                    description: `Manually putting custom description here`
                });
                observer.next(data);
                observer.complete();
            });
        });
   }
 }
