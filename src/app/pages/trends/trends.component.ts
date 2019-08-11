import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';
import { map } from 'rxjs/internal/operators/map';
import * as _ from 'lodash';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-trends',
  templateUrl: './trends.component.html',
  styleUrls: ['./trends.component.scss']
})
export class TrendsComponent implements OnInit {
  private q = 'bitcoin';
  private data: any;

  constructor(
    private http: HttpClient,
    private toastr: ToastrService
  ) {
  }

  ngOnInit() {
    this.getTrending(this.q)
    .subscribe((response) => {
      this.data = response;
      this.toastr.success(`${this.q}`, `Search Success!`)
    }, (error) => {
      this.toastr.error(error);
    });
  }

  getTrending(q: string): Observable<any> {
    return this.http.get(`${environment.apiUrl}/trending?q=${q}`)
    .pipe(map((response: Response) => { return response }));
  };

}
