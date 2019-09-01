import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TrendingTickersComponent } from './trending-tickers.component';

describe('TrendingTickersComponent', () => {
  let component: TrendingTickersComponent;
  let fixture: ComponentFixture<TrendingTickersComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TrendingTickersComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TrendingTickersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
