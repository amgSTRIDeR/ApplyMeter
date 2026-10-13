import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MetricEditor } from './metric-editor';

describe('MetricEditor', () => {
  let component: MetricEditor;
  let fixture: ComponentFixture<MetricEditor>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MetricEditor],
    }).compileComponents();

    fixture = TestBed.createComponent(MetricEditor);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
