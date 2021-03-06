import { Component, OnInit, Input, ViewChild, EventEmitter, Output } from '@angular/core';
import { ChartDataSets, ChartOptions, ChartTooltipItem } from 'chart.js';
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
  @Input() nizom;
  @Output() onNizom = new EventEmitter();

  public chartData;
  public dayTradeRuleWorks: any = {
    CALL: {},
    PUT: {}
  };
  public dayTradeLogs: any = {
    CALL: [],
    PUT: []
  };
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
  public dayTradeColors: Color[] = [
    {
      backgroundColor: 'rgba(26, 188, 156, 0.5)',
      borderColor: 'rgba(26, 188, 156, 1.0)',
      borderWidth: 5
    },
    {
      backgroundColor: 'rgba(155, 89, 182, 0.5)',
      borderColor: 'rgba(155, 89, 182, 1.0)',
      borderWidth: 5
    },
    {
      backgroundColor: 'rgba(230, 126, 34, 0.6)',
      borderColor: 'rgba(230, 126, 34, 1.0)',
      borderWidth: 5
    },
    {
      backgroundColor: 'rgba(231, 76, 60, 0.5)',
      borderColor: 'rgba(231, 76, 60,1.0)',
      borderWidth: 5
    },
    {
      backgroundColor: 'rgba(52, 152, 219, 0.5)',
      borderColor: 'rgba(52, 152, 219, 1.0)',
      borderWidth: 5
    },
    {
      backgroundColor: 'rgba(241, 196, 15, 0.5)',
      borderColor: 'rgba(241, 196, 15, 1.0)',
      borderWidth: 5
    }
  ];
  public lineChartOptions: (ChartOptions & { annotation: any }) = { annotation: {} };
  public lineChartLegend = true;
  public lineChartType = 'line';
  public lineChartPlugins = [pluginAnnotations];
  public day: any = {
    price: undefined,
    close: undefined,
    low: undefined,
    high: undefined,
    openToHigh: undefined,
    openToLow: undefined,
    lowToHigh: undefined
  };

  @ViewChild(BaseChartDirective, { static: true }) chart: BaseChartDirective;

  constructor(
    private numberSuffixPipe: NumberSuffixPipe
  ) {}

  ngOnInit() {
    this.setDay();
    this.setChartData();
    this.formatChart();
  }

  ngOnChanges(changes: any): void {
    this.formatChart();
  }

  // Simplify to access overall day's values
  setDay() {
    const findMarketOpenIndex = _.findIndex(_.get(this.data, ['date']), (date: string) => {
      const now = moment.tz(date, _.get(this.metaData, ['timeZone']));
      const dayOpen = moment.tz(this.date, _.get(this.metaData, ['timeZone'])).set({hours: 9, minutes: 30, seconds: 0});
      return now.isSameOrAfter(dayOpen);
    });

    if (findMarketOpenIndex < 0) {
      return;
    }
    this.day.open = _.round(_.get(this.data, ['open', findMarketOpenIndex]), 2);
    this.day.close = _.round(_.get(this.data, ['close', findMarketOpenIndex]), 2);
    this.day.low = _.round(_.get(this.data, ['low', findMarketOpenIndex]), 2);
    this.day.high = _.round(_.get(this.data, ['high', findMarketOpenIndex]), 2);
    this.day.openToLowPercent = _.round(((this.day.low - this.day.open) / this.day.open) * 100, 2);
    this.day.openToHighPercent = _.round(((this.day.high - this.day.open) / this.day.open) * 100, 2);
    this.day.lowToHighRange = _.round(Math.abs(this.day.low - this.day.high), 2);
    this.day.volume = _.get(this.data, ['volume', findMarketOpenIndex]);
  }

  setChartData() {
    this.chartData = _.cloneDeep(this.data);
    // If we want to enable open market prices
    // Make a copy of original data and modify the very first minute (index 0) since API gives overall values for the day instead
    // this.chartData.low[0] = this.chartData.open[0];
    // this.chartData.high[0] = this.chartData.open[0];
    // this.chartData.close[0] = this.chartData.open[0];
    // this.chartData.volume[0] = this.chartData.volume[1];
  }

  isBetweenCustomTradeTimes(index: number): boolean {
    const now = moment(this.lineChartLabels[index]);
    const dayOpen = moment.tz(now, _.get(this.metaData, ['timeZone'])).set({hours: 9, minutes: 30, seconds: 0});
    // Don't buy anything by 12pm PST because one hour before closing
    const dayClose = moment.tz(now, _.get(this.metaData, ['timeZone'])).set({hours: 15, minutes: 0, seconds: 0});
    return moment(now).isBetween(dayOpen, dayClose);
  }

  chartOptions(): void {
    const keys = ['volume', 'open', 'high', 'low', 'close'];
    _.forEach(keys, (key: any) => {
      let keyId = '';
      const keyData = _.get(this.chartData, [key]);
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
      responsive: true,
      tooltips: {
        callbacks: {
          label: (tooltipItem: any) => {
            let label = `${_.startCase(keys[tooltipItem.datasetIndex])}:`;
            label += ` ${tooltipItem.yLabel}`;
            if (!_.isEqual(keys[tooltipItem.datasetIndex], 'volume')) {
              label += ` (${_.round(((tooltipItem.yLabel - this.day.open) / this.day.open) * 100, 2)}%)`;
            }
            return label;
          }
        }
      },
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
    highs: Array<number>,
    closes: Array<number>
  ) {
    if (_.isEmpty(this.dayTradeRules) || _.isEmpty(opens) || _.isEmpty(lows) || _.isEmpty(highs) || _.isEmpty(closes)) {
      return;
    }
    this.dayTradeRuleWorks = {};
    this.dayTradeLogs = {
      CALL: [],
      PUT: []
    };
    _.forEach(this.dayTradeRules, (rule: object, index: number) => {
      const option = _.toUpper(_.get(rule, ['option']));
      if (!_.includes(['CALL', 'PUT'], option) || !_.isNumber(_.get(rule, ['buy'])) || !_.isNumber(_.get(rule, ['sell']))
        || (_.isEqual(option, 'CALL') &&  (_.get(rule, ['buy']) >= _.get(rule, ['sell'])))
        || (_.isEqual(option, 'PUT') &&  (_.get(rule, ['sell']) >= _.get(rule, ['buy'])))
      ) {
        return;
      }
      const dayTradeBuy = _.round(this.day.open + (this.day.open * (_.get(rule, ['buy']) / 100)), 2);
      const dayTradeSell = _.round(this.day.open + (this.day.open * (_.get(rule, ['sell']) / 100)), 2);
      let findDayTradeBuyIndex;
      let findDayTradeSellIndex;
      let buy;
      let sell;
      if (_.isEqual(option, 'CALL')) {
        findDayTradeBuyIndex = _.findIndex(lows, (price, index) => {
          return price <= dayTradeBuy && this.isBetweenCustomTradeTimes(index);
        });
        buy = _.round(lows[findDayTradeBuyIndex], 2);
        findDayTradeSellIndex = _.findIndex(highs, (price, index) => {
          return price >= dayTradeSell && (index > findDayTradeBuyIndex);
        });
        sell = _.round(highs[findDayTradeSellIndex], 2);
      } else if (_.isEqual(option, 'PUT')) {
        findDayTradeBuyIndex = _.findIndex(highs, (price, index) => {
          return price >= dayTradeBuy && this.isBetweenCustomTradeTimes(index);
        });
        buy = _.round(highs[findDayTradeBuyIndex], 2);
        findDayTradeSellIndex = _.findIndex(lows, (price, index) => {
          return price <= dayTradeSell && (index > findDayTradeBuyIndex);
        });
        sell = _.round(lows[findDayTradeSellIndex], 2);
      }

      const buyLog = `[${index + 1}] Buy ${option} @ ${dayTradeBuy} (${_.get(rule, ['buy'])}%)`;
      this.lineChartOptions.annotation.annotations.push(
        _.assign(
          {
            drawTime: 'afterDatasetsDraw',
            type: "line",
            mode: "horizontal",
            scaleID: "y-axis-2",
            value: dayTradeBuy,
            label: {
              content: buyLog,
              enabled: true,
              position: "top"
            }
          },
          this.dayTradeColors[index]
        )
      );

      const sellLog = `[${index + 1}] Sell ${option} @ ${dayTradeSell} (${_.get(rule, ['sell'])}%)`;
      this.dayTradeLogs[option].push(`${buyLog} | ${sellLog}`);
      this.lineChartOptions.annotation.annotations.push(
        _.assign(
            {
            drawTime: 'afterDatasetsDraw',
            type: "line",
            mode: "horizontal",
            scaleID: "y-axis-2",
            value: dayTradeSell,
            label: {
              content: sellLog,
              enabled: true,
              position: "top"
            }
          },
          this.dayTradeColors[index]
       )
      );

      // set bought point always if exists
      if (findDayTradeBuyIndex > -1) {
        const boughtLog = `[${index + 1}] Bought ${option} for ${dayTradeBuy} (${_.get(rule, ['buy'])}%) @ ${moment(this.lineChartLabels[findDayTradeBuyIndex]).format('hh:mm:ss A')}`;
        this.dayTradeLogs[option].push(boughtLog);
        this.lineChartOptions.annotation.annotations.push(
          _.assign(
            {
              drawTime: 'afterDatasetsDraw',
              type: "line",
              mode: "vertical",
              scaleID: "x-axis-0",
              value: this.lineChartLabels[findDayTradeBuyIndex],
              label: {
                content: boughtLog,
                enabled: true,
                position: 'top'
              }
            },
            this.dayTradeColors[index]
          )
        );
      }

      const buyingPower = 1000;

      // Order would have failed to fill today
      if ((findDayTradeBuyIndex > -1 && findDayTradeSellIndex == -1) && this.isBetweenCustomTradeTimes(findDayTradeSellIndex)) {
        _.set(this.dayTradeRuleWorks, [option, 'fail'], true);
        const lossShareRange = _.round(Math.abs(closes[closes.length - 1] - dayTradeBuy), 2);
        const lossSharePercentageRange = _.round(Math.abs(_.get(rule, ['buy'])) + Math.abs(dayTradeBuy / closes[closes.length - 1]), 2);
        this.dayTradeLogs[option].push(`[${index + 1}] Loss of -$${lossShareRange}/share (-${lossSharePercentageRange}%) by closing`);
        const shares = _.round(Math.floor(buyingPower / dayTradeBuy), 2);
        const totalLoss= _.round(lossShareRange * shares, 2);
        this.dayTradeLogs[option].push(`[${index + 1}] If you invested $${buyingPower}, you would have bought ${shares} shares and lost -$${totalLoss}`);
        return;
      }

      // Order succeeded
      if ((findDayTradeBuyIndex > -1 && findDayTradeSellIndex > -1) && (findDayTradeSellIndex > findDayTradeBuyIndex)) {
        const soldLog = `[${index + 1}] Sold ${option} for ${dayTradeSell} (${_.get(rule, ['sell'])}%) @ ${moment(this.lineChartLabels[findDayTradeSellIndex]).format('hh:mm:ss A')}`;
        this.dayTradeLogs[option].push(soldLog);
        this.lineChartOptions.annotation.annotations.push(
          _.assign(
            {
              drawTime: 'afterDatasetsDraw',
              type: "line",
              mode: "vertical",
              scaleID: "x-axis-0",
              value: this.lineChartLabels[findDayTradeSellIndex],
              label: {
                content: soldLog,
                enabled: true,
                position: 'bottom'
              }
            },
            this.dayTradeColors[index]
          )
        );
        this.lineChartOptions.annotation.annotations.push(
          _.assign(
            {
              drawTime: 'afterDatasetsDraw',
              type: 'box',
              xScaleID: 'x-axis-0',
              xMin:  this.lineChartLabels[findDayTradeBuyIndex],
              xMax: this.lineChartLabels[findDayTradeSellIndex],
              yScaleID: 'y-axis-2',
              yMin:  buy,
              yMax: sell
            },
            this.dayTradeColors[index]
          )
        );
        _.set(this.dayTradeRuleWorks, [option, 'success'], true);
        const profitShareRange = _.round(Math.abs(dayTradeSell - dayTradeBuy), 2);
        const profitSharePercentageRange = _.round(Math.abs(_.get(rule, ['sell']) - _.get(rule, ['buy'])), 2);
        this.dayTradeLogs[option].push(`[${index + 1}] Profit of $${profitShareRange}/share (${profitSharePercentageRange}%)`);
        const shares =_.round(Math.floor(buyingPower / dayTradeBuy), 2);
        const totalProfit = _.round(profitShareRange * shares, 2);
        this.dayTradeLogs[option].push(`[${index + 1}] If you invested $${buyingPower}, you would have bought ${shares} shares and earned $${totalProfit}`);
      }
    });

    // Hackish way to ignore any fails if there is at least one success with one of the options

    if (!_.isNil(_.get(this.dayTradeRuleWorks, ['CALL', 'success'])) && _.get(this.dayTradeRuleWorks, ['CALL', 'success'])) {
      _.set(this.dayTradeRuleWorks, ['CALL', 'fail'], undefined);
      this.onCountDayTradeRuleWorks.emit({option: 'CALL', status: 'success'});
    } else if (!_.isNil(_.get(this.dayTradeRuleWorks, ['CALL', 'fail'])) && _.get(this.dayTradeRuleWorks, ['CALL', 'fail'])) {
      this.onCountDayTradeRuleWorks.emit({option: 'CALL', status: 'fail'});
    }

    if (!_.isNil(_.get(this.dayTradeRuleWorks, ['PUT', 'success'])) && _.get(this.dayTradeRuleWorks, ['PUT', 'success'])) {
      _.set(this.dayTradeRuleWorks, ['PUT', 'fail'], undefined);
      this.onCountDayTradeRuleWorks.emit({option: 'PUT', status: 'success'});
    } else if (!_.isNil(_.get(this.dayTradeRuleWorks, ['PUT', 'fail'])) && _.get(this.dayTradeRuleWorks, ['PUT', 'fail'])) {
      this.onCountDayTradeRuleWorks.emit({option: 'PUT', status: 'fail'});
    }
  }

  annotateMarketOpenClose(): void {
    const findMarketOpenIndex = _.findIndex(this.lineChartLabels, (chart) => _.isEqual(moment(chart).format('hh:mm:ss A'), moment.tz(this.date, _.get(this.metaData, ['timeZone'])).set({hours: 9, minutes: 30, seconds: 0}).local().format('hh:mm:ss A')));
    if (findMarketOpenIndex < 0) {
      return;
    }
    // Market Open
    this.lineChartOptions.annotation.annotations.push(
      {
        drawTime: 'afterDatasetsDraw',
        type: "line",
        mode: "vertical",
        scaleID: "x-axis-0",
        value: this.lineChartLabels[findMarketOpenIndex],
        borderColor: "#ffc107",
        borderWidth: 3,
        label: {
          content: 'Open',
          enabled: true,
          position: "bottom"
        }
      }
    );
    const findMarketCloseIndex = _.findIndex(this.lineChartLabels, (chart) => _.isEqual(moment(chart).format('hh:mm:ss A'), moment.tz(this.date, _.get(this.metaData, ['timeZone'])).set({hours: 16, minutes: 0, seconds: 0}).local().format('hh:mm:ss A')));
    if (findMarketCloseIndex < 0) {
      return;
    }
    // Market Close
    this.lineChartOptions.annotation.annotations.push(
      {
        drawTime: 'afterDatasetsDraw',
        type: "line",
        mode: "vertical",
        scaleID: "x-axis-0",
        value: this.lineChartLabels[findMarketCloseIndex],
        borderColor: "#ffc107",
        borderWidth: 3,
        label: {
          content: 'Close',
          enabled: true,
          position: "bottom"
        }
      }
    );
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
        value: this.day.open,
        borderColor: "black",
        borderWidth: 2,
        label: {
          content: `${'Open'} @ ${this.day.open}`,
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
      if (this.day.open >= lows[index] && this.day.open <= highs[index]) {
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

  annotateNizom(
    opens: Array<number>,
    lows: Array<number>,
    highs: Array<number>,
    closes: Array<number>
  ) {
    // TEMP
    // if (!_.includes(this.date, '2020-05-12')) {
    //   return;
    // }

    const firstRule = _.get(this.dayTradeRules, [0]);
    let buyingPower: number = _.get(this.nizom, ['buyingPower']);
    let profit: number = _.get(this.nizom, ['profit']);
    let maxDownRiskPercent: number = 11.1 / 100; // risking 11.1% per trade
    if (_.isNil(firstRule) || _.isEmpty(lows) || _.isEmpty(highs) || _.isEmpty(this.nizom)) {
      return;
    }
    let xDownRiskPercent: number = maxDownRiskPercent; // initially 11.1%, 22.22%, 66.66%, etc...
    let xDownRiskPercentOverall: number = xDownRiskPercent; // 99.99% max risk of portfolio
    let numBuysFilled: number = 0;
    let buyPercent: number = _.get(firstRule, ['buy']) / 100;
    let sellPercent: number = _.get(firstRule, ['sell']) / 100;
    let buyPrice: number = this.day.open + (this.day.open * buyPercent);
    let sellPrice: number = this.day.open + (this.day.open * sellPercent);
    let openPrice = this.day.open;
    let averagePrice: number = 0;
    let totalShares: number = 0;
    let totalCumulativeCost: number = 0;
    let buyIndex: number = -1;
    let sellIndex: number = -1;
    buyIndex = _.findIndex(lows, (price, index) => {
      return (price <= buyPrice) && (index > buyIndex) && this.isBetweenCustomTradeTimes(index);
    });
    sellIndex = _.findIndex(highs, (price, index) => {
      return (price >= sellPrice) && (index > buyIndex) && this.isBetweenCustomTradeTimes(index);
    });

    const originalBuyingPower = _.cloneDeep(buyingPower);
    while (buyIndex !== -1) {
      const ruleBought: number = lows[buyIndex]; // for annotating the exact low point

      const nextNumBuysFilled: number = numBuysFilled + 1;

      xDownRiskPercent = xDownRiskPercent * nextNumBuysFilled;
      xDownRiskPercentOverall = xDownRiskPercentOverall + xDownRiskPercent;
      const buyingPowerToRisk: number = originalBuyingPower * xDownRiskPercent; //300, 600
      const shares: number = Math.floor(buyingPowerToRisk / buyPrice);
      const cost: number = (buyPrice * shares);

      console.log(
        `[${nextNumBuysFilled}]`,
        `Buy Price: ${_.round(buyPrice, 2)} (${_.round(buyPercent * 100, 2)}%)`,
        `| Sell Price: ${_.round(sellPrice, 2)} (${_.round(sellPercent * 100, 2)}%)`,
        `| Shares: ${_.round(shares, 2)} | Cost: ${_.round(cost, 2)}`
      );

      if (buyingPower >= cost) {
        totalShares = totalShares + shares;
        totalCumulativeCost = totalCumulativeCost + cost;
        averagePrice = (totalCumulativeCost / totalShares);
        buyingPower = originalBuyingPower - totalCumulativeCost;
        numBuysFilled = nextNumBuysFilled;
        const gainsPerShare: number = sellPrice - averagePrice;
        console.log(
          `[${nextNumBuysFilled}]`,
          `Bought @ ${_.round(buyPrice, 2)} (${_.round(buyPercent * 100, 2)}%) @ ${moment(this.lineChartLabels[buyIndex]).format('hh:mm:ss A')}`,
          '| Shares: ', _.round(shares, 2),
          '| Avg Price: ', _.round(averagePrice, 2),
          `| Gains Per Share: ${_.round(gainsPerShare, 2)}/share`,
          '| Total Shares:', _.round(totalShares, 2),
          '| Total Cumulative Cost:', _.round(totalCumulativeCost, 2),
          '| Buying Power:', _.round(buyingPower, 2)
        );
      } else {
        console.log(`You dont have enough buying power`);
        return;
      }

      // NEXT BUY PRICE

      const nextBuyPercentage: number = buyPercent - (1 / 100);
      const nextBuyPrice: number = this.day.open + (this.day.open * nextBuyPercentage);
      const nextBuyIndex: number = _.findIndex(lows, (price, index) => {
        return (price <= nextBuyPrice) && (index >= buyIndex) && this.isBetweenCustomTradeTimes(index); // it's possible for next buy percentage is on same buy index
      });

      // If sell index exists but nextBuyIndex doesnt or if sell index is less than next buy index
      if (((sellIndex !== -1) && (nextBuyIndex == -1)) || ((sellIndex !== -1) && (nextBuyIndex !== -1) && (sellIndex <= nextBuyIndex))) {
        const soldPosition: number = totalShares * sellPrice;
        buyingPower = buyingPower + soldPosition;
        averagePrice = 0;
        totalShares = 0;
        totalCumulativeCost = 0;
        const profit = buyingPower - originalBuyingPower;
        const ruleSold: number = highs[sellIndex]; // for annotating the exact high point
        console.log(
          `[${nextNumBuysFilled}]`,
          `Sold @ ${_.round(sellPrice, 2)} (${_.round(sellPercent * 100, 2)}%) @ ${moment(this.lineChartLabels[sellIndex]).format('hh:mm:ss A')}`,
          '| Profit:', _.round(profit, 2)
        );
        this.onNizom.emit({
          buyingPower,
          profit
        });

        return;
      }

      // Set to the next buy and sell index
      buyPercent = nextBuyPercentage;
      buyPrice = nextBuyPrice;
      buyIndex = nextBuyIndex;
      sellPercent = sellPercent - (1 / 100);
      sellPrice = this.day.open + (this.day.open * sellPercent);
      sellIndex = _.findIndex(highs, (price, index) => {
        return (price >= sellPrice) && (index > buyIndex);
      });
    }
  };

  annotateChart(opens: Array<number>, lows: Array<number>, highs: Array<number>, closes: Array<number>): void {
    if (this.canEdit) {
      this.annotateOpenPrice(opens);
      this.annotateMarketOpenClose();
      this.annotateOpenPricesReached(opens, lows, highs);
      this.annotateDayTradeRules(opens, lows, highs, closes);
      this.annotateNizom(opens, lows, highs, closes);
    }
  }

  formatChart(): void {
    const opens: Array<any> = _.get(this.chartData, ['open']);
    const lows: Array<any> = _.get(this.chartData, ['low']);
    const highs: Array<any> = _.get(this.chartData, ['high']);
    const volumes: Array<any> = _.get(this.chartData, ['volume']);
    const closes: Array<any> = _.get(this.chartData, ['close']);
    this.lineChartData = [];
    this.lineChartLabels = _.map(_.get(this.chartData, ['date']), (date: any) => {
      return moment.tz(date, _.get(this.metaData, ['timeZone'])).local().format('LLL');
    });
    this.chartOptions();
    this.annotateChart(opens, lows, highs, closes);
  }

  // events
  public chartClicked({ event, active }: { event: MouseEvent, active: {}[] }): void {
    // console.log(event, active);
  }

  public chartHovered({ event, active }: { event: MouseEvent, active: {}[] }): void {
    // console.log(event, active);
  }

  public hideIndex(index: number) {
    const isHidden = this.chart.isDatasetHidden(index);
    this.chart.hideDataset(index, !isHidden);
  }

}