import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  input,
  Output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { LightMode, LIGHT_MODE_OPTIONS } from '../../../shared/models/light-mode.model';

/**
 * Light selection dropdown component
 * Allows users to switch between different lighting modes
 */
@Component({
  selector: 'app-light-selector',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './light-selector.component.html',
  styleUrl: './light-selector.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LightSelectorComponent {
  /** Current selected light mode */
  readonly selectedMode = input<LightMode>(LightMode.DEFAULT);

  /** Event emitted when light mode changes */
  @Output() readonly modeChange = new EventEmitter<LightMode>();

  /** Available light mode options */
  protected readonly options = LIGHT_MODE_OPTIONS;

  /**
   * Handle light mode selection change
   */
  protected onModeChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const mode = select.value as LightMode;
    this.modeChange.emit(mode);
  }
}
