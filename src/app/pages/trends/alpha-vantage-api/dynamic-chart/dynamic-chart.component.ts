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
      const noteOpenPrices: Array<any> = _.get(data, ['open']);
      const noteHighPrices: Array<any> = _.get(data, ['high']);
      const noteLowPrices: Array<any> = _.get(data, ['low']);

      const noteOpenPrice: number = _.get(noteOpenPrices, [0]);
      this.lineChartOptions.annotation.annotations.push(
        {
          type: "line",
          mode: "horizontal",
          scaleID: "y-axis-2",
          value: noteOpenPrice,
          borderColor: "black",
          borderWidth: 10,
          label: {
            content: `${'Open'} @ ${noteOpenPrice}`,
            enabled: true,
            position: "top"
          }
        }
      );
      const percentages = [
        0.0075
        ,0.01
        ,0.02
        ,0.03
        ,0.04
        ,0.05
        ,0.06
      ];
      _.forEach(percentages, (percentage) => {
          const gainLoss: number = _.round(percentage * noteOpenPrice, 2);
          const putsPoint: number = noteOpenPrice + gainLoss;
          this.lineChartOptions.annotation.annotations.push(
            {
              type: "line",
              mode: "horizontal",
              scaleID: "y-axis-2",
              value: putsPoint,
              borderColor: "black",
              borderWidth: 1,
              label: {
                content: `(${percentage * 100}%) PUTS @ ${putsPoint}`,
                enabled: true,
                position: "top"
              }
            }
          );
          const callsPoint: number = _.round(noteOpenPrice - gainLoss, 2);
          this.lineChartOptions.annotation.annotations.push(
            {
              type: "line",
              mode: "horizontal",
              scaleID: "y-axis-2",
              value: callsPoint,
              borderColor: "black",
              borderWidth: 1,
              label: {
                content: `(-${percentage * 100}%) CALLS @ ${callsPoint}`,
                enabled: true,
                position: "top"
              }
            }
          );
          // _.forEach(noteOpenPrices, (price, index) => {
          //   const wide = 0.0002;
          //   const upper = noteOpenPrice + (noteOpenPrice * wide);
          //   const lower = noteOpenPrice - (noteOpenPrice * wide);
          //   if (price >= lower && price <= upper) {
          //     this.lineChartOptions.annotation.annotations.push(
          //       {
          //         type: "line",
          //         mode: "vertical",
          //         scaleID: "x-axis-0",
          //         value: this.lineChartLabels[index],
          //         borderColor: "blue",
          //         borderWidth: 10
          //       }
          //     );
          //   }
          // });
          // Note BUY
          if (percentage !== 0.0075) {
            return;
          }
          _.forEach(noteLowPrices, (price, index) => {
            if (price <= callsPoint) {
              const buyPrice = noteLowPrices[index];
              this.lineChartOptions.annotation.annotations.push(
                {
                  type: "line",
                  mode: "vertical",
                  scaleID: "x-axis-0",
                  value: this.lineChartLabels[index],
                  borderColor: "red",
                  borderWidth: 10
                }
              );
              if (index !== 0) {
                return false;
              }
            }
          });
          _.forEach(noteHighPrices, (price, index) => {
            if (price >= putsPoint) {
              const buyPrice = noteHighPrices[index];
              this.lineChartOptions.annotation.annotations.push(
                {
                  type: "line",
                  mode: "vertical",
                  scaleID: "x-axis-0",
                  value: this.lineChartLabels[index],
                  borderColor: "green",
                  borderWidth: 10
                }
              );
              if (index !== 0) {
                return false;
              }
            }
          });
      });

      // Note 09:50 AM Note
      // const noteDateIndex = _.findIndex(_.get(data, ['date']), (date: any) => _.includes(date, '12:00'));
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
