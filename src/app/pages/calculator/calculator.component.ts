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
  public defaultForm: any = {
    persons: [
      {
        items: []
      }
    ],
    tax: 10,
    gratuity: 15
  };
  public form: any = {
    persons: [
      {
        name: `Solinda`,
        items: [
          {
            name: `SOONTOFU MUSHROOM LESS SPICY`,
            price: 11.95,
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
            includeTax: true
          },
          {
            name: `Chicken Katsu Curry`,
            price: 12.95,
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
            includeTax: true
          }
        ]
      },
      {
        name: `Shullina`,
        items: [
          {
            name: `Chicken Katsu Curry`,
            price: 12.95,
            includeTax: true
          }
        ]
      },
      {
        name: `Kevin`,
        items: [
          {
            name: `Chicken Katsu Curry`,
            price: 12.95,
            includeTax: true
          }
        ]
      },
      {
        name: `Jennifer & Rob`,
        items: [
          {
            name: `Cod Egg Udon`,
            price: 17.95,
            includeTax: true
          },
          {
            name: `STF COMBO LA GALBI`,
            price: 20.95,
            includeTax: true
          }
        ]
      }
    ],
    tax: 10,
    gratuity: 18
  };

  constructor(
    public toastrService: ToastrService,
    private ssrService: SsrService,
    @Inject(PLATFORM_ID) private platformId: any
  ) { }

  ngOnInit() {
    this.ssrService.setSeo({
      title: `Split Bill Calculator`,
      description: `Whether you're eating out or travelling with a group, there may come a time when you need to split the bill and pay your part. This calculator helps you!`
    }, `calculator`, true)
  }

  calculatePersonTotal(person: any) {
    const filledItemPrices = _.filter(_.get(person, ['items']), (item) => _.get(item, ['price'], false));
    let total = 0;
    _.forEach(filledItemPrices, (item) => {
      const ItemPrice = _.get(item, ['price']);
      const includeTax = _.get(item, ['includeTax']) ? (ItemPrice * (_.get(this.form, ['tax']) / 100)) : 0;
      const includeGratuity = ItemPrice * (_.get(this.form, ['gratuity']) / 100);
      total += ItemPrice + includeTax + includeGratuity
    })
    return total;
  }

  calculateGrandTotal(persons: Array<any>): number {
    let grandTotal = 0;
    _.forEach(persons, (person) => {
      grandTotal += this.calculatePersonTotal(person);
    });
    return grandTotal;
  }

  clearForm(): void {
    this.form = _.cloneDeep(this.defaultForm);
  }

  isPlatformBrowser() {
    return isPlatformBrowser(this.platformId);
  }
}
