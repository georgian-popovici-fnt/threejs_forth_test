import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LightSelectorComponent } from './light-selector.component';
import { LightMode } from '../../../shared/models/light-mode.model';

describe('LightSelectorComponent', () => {
  let component: LightSelectorComponent;
  let fixture: ComponentFixture<LightSelectorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LightSelectorComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(LightSelectorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit mode change event when selection changes', () => {
    let emittedMode: LightMode | undefined;
    component.modeChange.subscribe((mode) => {
      emittedMode = mode;
    });

    const select = fixture.nativeElement.querySelector('select');
    select.value = LightMode.BRIGHT;
    select.dispatchEvent(new Event('change'));

    expect(emittedMode).toBe(LightMode.BRIGHT);
  });

  it('should display all light mode options', () => {
    const options = fixture.nativeElement.querySelectorAll('option');
    expect(options.length).toBe(4);
  });

  it('should handle mode change with event object', () => {
    let emittedMode: LightMode | undefined;
    component.modeChange.subscribe((mode) => {
      emittedMode = mode;
    });

    const mockEvent = new Event('change');
    Object.defineProperty(mockEvent, 'target', {
      value: {
        value: LightMode.SOFT,
      } as HTMLSelectElement,
      writable: false,
    });

    component['onModeChange'](mockEvent);

    expect(emittedMode).toBe(LightMode.SOFT);
  });

  it('should emit dark light mode', () => {
    let emittedMode: LightMode | undefined;
    component.modeChange.subscribe((mode) => {
      emittedMode = mode;
    });

    const select = fixture.nativeElement.querySelector('select');
    select.value = LightMode.DRAMATIC;
    select.dispatchEvent(new Event('change'));

    expect(emittedMode).toBe(LightMode.DRAMATIC);
  });

  it('should emit default light mode', () => {
    let emittedMode: LightMode | undefined;
    component.modeChange.subscribe((mode) => {
      emittedMode = mode;
    });

    const select = fixture.nativeElement.querySelector('select');
    select.value = LightMode.DEFAULT;
    select.dispatchEvent(new Event('change'));

    expect(emittedMode).toBe(LightMode.DEFAULT);
  });
});
