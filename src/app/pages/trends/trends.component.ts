import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser, isPlatformServer } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';
import { map } from 'rxjs/internal/operators/map';
import * as _ from 'lodash';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../../services/firestore/auth/auth.service';
import { User } from '../../interfaces/user';
import { ActivatedRoute } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';

@Component({
  selector: 'app-trends',
  templateUrl: './trends.component.html',
  styleUrls: ['./trends.component.scss']
})
export class TrendsComponent implements OnInit {
  public search: string;
  public q: string;
  public data: any;
  public user: User;
  public symbols: Array<any>;
  public _ = _;

  constructor(
    private http: HttpClient,
    private toastr: ToastrService,
    private spinner: NgxSpinnerService,
    private activatedRoute: ActivatedRoute,
    public authService: AuthService,
    @Inject(PLATFORM_ID) private platformId: any
  ) {
  }

  ngOnInit() {
    this.authService.user$.subscribe(user => this.user = user);
    this.activatedRoute.queryParams.subscribe(params => {
      this.q = params.q;
      this.search = _.cloneDeep(this.q);
      this.data = undefined;

      this.symbols = undefined;
      this.spinner.show();
      this.getPredict(this.q)
      .subscribe((response) => {
        this.spinner.hide();
        this.symbols = response;
      }, (error) => {
        this.toastr.error(error);
      });

      if (_.isNil(this.q)) { return; };
      this.spinner.show();
      this.getTrends(this.q)
      .subscribe((response) => {
        this.spinner.hide();
        this.data = response;
        this.toastr.success(`${this.q}`, `Search Success!`)
      }, (error) => {
        this.toastr.error(error);
      });
    });
  }

  getTrends(q: string): Observable<any> {
    return this.http.get(`${environment.apiUrl}/trends?q=${q}`)
    .pipe(map((response: Response) => { return response }));
  };

  getPredict(q: string): Observable<any> {
    return this.http.get(`${environment.apiUrl}/predict`)
    .pipe(map((response: Response) => { return response }));
  };

  isPlatformBrowser() {
    return isPlatformBrowser(this.platformId);
  }
}
