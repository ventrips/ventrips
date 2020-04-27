import { Component, OnInit, Input, ViewChild } from '@angular/core';
import { ChartDataSets, ChartOptions } from 'chart.js';
import { Color, BaseChartDirective, Label } from 'ng2-charts';
import * as pluginAnnotations from 'chartjs-plugin-annotation';
import * as _ from 'lodash';
import * as moment from 'moment';
import { NumberSuffixPipe } from '../../../pipes/number-suffix/number-suffix.pipe';

@Component({
  selector: 'app-dynamic-chart',
  templateUrl: './dynamic-chart.component.html',
  styleUrls: ['./dynamic-chart.component.scss'],
  providers: [ NumberSuffixPipe ]
})
export class DynamicChartComponent implements OnInit {
  @Input() symbol;
  @Input() canEdit = false;
  @Input() date;
  @Input() data;
  public _ = _;
  public lineChartData: ChartDataSets[] = [];
  public lineChartLabels: Label[] = [];
  public lineChartColors: Color[] = [
    {
      backgroundColor: 'rgba(255, 99, 132, 0.2)',
      borderColor: 'rgba(255, 99, 132, 1)',
      borderWidth: 2
    },
    {
      backgroundColor: 'rgba(54, 162, 235, 0.2)',
      borderColor: 'rgba(54, 162, 235, 1)',
      borderWidth: 2
    },
    {
      backgroundColor: 'transparent',
      borderColor: 'rgba(255, 206, 86, 1)',
      borderWidth: 2
    },
    {
      backgroundColor: 'transparent',
      borderColor: 'rgba(75, 192, 192, 1)',
      borderWidth: 2
    },
    {
      backgroundColor: 'transparent',
      borderColor: 'rgba(153, 102, 255, 1)',
      borderWidth: 2
    },
    {
      backgroundColor: 'transparent',
      borderColor: 'rgba(255, 159, 64, 1)',
      borderWidth: 2
    }
  ];
  public lineChartOptions: (ChartOptions & { annotation: any }) = { annotation: {} };
  public lineChartLegend = true;
  public lineChartType = 'line';
  public lineChartPlugins = [pluginAnnotations];
  public open: any = {
    price: undefined,
    openToHigh: undefined,
    openToLow: undefined,
    lowToHigh: undefined
  };

  @ViewChild(BaseChartDirective, { static: true }) chart: BaseChartDirective;

  constructor(
    private numberSuffixPipe: NumberSuffixPipe
  ) {}

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
          },
          gridLines: {
            color: 'rgba(255,0,0,0.3)',
          }
        }],
        yAxes: [
          {
            id: 'y-axis-1',
            position: 'left',
            gridLines: {
              color: 'rgba(255,0,0,0.3)',
            },
            ticks: {
              fontColor: 'black',
              stepSize: 10000000,
              callback: (value) => this.numberSuffixPipe.transform(value)
            }
          },
          {
            id: 'y-axis-2',
            position: 'right',
            ticks: {
              fontColor: 'black',
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
    opens: Array<number>
  ): void {
    this.lineChartOptions.annotation.annotations.push(
      {
        drawTime: 'afterDatasetsDraw',
        type: "line",
        mode: "horizontal",
        scaleID: "y-axis-2",
        value: this.open.price,
        borderColor: "black",
        borderWidth: 5,
        label: {
          content: `${'Open'} @ ${this.open.price}`,
          enabled: true,
          position: "top"
        }
      }
    );
  }

  annotateOpenPricesReached(
    opens: Array<number>,
    lows: Array<number>,
    highs: Array<number>
  ): void {
    _.forEach(opens, (price, index) => {
      if (this.open.price >= lows[index] && this.open.price <= highs[index]) {
        this.lineChartOptions.annotation.annotations.push(
          {
            drawTime: 'beforeDatasetsDraw',
            type: "line",
            mode: "vertical",
            scaleID: "x-axis-0",
            value: this.lineChartLabels[index],
            borderColor: "black",
            borderWidth: 5
          }
        );
      }
    });
  }

  annotatePercentagePoints(
    opens: Array<number>,
    lows: Array<number>,
    highs: Array<number>,
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
        borderColor: isDoNotBuyRange ? 'purple' : 'green',
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
        borderColor: isDoNotBuyRange ? 'purple' : 'red',
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
    opens: Array<number>,
    lows: Array<number>,
    highs: Array<number>,
    percentage: number,
    gainLoss: number,
    putsPoint: number,
    callsPoint: number
  ): void {
      if (percentage !== 0.0075) {
        return;
      }
      _.forEach(lows, (price, index) => {
        if (_.isEqual(index, 0)) { return true;}
        if (price <= callsPoint && this.isBeforeNoon(index)) {
          const buyPrice = lows[index];
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
      _.forEach(highs, (price, index) => {
        if (_.isEqual(index, 0)) { return true;}
        if (price >= putsPoint && this.isBeforeNoon(index)) {
          const buyPrice = highs[index];
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
    opens: Array<number>,
    lows: Array<number>,
    highs: Array<number>
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
      const gainLoss: number = _.round(percentage * this.open.price, 2);
      const putsPoint: number = _.round(this.open.price + gainLoss, 2);
      const callsPoint: number = _.round(this.open.price - gainLoss, 2);
      this.annotatePercentagePoints(opens, lows, highs, percentage, gainLoss, putsPoint, callsPoint);
      this.annotateBuyPoints(opens, lows, highs, percentage, gainLoss, putsPoint, callsPoint);
    });
  }

  annotateChart(opens: Array<number>, lows: Array<number>, highs: Array<number>): void {
    this.annotateOpenPrice(opens);
    this.annotatePercentages(opens, lows, highs);
    this.annotateOpenPricesReached(opens, lows, highs);
  }

  formatChart(): void {
    const opens: Array<any> = _.get(this.data, ['open']);
    const lows: Array<any> = _.get(this.data, ['low']);
    const highs: Array<any> = _.get(this.data, ['high']);
    const volumes: Array<any> = _.get(this.data, ['volume']);
    this.open.price = _.get(opens, [0]);
    // TODO: Fix API for opening because it takes in overall day lows/highs
    _.set(this.data, 'low', 0);
    _.set(this.data, 'high', 0);
    _.set(this.data, 'close', 0);
    _.set(this.data, 'volume', 0);
    // this.open.low = _.get(lows, [0]);
    // this.open.high = _.get(highs, [0]);
    // this.open.openToLow = -_.round(this.open.price / this.open.low, 2);
    // this.open.openToHigh = _.round(this.open.price / this.open.high, 2);
    // this.open.lowToHigh = _.round(Math.abs(this.open.low - this.open.high), 2);
    // this.open.volume = _.get(volumes, [0]);

    this.lineChartData = [];
    this.lineChartLabels = _.map(_.get(this.data, ['date']), (date) => {
      return moment(date).format('LLL');
    });
    this.chartOptions();
    if (this.canEdit) {
      this.annotateChart(opens, lows, highs);
    }
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
