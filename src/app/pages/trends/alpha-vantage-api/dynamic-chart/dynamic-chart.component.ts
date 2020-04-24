import { Component, OnInit, Input, ViewChild } from '@angular/core';
import { ChartDataSets, ChartOptions } from 'chart.js';
import { Color, BaseChartDirective, Label } from 'ng2-charts';
import * as pluginAnnotations from 'chartjs-plugin-annotation';
import * as _ from 'lodash';
import * as moment from 'moment';

@Component({
  selector: 'app-dynamic-chart',
  templateUrl: './dynamic-chart.component.html',
  styleUrls: ['./dynamic-chart.component.scss']
})
export class DynamicChartComponent implements OnInit {
  @Input() symbol;
  @Input() date;
  @Input() data;
  public _ = _;
  public lineChartData: ChartDataSets[] = [];
  public lineChartLabels: Label[] = [];
  public lineChartOptions: (ChartOptions & { annotation: any }) = { annotation: {}};
  public lineChartLegend = true;
  public lineChartType = 'line';
  public lineChartPlugins = [pluginAnnotations];

  @ViewChild(BaseChartDirective, { static: true }) chart: BaseChartDirective;

  ngOnInit() {
    this.formatChart();
  }

  ngOnChanges(changes: any): void {
    console.log(changes);
    this.formatChart();
  }

  formatChart(): void {
    const data = _.cloneDeep(this.data);
    this.lineChartLabels = _.map(_.get(data, ['date']), (date) => {
      return moment(date).format('LLL');
    });
    this.lineChartData = [];
    let timeRange: any;
    const keys = ['volume', 'open', 'high', 'low', 'close'];
    _.forEach(keys, (key: any) => {
      let keyId = '';
      const keyData = _.get(data, [key]);
      switch (key) {
          case 'open':
          case 'high':
          case 'low':
          case 'close':
              keyId = '2';
              break;
          case 'volume':
              keyId = '1';
              break;
          default:
              keyId = '0';
      }
      const axisData = {
          data: keyData,
            label: _.startCase(key),
            yAxisID: `y-axis-${keyId}`
        }
        this.lineChartData.push(axisData);
    });
    this.lineChartOptions = {
      scales: {
        // We use this empty structure as a placeholder for dynamic theming.
        xAxes: [{
          type: 'time',
          time: {
              unit: 'hour'
          }
        }],
        yAxes: [
          {
            id: 'y-axis-1',
            position: 'left',
            ticks: {
              fontColor: 'blue',
              stepSize: 10000000
            }
          },
          {
            id: 'y-axis-2',
            position: 'right',
            ticks: {
              fontColor: 'orange',
              stepSize: 10
            }
          }
        ]
      },
      annotation: {
        annotations: [
        ],
      },
    };
      // Note Open Price
      const noteOpenPrices: Array<any> = _.get(_.find(this.lineChartData, { label: 'Open'}), ['data']);
      const noteOpenPrice: number = _.get(noteOpenPrices, [0]);
      this.lineChartOptions.annotation.annotations.push(
        {
          type: "line",
          mode: "horizontal",
          scaleID: "y-axis-2",
          value: noteOpenPrice,
          borderColor: "red",
          label: {
            content: `${'Open'} @ ${noteOpenPrice}`,
            enabled: true,
            position: "top"
          }
        }
      );
      const percentage = 0.0075;
      const gainLoss: number = _.round(percentage * noteOpenPrice, 2);
      // Note .75% UP
      const putsPoint: number = noteOpenPrice + gainLoss;
      this.lineChartOptions.annotation.annotations.push(
        {
          type: "line",
          mode: "horizontal",
          scaleID: "y-axis-2",
          value: putsPoint,
          borderColor: "black",
          label: {
            content: `(${percentage * 100}%) PUTS @ ${putsPoint}`,
            enabled: true,
            position: "top"
          }
        }
      );
      // Note .75% DOWN
      const callsPoint: number = noteOpenPrice - gainLoss;
      this.lineChartOptions.annotation.annotations.push(
        {
          type: "line",
          mode: "horizontal",
          scaleID: "y-axis-2",
          value: callsPoint,
          borderColor: "black",
          label: {
            content: `(-${percentage * 100}%) CALLS @ ${callsPoint}`,
            enabled: true,
            position: "top"
          }
        }
      );

      // Note 10:00 AM Note
      // const noteDateIndex = _.findIndex(_.get(data, ['date']), (date: any) => _.includes(date, '10:00'));
      // this.lineChartOptions.annotation.annotations.push(
      //   {
      //     type: "line",
      //     mode: "vertical",
      //     scaleID: "x-axis-0",
      //     value: this.lineChartLabels[noteDateIndex],
      //     borderColor: "red",
      //     label: {
      //       content: `${this.lineChartLabels[noteDateIndex]}`,
      //       enabled: true,
      //       position: "top"
      //     }
      //   }
      // );
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

}
