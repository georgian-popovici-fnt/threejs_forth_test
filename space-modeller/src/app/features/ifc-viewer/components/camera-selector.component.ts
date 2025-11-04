import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  input,
  Output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { CameraMode, CAMERA_MODE_OPTIONS, CameraModeOption } from '../../../shared/models/camera-mode.model';

/**
 * Camera selection dropdown component
 * Allows users to switch between 3D and 2D camera views
 */
@Component({
  selector: 'app-camera-selector',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './camera-selector.component.html',
  styleUrl: './camera-selector.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CameraSelectorComponent {
  /** Current selected camera mode */
  readonly selectedMode = input<CameraMode>(CameraMode.PERSPECTIVE_3D);

  /** Event emitted when camera mode changes */
  @Output() readonly modeChange = new EventEmitter<CameraMode>();

  /** Available camera mode options */
  protected readonly options = CAMERA_MODE_OPTIONS;

  /**
   * Handle camera mode selection change
   */
  protected onModeChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const mode = select.value as CameraMode;
    this.modeChange.emit(mode);
  }

  /**
   * Get label for selected mode
   */
  protected getSelectedLabel(): string {
    const option = this.options.find(opt => opt.value === this.selectedMode());
    return option?.label || '3D View';
  }
}
