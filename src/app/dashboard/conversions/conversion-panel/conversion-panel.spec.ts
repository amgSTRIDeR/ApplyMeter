import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ConversionPanel } from './conversion-panel';

describe('ConversionPanel', () => {
  let component: ConversionPanel;
  let fixture: ComponentFixture<ConversionPanel>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConversionPanel],
    }).compileComponents();

    fixture = TestBed.createComponent(ConversionPanel);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
