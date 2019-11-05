import { Component, OnInit, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser, isPlatformServer } from '@angular/common';
import { ToastrService } from 'ngx-toastr';
import { SsrService } from '../../../services/firestore/ssr/ssr.service';
import { environment } from '../../../../environments/environment';
import * as _ from 'lodash';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-split-bill-calculator',
  templateUrl: './split-bill-calculator.component.html',
  styleUrls: ['./split-bill-calculator.component.scss']
})
export class SplitBillCalculatorComponent implements OnInit {
  public title: string = `Split Bill Calculator - Pay Your Portion`;
  public description: string = `Whether you're dining out or traveling with a group, there comes a time when you need to split the bill and pay your part. This tool calculates individual bills for you!`;
  public environment = environment;
  public _ = _;
  public defaultItem: any = {
    tax: 10,
    gratuity: 0
  };
  public defaultPerson :any = {
    items: [
      this.defaultItem
    ]
  }
  public defaultForm: any = {
    persons: []
  };
  public form: any = _.cloneDeep(this.defaultForm);
  public sampleForm: any = {
    persons: [
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
        name: `Rob & Jennifer`,
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
  public url: string;

  constructor(
    public toastrService: ToastrService,
    private ssrService: SsrService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    @Inject(PLATFORM_ID) private platformId: any
  ) { }

  ngOnInit(): void {
    this.activatedRoute.queryParams.subscribe(params => {
      this.url = this.router.url;
    });
    this.ssrService.setSeo({
      title: this.title,
      description: this.description
    }, `calculator-split-bill`, true);
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

  demoForm(): void {
    this.form = _.cloneDeep(this.sampleForm);
    this.scrollToTop();
  }

  resetForm(): void {
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
