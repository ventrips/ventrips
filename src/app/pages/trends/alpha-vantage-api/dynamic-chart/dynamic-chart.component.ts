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
  public lineChartOptions: (ChartOptions & { annotation: any }) = { annotation: {} };
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

  isBeforeNoon(index: number): boolean {
    return moment(this.lineChartLabels[index]).isBefore(moment(this.lineChartLabels[index]).set({ "hour": 12, "minute": 0, "second": 0 }));
  }

  chartOptions(): void {
    const keys = ['volume', 'open', 'high', 'low', 'close'];
    _.forEach(keys, (key: any) => {
      let keyId = '';
      const keyData = _.get(this.data, [key]);
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
  };

  annotateOpenPrice(
    noteOpenPrices: Array<number>,
    noteOpenPrice: number
  ): void {
    this.lineChartOptions.annotation.annotations.push(
      {
        drawTime: 'afterDatasetsDraw',
        type: "line",
        mode: "horizontal",
        scaleID: "y-axis-2",
        value: noteOpenPrice,
        borderColor: "black",
        borderWidth: 5,
        label: {
          content: `${'Open'} @ ${noteOpenPrice}`,
          enabled: true,
          position: "top"
        }
      }
    );
  }

  annotateOpenPricesReached(
    noteOpenPrices: Array<number>,
    noteLowPrices: Array<number>,
    noteHighPrices: Array<number>,
    noteOpenPrice: number,
  ): void {
    _.forEach(noteOpenPrices, (price, index) => {
      if (noteOpenPrice >= noteLowPrices[index] && noteOpenPrice <= noteHighPrices[index] && index !== 0) {
        this.lineChartOptions.annotation.annotations.push(
          {
            drawTime: 'beforeDatasetsDraw',
            type: "line",
            mode: "vertical",
            scaleID: "x-axis-0",
            value: this.lineChartLabels[index],
            borderColor: "black",
            borderWidth: 1
          }
        );
      }
    });
  }

  annotatePercentagePoints(
    noteOpenPrices: Array<number>,
    noteLowPrices: Array<number>,
    noteHighPrices: Array<number>,
    noteOpenPrice: number,
    percentage: number,
    gainLoss: number,
    putsPoint: number,
    callsPoint: number
  ): void {
    const isDoNotBuyRange = _.isEqual(percentage, 0.0020);
    this.lineChartOptions.annotation.annotations.push(
      {
        drawTime: 'afterDatasetsDraw',
        type: "line",
        mode: "horizontal",
        scaleID: "y-axis-2",
        value: putsPoint,
        borderColor: isDoNotBuyRange ? 'purple' : 'black',
        borderWidth: 5,
        label: {
          content: `(${percentage * 100}%) ${isDoNotBuyRange ? `DO NOT BUY` : `PUTS @ ${putsPoint}`}`,
          enabled: true,
          position: "top"
        }
      }
    );
    this.lineChartOptions.annotation.annotations.push(
      {
        drawTime: 'afterDatasetsDraw',
        type: "line",
        mode: "horizontal",
        scaleID: "y-axis-2",
        value: callsPoint,
        borderColor: isDoNotBuyRange ? 'purple' : 'black',
        borderWidth: 5,
        label: {
          content: `(-${percentage * 100}%) ${isDoNotBuyRange ? `DO NOT BUY` : `CALLS @ ${callsPoint}`}`,
          enabled: true,
          position: "top"
        }
      }
    );
  }
  annotateBuyPoints(
    noteOpenPrices: Array<number>,
    noteLowPrices: Array<number>,
    noteHighPrices: Array<number>,
    noteOpenPrice: number,
    percentage: number,
    gainLoss: number,
    putsPoint: number,
    callsPoint: number
  ): void {
      if (percentage !== 0.0075) {
        return;
      }
      _.forEach(noteLowPrices, (price, index) => {
        if (price <= callsPoint && index !== 0 && this.isBeforeNoon(index)) {
          const buyPrice = noteLowPrices[index];
          this.lineChartOptions.annotation.annotations.push(
            {
              drawTime: 'afterDatasetsDraw',
              type: "line",
              mode: "vertical",
              scaleID: "x-axis-0",
              value: this.lineChartLabels[index],
              borderColor: "red",
              borderWidth: 5,
              label: {
                content: `${buyPrice} @ ${moment(this.lineChartLabels[index]).format('hh:mm:ss A')}`,
                enabled: true,
                position: "top"
              }
            }
          );
          return false;
        }
      });
      _.forEach(noteHighPrices, (price, index) => {
        const isBeforeNoon = moment(this.lineChartLabels[index]).isBefore(moment(this.lineChartLabels[index]).set({ "hour": 12, "minute": 0, "second": 0 }));
        if (price >= putsPoint && index !== 0 && this.isBeforeNoon(index)) {
          const buyPrice = noteHighPrices[index];
          this.lineChartOptions.annotation.annotations.push(
            {
              drawTime: 'afterDatasetsDraw',
              type: "line",
              mode: "vertical",
              scaleID: "x-axis-0",
              value: this.lineChartLabels[index],
              borderColor: "green",
              borderWidth: 5,
              label: {
                content: `${buyPrice} @ ${moment(this.lineChartLabels[index]).format('hh:mm:ss A')}`,
                enabled: true,
                position: "top"
              }
            }
          );
          return false;
        }
      });
  }

  annotatePercentages(
    noteOpenPrices: Array<number>,
    noteLowPrices: Array<number>,
    noteHighPrices: Array<number>,
    noteOpenPrice: number,
  ): void {
    const percentages = [
      0.0075
      ,0.0020
      // ,0.01
      // ,0.02
      // ,0.03
      // ,0.04
      // ,0.05
      // ,0.06
    ];
    _.forEach(percentages, (percentage) => {
      const gainLoss: number = _.round(percentage * noteOpenPrice, 2);
      const putsPoint: number = _.round(noteOpenPrice + gainLoss, 2);
      const callsPoint: number = _.round(noteOpenPrice - gainLoss, 2);
      this.annotatePercentagePoints(noteOpenPrices, noteLowPrices, noteHighPrices, noteOpenPrice, percentage, gainLoss, putsPoint, callsPoint);
      this.annotateBuyPoints(noteOpenPrices, noteLowPrices, noteHighPrices, noteOpenPrice, percentage, gainLoss, putsPoint, callsPoint);
    });
  }

  annotateChart(): void {
    const noteOpenPrices: Array<any> = _.get(this.data, ['open']);
    const noteLowPrices: Array<any> = _.get(this.data, ['low']);
    const noteHighPrices: Array<any> = _.get(this.data, ['high']);
    const noteOpenPrice: number = _.get(noteOpenPrices, [0]);

    this.annotateOpenPrice(noteOpenPrices, noteOpenPrice);
    this.annotateOpenPricesReached(noteOpenPrices, noteLowPrices, noteHighPrices, noteOpenPrice);
    this.annotatePercentages(noteOpenPrices, noteLowPrices, noteHighPrices, noteOpenPrice);
  }

  formatChart(): void {
    this.lineChartData = [];
    this.lineChartLabels = _.map(_.get(this.data, ['date']), (date) => {
      return moment(date).format('LLL');
    });
    this.chartOptions();
    this.annotateChart();
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
