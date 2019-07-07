import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EditModalConfirmComponent } from './edit-modal-confirm.component';

describe('EditModalConfirmComponent', () => {
  let component: EditModalConfirmComponent;
  let fixture: ComponentFixture<EditModalConfirmComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ EditModalConfirmComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EditModalConfirmComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
