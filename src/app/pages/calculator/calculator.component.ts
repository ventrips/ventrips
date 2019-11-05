import { Component, OnInit, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser, isPlatformServer } from '@angular/common';
import { ToastrService } from 'ngx-toastr';
import { SsrService } from '../../services/firestore/ssr/ssr.service';
import * as _ from 'lodash';

@Component({
  selector: 'app-calculator',
  templateUrl: './calculator.component.html',
  styleUrls: ['./calculator.component.scss']
})
export class CalculatorComponent implements OnInit {
  public _ = _;
  public defaultTax = 10;
  public defaultGratuity = 0;
  public defaultForm: any = {
    persons: [
      {
        items: [
          {
            tax: _.cloneDeep(this.defaultTax),
            gratuity: _.cloneDeep(this.defaultGratuity)
          }
        ]
      }
    ]
  };
  public form: any = {
    persons: [
      {
        name: `Solinda`,
        items: [
          {
            name: `SOONTOFU MUSHROOM LESS SPICY`,
            price: 11.95,
            tax: 10,
            gratuity: 18,
            includeTax: true
          }
        ]
      },
      {
        name: `Kimhong & Talia`,
        items: [
          {
            name: `Spicy Pork Ramen`,
            price: 12.95,
            tax: 10,
            gratuity: 18,
            includeTax: true
          },
          {
            name: `Chicken Katsu Curry`,
            price: 12.95,
            tax: 10,
            gratuity: 18,
            includeTax: true
          }
        ]
      },
      {
        name: `Johnson`,
        items: [
          {
            name: `Chicken & Beef`,
            price: 13.95,
            tax: 10,
            gratuity: 18
          }
        ]
      },
      {
        name: `Shullina`,
        items: [
          {
            name: `Chicken Katsu Curry`,
            price: 12.95,
            tax: 10,
            gratuity: 18
          }
        ]
      },
      {
        name: `Kevin`,
        items: [
          {
            name: `Chicken Katsu Curry`,
            price: 12.95,
            tax: 10,
            gratuity: 18
          }
        ]
      },
      {
        name: `Jennifer & Rob`,
        items: [
          {
            name: `Cod Egg Udon`,
            price: 17.95,
            tax: 10,
            gratuity: 18
          },
          {
            name: `STF COMBO LA GALBI`,
            price: 20.95,
            tax: 10,
            gratuity: 18
          }
        ]
      }
    ]
  };

  constructor(
    public toastrService: ToastrService,
    private ssrService: SsrService,
    @Inject(PLATFORM_ID) private platformId: any
  ) { }

  ngOnInit() {
    // this.ssrService.setSeo({
    //   title: `Split Bill Calculator`,
    //   description: `Whether you're eating out or travelling with a group, there may come a time when you need to split the bill and pay your part. This calculator helps you!`
    // }, `calculator`, true)
  }

  calculateTaxOrGratuity(item: any, type: string) {
    return _.get(item, ['price'], 0) * (_.get(item, [type], 0) / 100);
  }

  calculateAllSubTotal(person: any) {
    let final = 0;
    const items = _.get(person, ['items']);
    _.forEach(items, (item) => {
      final += _.get(item, ['price'], 0);
    });
    return final;
  }

  calculateAllTaxOrGratuity(person: any, type: string) {
    let final = 0;
    const items = _.get(person, ['items']);
    _.forEach(items, (item) => {
      final += this.calculateTaxOrGratuity(item, type);
    });
    return final;
  }

  calculateGrandTotal(person: any): number {
    const filledItemPrices = _.filter(_.get(person, ['items']), (item) => _.get(item, ['price'], false));
    let total = 0;
    _.forEach(filledItemPrices, (item) => {
      const includeTax = this.calculateTaxOrGratuity(item, 'tax');
      const includeGratuity = this.calculateTaxOrGratuity(item, 'gratuity');
      total += _.get(item, ['price'], 0) + includeTax + includeGratuity
    })
    return total;
  }

  calculateAllGrandTotal(persons: Array<any>): number {
    let grandTotal = 0;
    _.forEach(persons, (person) => {
      grandTotal += this.calculateGrandTotal(person);
    });
    return grandTotal;
  }

  clearForm(): void {
    this.form = _.cloneDeep(this.defaultForm);
    this.scrollToTop();
  }

  isPlatformBrowser() {
    return isPlatformBrowser(this.platformId);
  }

  scrollToTop() {
    if (isPlatformServer(this.platformId)) { return; }
    window.scrollTo(0, 0);
  }
}
