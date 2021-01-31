import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BestStocksComponent } from './best-stocks.component';

describe('BestStocksComponent', () => {
  let component: BestStocksComponent;
  let fixture: ComponentFixture<BestStocksComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ BestStocksComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BestStocksComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
