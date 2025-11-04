import {
  ChangeDetectionStrategy,
  Component,
  Input,
  Output,
  EventEmitter,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { IfcClass } from '../../../shared/models/ifc-class.model';

/**
 * Component for displaying and filtering IFC classes
 */
@Component({
  selector: 'app-ifc-class-filter',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ifc-class-filter.component.html',
  styleUrl: './ifc-class-filter.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IfcClassFilterComponent {
  @Input() set classes(value: IfcClass[]) {
    this.ifcClasses.set(value);
  }

  @Output() visibilityChange = new EventEmitter<{ className: string; visible: boolean }>();

  protected readonly ifcClasses = signal<IfcClass[]>([]);

  /**
   * Toggle visibility for an IFC class
   */
  protected onToggleVisibility(ifcClass: IfcClass): void {
    this.visibilityChange.emit({
      className: ifcClass.name,
      visible: !ifcClass.visible,
    });
  }
}
