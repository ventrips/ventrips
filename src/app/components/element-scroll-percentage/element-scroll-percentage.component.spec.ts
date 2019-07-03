import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ElementScrollPercentageComponent } from './element-scroll-percentage.component';

describe('ElementScrollPercentageComponent', () => {
  let component: ElementScrollPercentageComponent;
  let fixture: ComponentFixture<ElementScrollPercentageComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ElementScrollPercentageComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ElementScrollPercentageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
