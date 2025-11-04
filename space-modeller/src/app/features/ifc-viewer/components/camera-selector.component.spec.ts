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
});
