import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { NewsApiComponent } from './news-api.component';

describe('NewsApiComponent', () => {
  let component: NewsApiComponent;
  let fixture: ComponentFixture<NewsApiComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ NewsApiComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NewsApiComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
