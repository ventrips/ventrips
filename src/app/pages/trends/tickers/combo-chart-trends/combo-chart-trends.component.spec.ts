import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ComboChartTrendsComponent } from './combo-chart-trends.component';

describe('ComboChartTrendsComponent', () => {
  let component: ComboChartTrendsComponent;
  let fixture: ComponentFixture<ComboChartTrendsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ComboChartTrendsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ComboChartTrendsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
