import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ShortCutsComponent } from './short-cuts.component';

describe('ShortCutsComponent', () => {
  let component: ShortCutsComponent;
  let fixture: ComponentFixture<ShortCutsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ShortCutsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ShortCutsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
