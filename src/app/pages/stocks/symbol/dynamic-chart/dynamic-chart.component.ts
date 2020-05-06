import { Component, OnInit, Input, ViewChild, EventEmitter, Output } from '@angular/core';
import { ChartDataSets, ChartOptions } from 'chart.js';
import { Color, BaseChartDirective, Label } from 'ng2-charts';
import * as pluginAnnotations from 'chartjs-plugin-annotation';
import * as _ from 'lodash';
import * as moment from 'moment-timezone';
import { NumberSuffixPipe } from '../../../../pipes/number-suffix/number-suffix.pipe';

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
  @Input() metaData;
  @Input() yahooFinance;
  @Input() dayTradeRules;
  @Output() onCountDayTradeRuleWorks = new EventEmitter();
  public dayTradeRuleWorks: any = {
    CALL: {},
    PUT: {}
  };
  public dayTradeLogs: Array<string> = [];
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

  isBetweenCustomTradeTimes(index: number): boolean {
    const now = moment(this.lineChartLabels[index]);
    const dayOpen = moment.tz(this.date, _.get(this.metaData, ['timeZone'])).set({hours: 9, minutes: 30, seconds: 0}).local();
    const dayClose = moment.tz(this.date, _.get(this.metaData, ['timeZone'])).set({hours: 16, minutes: 0, seconds: 0}).local();
    return moment(now).isBetween(
      moment(dayOpen),
      moment(dayClose)
    );
  }

  lastRefreshedIsBeforeClose(): boolean {
    const format = 'YYYY-MM-DD HH:mm:ss';
    const lastRefreshedTimeZone = moment.tz(_.get(this.metaData, ['lastRefreshed']), _.get(this.metaData, ['timeZone'])).format(format);
    return moment(lastRefreshedTimeZone).isBefore((moment().set({h:16, m:0, s:0})).format(format));
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
            color: 'rgba(0,0,0,0.3)',
          }
        }],
        yAxes: [
          {
            id: 'y-axis-1',
            position: 'left',
            gridLines: {
              color: 'rgba(0,0,0,0)',
            },
            ticks: {
              fontColor: 'black',
              stepSize: 1000000,
              callback: (value) => this.numberSuffixPipe.transform(value)
            }
          },
          {
            id: 'y-axis-2',
            position: 'right',
            gridLines: {
              color: 'rgba(0,0,0,0.3)',
            },
            ticks: {
              fontColor: 'black',
              stepSize: 1
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

  annotateDayTradeRules(
    opens: Array<number>,
    lows: Array<number>,
    highs: Array<number>
  ) {
    // 8:00AM
    // this.lineChartOptions.annotation.annotations.push(
    //   {
    //     drawTime: 'afterDatasetsDraw',
    //     type: "line",
    //     mode: "vertical",
    //     scaleID: "x-axis-0",
    //     value: this.lineChartLabels[_.findIndex(this.lineChartLabels, (chart) => _.isEqual(moment(chart).format('hh:mm:ss A'), moment().set({hours: 8, minutes: 0, seconds: 0}).format('hh:mm:ss A')))],
    //     borderColor: "purple",
    //     borderWidth: 10,
    //     label: {
    //       content: '8:00AM',
    //       enabled: true,
    //       position: "bottom"
    //     }
    //   }
    // );
    this.dayTradeRuleWorks = {};
    this.dayTradeLogs = [];
    this.dayTradeLogs.push(`Open Price @ ${this.open.price}`);
    _.forEach(this.dayTradeRules, (rule: object) => {
      const option = _.toUpper(_.get(rule, ['option']));
      if (!_.includes(['CALL', 'PUT'], option) || !_.isNumber(_.get(rule, ['buy'])) || !_.isNumber(_.get(rule, ['sell']))
        || (_.isEqual(option, 'CALL') &&  (_.get(rule, ['buy']) >= _.get(rule, ['sell'])))
        || (_.isEqual(option, 'PUT') &&  (_.get(rule, ['sell']) >= _.get(rule, ['buy'])))
      ) {
        return;
      }
      const dayTradeBuy = _.round(this.open.price + (this.open.price * (_.get(rule, ['buy']) / 100)), 2);
      const dayTradeSell = _.round(this.open.price + (this.open.price * (_.get(rule, ['sell']) / 100)), 2);
      let findDayTradeBuyIndex;
      let findDayTradeSellIndex;
      let buy;
      let sell;
      if (_.isEqual(option, 'CALL')) {
        findDayTradeBuyIndex = _.findIndex(lows, (price, index) => {
          return price <= dayTradeBuy && this.isBetweenCustomTradeTimes(index);;
        });
        buy = _.round(lows[findDayTradeBuyIndex], 2);
        findDayTradeSellIndex = _.findIndex(highs, (price, index) => {
          return price >= dayTradeSell && (index > findDayTradeBuyIndex) && this.isBetweenCustomTradeTimes(index);;
        });
        sell = _.round(highs[findDayTradeSellIndex], 2);
      } else if (_.isEqual(option, 'PUT')) {
        findDayTradeBuyIndex = _.findIndex(highs, (price, index) => {
          return price >= dayTradeBuy && this.isBetweenCustomTradeTimes(index);
        });
        buy = _.round(highs[findDayTradeBuyIndex], 2);
        findDayTradeSellIndex = _.findIndex(lows, (price, index) => {
          return price <= dayTradeSell && (index > findDayTradeBuyIndex) && this.isBetweenCustomTradeTimes(index);;
        });
        sell = _.round(lows[findDayTradeSellIndex], 2);
      }

      const buyLog = `Buy ${option} @ ${dayTradeBuy} (${_.get(rule, ['buy'])}%)`;
      this.dayTradeLogs.push(buyLog);

      this.lineChartOptions.annotation.annotations.push(
        {
          drawTime: 'afterDatasetsDraw',
          type: "line",
          mode: "horizontal",
          scaleID: "y-axis-2",
          value: dayTradeBuy,
          borderColor: 'green',
          borderWidth: 5,
          label: {
            content: buyLog,
            enabled: true,
            position: "top"
          }
        }
      );

      const sellLog = `Sell ${option} @ ${dayTradeSell} (${_.get(rule, ['sell'])}%)`;
      this.dayTradeLogs.push(sellLog);
      this.lineChartOptions.annotation.annotations.push(
        {
          drawTime: 'afterDatasetsDraw',
          type: "line",
          mode: "horizontal",
          scaleID: "y-axis-2",
          value: dayTradeSell,
          borderColor: 'red',
          borderWidth: 5,
          label: {
            content: sellLog,
            enabled: true,
            position: "top"
          }
        }
      );

      // set bought point always if exists
      if (findDayTradeBuyIndex > -1) {
        const boughtLog = `[${moment(this.lineChartLabels[findDayTradeBuyIndex]).format('hh:mm:ss A')}] Bought ${option} @ ${buy} (${_.get(rule, ['buy'])}%)`;
        this.dayTradeLogs.push(boughtLog);
        this.lineChartOptions.annotation.annotations.push(
          {
            drawTime: 'afterDatasetsDraw',
            type: "line",
            mode: "vertical",
            scaleID: "x-axis-0",
            value: this.lineChartLabels[findDayTradeBuyIndex],
            borderColor: "green",
            borderWidth: 5,
            label: {
              content: boughtLog,
              enabled: true,
              position: "top"
            }
          }
        );
      }

      // Order would have failed to fill today
      if ((findDayTradeBuyIndex > -1 && findDayTradeSellIndex == -1) && !this.lastRefreshedIsBeforeClose()) {
        _.set(this.dayTradeRuleWorks, [option, 'fail'], true);
        this.onCountDayTradeRuleWorks.emit({option, status: 'fail'});
        this.dayTradeLogs.push(`Day Trade Rule Failed!`);
        return;
      }

      // Order succeeded
      if ((findDayTradeBuyIndex > -1 && findDayTradeSellIndex > -1) && (findDayTradeSellIndex > findDayTradeBuyIndex)) {
        const soldLog = `[${moment(this.lineChartLabels[findDayTradeSellIndex]).format('hh:mm:ss A')}] Sold ${option} @ ${sell} (${_.get(rule, ['sell'])}%)`;
        this.dayTradeLogs.push(soldLog);
        this.lineChartOptions.annotation.annotations.push(
          {
            drawTime: 'afterDatasetsDraw',
            type: "line",
            mode: "vertical",
            scaleID: "x-axis-0",
            value: this.lineChartLabels[findDayTradeSellIndex],
            borderColor: "red",
            borderWidth: 5,
            label: {
              content: soldLog,
              enabled: true,
              position: "bottom"
            }
          }
        );
        _.set(this.dayTradeRuleWorks, [option, 'success'], true);
        this.onCountDayTradeRuleWorks.emit({option, status: 'success'});
        this.dayTradeLogs.push(`Day Trade Rule Succeeded!`);
      }
    });
  }

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
        borderWidth: 2,
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
            borderWidth: 2
          }
        );
      }
    });
  }

  annotateChart(opens: Array<number>, lows: Array<number>, highs: Array<number>): void {
    this.annotateOpenPrice(opens);
    if (this.canEdit) {
      this.annotateOpenPricesReached(opens, lows, highs);
      this.annotateDayTradeRules(opens, lows, highs);
    }
  }

  formatChart(): void {
    const opens: Array<any> = _.get(this.data, ['open']);
    const lows: Array<any> = _.get(this.data, ['low']);
    const highs: Array<any> = _.get(this.data, ['high']);
    const volumes: Array<any> = _.get(this.data, ['volume']);
    this.open.price = _.get(opens, [0]);
    // TODO: Fix API for opening because it takes in overall day lows/highs
    this.data.low[0] = this.data.open[0];
    this.data.high[0] = this.data.open[0];
    this.data.close[0] = this.data.open[0];
    this.data.volume[0] = this.data.volume[1];
    // this.open.low = _.get(lows, [0]);
    // this.open.high = _.get(highs, [0]);
    // this.open.openToLow = -_.round(this.open.price / this.open.low, 2);
    // this.open.openToHigh = _.round(this.open.price / this.open.high, 2);
    // this.open.lowToHigh = _.round(Math.abs(this.open.low - this.open.high), 2);
    // this.open.volume = _.get(volumes, [0]);

    this.lineChartData = [];
    this.lineChartLabels = _.map(_.get(this.data, ['date']), (date: any) => {
      return moment.tz(date, _.get(this.metaData, ['timeZone'])).local().format('LLL');
    });
    this.chartOptions();
    this.annotateChart(opens, lows, highs);
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
