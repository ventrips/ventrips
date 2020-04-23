import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AlphaVantageApiComponent } from './alpha-vantage-api.component';

describe('AlphaVantageApiComponent', () => {
  let component: AlphaVantageApiComponent;
  let fixture: ComponentFixture<AlphaVantageApiComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AlphaVantageApiComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AlphaVantageApiComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
