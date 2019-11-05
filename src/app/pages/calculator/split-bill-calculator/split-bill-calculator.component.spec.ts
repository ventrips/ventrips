import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SplitBillCalculatorComponent } from './split-bill-calculator.component';

describe('SplitBillCalculatorComponent', () => {
  let component: SplitBillCalculatorComponent;
  let fixture: ComponentFixture<SplitBillCalculatorComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SplitBillCalculatorComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SplitBillCalculatorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
