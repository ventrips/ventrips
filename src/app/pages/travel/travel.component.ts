import { Component, OnInit, Inject, PLATFORM_ID, ViewChild, ElementRef, Renderer2, NgZone } from '@angular/core';
import { isPlatformBrowser, isPlatformServer } from '@angular/common';
import { Observable, Subject, merge } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { debounceTime, distinctUntilChanged, map, tap, startWith } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { NgxSpinnerService } from 'ngx-spinner';
import { NgbTypeaheadConfig } from '@ng-bootstrap/ng-bootstrap';
import { Post } from '../../interfaces/post';
import { AuthService } from '../../services/firestore/auth/auth.service';
import { environment } from '../../../environments/environment';
import { AngularFirestore } from '@angular/fire/firestore';
import { User } from '../../interfaces/user';
import { InputsConfig } from '../../interfaces/inputs-config';
import { SsrService } from '../../services/firestore/ssr/ssr.service';
import { ChartDataSets, ChartOptions } from 'chart.js';
import { Color, BaseChartDirective, Label } from 'ng2-charts';
import * as pluginAnnotations from 'chartjs-plugin-annotation';
import * as moment from 'moment';
import * as _ from 'lodash';

@Component({
  selector: 'app-travel',
  templateUrl: './travel.component.html',
  styleUrls: ['./travel.component.scss'],
  providers: [ NgbTypeaheadConfig ] // add NgbTypeaheadConfig to the component providers
})
export class TravelComponent implements OnInit {
  public title: string = `Real-Time Travel Dashboard Tracker`;
  public description: string = `See data, social media trends, and learn about travel news`;
  public environment = environment;
  public posts: Array<Post>;
  public isLoading = true;
  public _ = _;
  public user: User;
  public url: string;
  public collection: string = 'travel'
  public id: string = 'travelNumbers';
  public travelCharts: Array<any> = [];


  public lineChartData: ChartDataSets[] = [];
  public lineChartLabels: Label[] = [];
  public lineChartOptions: (ChartOptions & { annotation: any }) = {
    scales: {
      // We use this empty structure as a placeholder for dynamic theming.
      xAxes: [{
        type: 'time',
        time: {
            unit: 'day'
        }
      }],
      yAxes: [
        {
          id: 'y-axis-0',
          position: 'left',
          gridLines: {
            color: 'rgba(255,0,0,0.3)',
          },
          ticks: {
            fontColor: 'red',
            min: 0,
            max: 3000000,
            stepSize: 100000
          }
        },
        {
          id: 'y-axis-1',
          position: 'right',
          ticks: {
            fontColor: 'blue',
            min: 0,
            max: 3000000,
            stepSize: 100000
          }
        }
      ]
    },
    annotation: {
      annotations: [
        {
          type: 'line',
          mode: 'vertical',
          scaleID: 'x-axis-0',
          value: 'March',
          borderColor: 'orange',
          borderWidth: 2,
          label: {
            enabled: true,
            fontColor: 'orange',
            content: 'LineAnno'
          }
        },
      ],
    },
  };
  public lineChartLegend = true;
  public lineChartType = 'line';
  public lineChartPlugins = [pluginAnnotations];
  @ViewChild(BaseChartDirective, { static: true }) chart: BaseChartDirective;


  constructor(
    private afs: AngularFirestore,
    private http: HttpClient,
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private spinner: NgxSpinnerService,
    private ssrService: SsrService,
    public authService: AuthService,
    private renderer: Renderer2,
    private ngZone: NgZone,
    @Inject(PLATFORM_ID) private platformId: any
  ) {}

  ngOnInit() {
    this.activatedRoute.queryParams.subscribe(params => {
      this.url = this.router.url;
    });
    this.authService.user$.subscribe(user => this.user = user);
    this.spinner.show();
    this.ssrService.setSeo({
      title: this.title,
      description: this.description
    }, `travel`, true);
    this.ssrService.ssrFirestoreDoc(`${this.collection}/${this.id}`, `${this.collection}-${this.id}`, false)
    .subscribe(response => {
      console.log(response);
      if (_.isEmpty(response)) {
        return;
      }
      this.travelCharts = response;
      this.formatChart(_.get(response, ['results']));
      this.isLoading = false;
      this.spinner.hide();
    }, () => {
      this.isLoading = false;
      this.spinner.hide();
    });
  }

  ngOnChanges(changes: any): void {
    console.log(changes);
    this.formatChart(this.travelCharts);
  }

  formatChart(data: Array<any>): void {
    const reformattedData = _.map(data, (item) =>
      _.assign(item, {
        date: new Date(_.get(item, ['date', 'seconds']) * 1000)
      })
    );
    const sortedData = _.orderBy(data, [item => moment(_.get(item, ['date']))], ['asc']);
    this.lineChartLabels = _.map(sortedData, (item) => moment(_.get(item, ['date'])).format('l'));
    this.lineChartData = [
      { data: _.map(sortedData, (item) => _.toNumber(_.get(item, ['currentYearTravelNumbers']))), label: "Current Year Travel Numbers", yAxisID: "y-axis-0"},
      { data: _.map(sortedData, (item) => _.toNumber(_.get(item, ['previousYearTravelNumbers']))), label: "Previous Year Travel Numbers", yAxisID: "y-axis-1"},
    ];
    console.log(this.lineChartData);
    console.log(this.lineChartLabels);
  }

  // events
  public chartClicked({ event, active }: { event: MouseEvent, active: {}[] }): void {
    console.log(event, active);
  }

  public chartHovered({ event, active }: { event: MouseEvent, active: {}[] }): void {
    console.log(event, active);
  }

  public hideIndex(index: number) {
    const isHidden = this.chart.isDatasetHidden(index);
    this.chart.hideDataset(index, !isHidden);
  }

  // Fetches latest and sets to firestore DB
  getTravelNumbers(): Observable<any> {
    return this.http.get(`${environment.apiUrl}/getTravelNumbers`)
    .pipe(map((response: Response) => { return response }));
  };

  refreshTravel(): void {
    if (!this.authService.canEdit(this.user)) {
      return;
    }
    this.spinner.show();
    this.getTravelNumbers().subscribe(response => {
      this.spinner.hide();
    }, (error) => {
      this.spinner.hide();
    });
  }

  scrollToTop() {
    if (isPlatformBrowser(this.platformId)) {
      window.scrollTo(0, 0);
    }
  }

  isPlatformBrowser() {
    return isPlatformBrowser(this.platformId);
  }
}
