import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CameraSelectorComponent } from './camera-selector.component';
import { CameraMode } from '../../../shared/models/camera-mode.model';

describe('CameraSelectorComponent', () => {
  let component: CameraSelectorComponent;
  let fixture: ComponentFixture<CameraSelectorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CameraSelectorComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CameraSelectorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit mode change event when selection changes', () => {
    let emittedMode: CameraMode | undefined;
    component.modeChange.subscribe((mode) => {
      emittedMode = mode;
    });

    const select = fixture.nativeElement.querySelector('select');
    select.value = CameraMode.ORTHOGRAPHIC_TOP;
    select.dispatchEvent(new Event('change'));

    expect(emittedMode).toBe(CameraMode.ORTHOGRAPHIC_TOP);
  });

  it('should display all camera mode options', () => {
    const options = fixture.nativeElement.querySelectorAll('option');
    expect(options.length).toBe(4);
  });

  it('should return correct label for selected mode', () => {
    fixture.componentRef.setInput('selectedMode', CameraMode.PERSPECTIVE_3D);
    fixture.detectChanges();
    expect(component['getSelectedLabel']()).toBe('3D View');
  });

  it('should return correct label for orthographic top mode', () => {
    fixture.componentRef.setInput('selectedMode', CameraMode.ORTHOGRAPHIC_TOP);
    fixture.detectChanges();
    expect(component['getSelectedLabel']()).toBe('2D Top View');
  });

  it('should return correct label for orthographic front mode', () => {
    fixture.componentRef.setInput('selectedMode', CameraMode.ORTHOGRAPHIC_FRONT);
    fixture.detectChanges();
    expect(component['getSelectedLabel']()).toBe('2D Front View');
  });

  it('should return correct label for orthographic side mode', () => {
    fixture.componentRef.setInput('selectedMode', CameraMode.ORTHOGRAPHIC_SIDE);
    fixture.detectChanges();
    expect(component['getSelectedLabel']()).toBe('2D Side View');
  });

  it('should return default label when mode is not found', () => {
    fixture.componentRef.setInput('selectedMode', 'INVALID_MODE' as CameraMode);
    fixture.detectChanges();
    expect(component['getSelectedLabel']()).toBe('3D View');
  });

  it('should handle mode change with event object', () => {
    let emittedMode: CameraMode | undefined;
    component.modeChange.subscribe((mode) => {
      emittedMode = mode;
    });

    const mockEvent = new Event('change');
    Object.defineProperty(mockEvent, 'target', {
      value: {
        value: CameraMode.ORTHOGRAPHIC_FRONT,
      } as HTMLSelectElement,
      writable: false,
    });

    component['onModeChange'](mockEvent);

    expect(emittedMode).toBe(CameraMode.ORTHOGRAPHIC_FRONT);
  });
});
