import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SymbolSearchBarComponent } from './symbol-search-bar.component';

describe('SymbolSearchBarComponent', () => {
  let component: SymbolSearchBarComponent;
  let fixture: ComponentFixture<SymbolSearchBarComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SymbolSearchBarComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SymbolSearchBarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
