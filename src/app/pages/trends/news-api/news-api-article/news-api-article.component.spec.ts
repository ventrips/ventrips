import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { NewsApiArticleComponent } from './news-api-article.component';

describe('NewsApiArticleComponent', () => {
  let component: NewsApiArticleComponent;
  let fixture: ComponentFixture<NewsApiArticleComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ NewsApiArticleComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NewsApiArticleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
