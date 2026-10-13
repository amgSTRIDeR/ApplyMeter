import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ConversionEditor } from './conversion-editor';

describe('ConversionEditor', () => {
  let component: ConversionEditor;
  let fixture: ComponentFixture<ConversionEditor>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConversionEditor],
    }).compileComponents();

    fixture = TestBed.createComponent(ConversionEditor);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
