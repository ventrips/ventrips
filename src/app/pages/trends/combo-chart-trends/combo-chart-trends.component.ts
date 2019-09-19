import { Component, OnInit, ViewChild, Input } from '@angular/core';
import { ChartDataSets, ChartOptions } from 'chart.js';
import { Color, BaseChartDirective, Label } from 'ng2-charts';
import * as pluginAnnotations from 'chartjs-plugin-annotation';
import * as _ from 'lodash';
import * as moment from 'moment';

@Component({
  selector: 'app-combo-chart-trends',
  templateUrl: './combo-chart-trends.component.html',
  styleUrls: ['./combo-chart-trends.component.scss']
})
export class ComboChartTrendsComponent implements OnInit {
  @Input() chartTrends;
  public symbol: string;
  public lineChartData: ChartDataSets[] = [];
  public lineChartLabels: Label[] = [];
  public lineChartOptions: (ChartOptions & { annotation: any }) = {
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
          id: 'y-axis-0',
          position: 'left',
          gridLines: {
            color: 'rgba(255,0,0,0.3)',
          },
          ticks: {
            fontColor: 'red',
            max: 100,
            min: 0,
            stepSize: 25
          }
        },
        {
          id: 'y-axis-1',
          position: 'right',
          ticks: {
            fontColor: 'blue',
            stepSize: 2000000
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

  constructor() { }

  ngOnInit() {
    this.formatChart(this.chartTrends);
  }

  ngOnChanges(changes: any): void {
    console.log(changes);
    this.formatChart(this.chartTrends);
  }

  formatGoogleTrends(original: Array<any>): Array<any> {
    return _.map(_.drop(original, 1), (item) => {
      return {
        date: moment(_.get(item, ['0'])).toDate(),
        searchVolume: _.toNumber(_.get(item, ['1'])),
        type: 'googleTrends'
      }
    });
  }

  formatAlphaVantage(original: any): Array<any> {
    return _.map(_.get(original, ['Time Series (5min)']), (info, time) => {
        return {
          date: moment(time, 'YYYY-MM-DD HH:mm:ss').subtract(3, 'hours').subtract(0, 'minutes').toDate(),
          open: _.toNumber(_.get(info, ['1. open'])),
          high: _.toNumber(_.get(info, ['2. high'])),
          low: _.toNumber(_.get(info, ['3. low'])),
          close: _.toNumber(_.get(info, ['4. close'])),
          volume: _.toNumber(_.get(info, ['5. volume'])),
          type: 'alphaVantage'
        }
    });
  }

  formatValues(combinedData: Array<any>, type: string, field: string): Array<any> {
    /*
      original: [9:04]
      input: [9:00, 9:04, 9:05]
      output: [0, 100, 100]
    */
   let previous = 0;
   return _.map(combinedData, (item, index) => {
     const isType = _.isEqual(_.get(item, ['type']), type);
     if (isType) {
      const current = _.get(item, [field]);
       previous = current;
       return current;
     } else {
       return previous;
     }
   });
  }

  formatChart(data: any): void {
    this.symbol = _.get(data, ['googleTrends', '0', '1']) || _.get(data, ['alphaVantage', 'Meta Data', 'Symbol'])
    const formattedGoogleTrends = this.formatGoogleTrends(_.get(data, ['googleTrends']));
    const formattedAlphaVantage = this.formatAlphaVantage(_.get(data, ['alphaVantage']));
    const combinedData = _.orderBy(
      _.concat(formattedGoogleTrends, formattedAlphaVantage),
      [item => moment(_.get(item, ['date']))], ['asc']
    );
    const filterPastDayData = _.filter(combinedData, (item) => {
      return moment(_.get(item, ['date'])).isSameOrAfter(moment().subtract(24, 'hours'))
      // return true;
    });
    const finalLabels = _.map(filterPastDayData, (item) => {
      return moment(_.get(item, ['date'])).format('LLL');
    });

    this.lineChartData = [
      {
        data: this.formatValues(_.cloneDeep(filterPastDayData), 'googleTrends', 'searchVolume'),
        label: 'Trends',
        yAxisID: 'y-axis-0'
      },
      {
        data: this.formatValues(_.cloneDeep(filterPastDayData), 'alphaVantage', 'volume'),
        label: 'Volume',
        yAxisID: 'y-axis-1'
      },
      {
        data: this.formatValues(_.cloneDeep(filterPastDayData), 'alphaVantage', 'open'),
        label: 'Open',
        yAxisID: 'y-axis-2'
      },
      {
        data: this.formatValues(_.cloneDeep(filterPastDayData), 'alphaVantage', 'high'),
        label: 'High',
        yAxisID: 'y-axis-2'
      },
      {
        data: this.formatValues(_.cloneDeep(filterPastDayData), 'alphaVantage', 'low'),
        label: 'Low',
        yAxisID: 'y-axis-2'
      },
      {
        data: this.formatValues(_.cloneDeep(filterPastDayData), 'alphaVantage', 'close'),
        label: 'Close',
        yAxisID: 'y-axis-2'
      }
    ]
    this.lineChartLabels = finalLabels;
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

