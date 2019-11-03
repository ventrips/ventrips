import { Component, OnInit, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser, isPlatformServer } from '@angular/common';
import { ToastrService } from 'ngx-toastr';
import { Calculator } from './../../interfaces/calculator';
import * as _ from 'lodash';

@Component({
  selector: 'app-calculator',
  templateUrl: './calculator.component.html',
  styleUrls: ['./calculator.component.scss']
})
export class CalculatorComponent implements OnInit {
  public form: Calculator = new Calculator('', '', '', '');

  constructor(
    public toastrService: ToastrService,
    @Inject(PLATFORM_ID) private platformId: any
  ) { }

  ngOnInit() {
  }

  onSubmit() {
    this.toastrService.success(`Form has been submitted.`, 'Submission Success!');
  }

  isPlatformBrowser() {
    return isPlatformBrowser(this.platformId);
  }
}
