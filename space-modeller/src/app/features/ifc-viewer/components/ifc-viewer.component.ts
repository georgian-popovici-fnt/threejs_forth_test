import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  viewChild,
  inject,
  afterNextRender,
  signal,
  OnDestroy,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { IfcViewerService } from '../services/ifc-viewer.service';
import { NotificationService } from '../../../shared/services/notification.service';
import { LoggerService } from '../../../shared/services/logger.service';
import { FILE_VALIDATION, ERROR_MESSAGES, SUCCESS_MESSAGES, IFC_CLASS_CONFIG } from '../../../shared/constants/app.constants';
import {
  sanitizeFileName,
  hasAllowedExtension,
  readFileAsArrayBuffer,
  getFileNameWithoutExtension,
} from '../../../shared/utils/file.utils';
import { IfcClass } from '../../../shared/models/ifc-class.model';
import { CameraMode } from '../../../shared/models/camera-mode.model';
import { LightMode } from '../../../shared/models/light-mode.model';
import { IfcClassFilterComponent } from './ifc-class-filter.component';
import { CameraSelectorComponent } from './camera-selector.component';
import { LightSelectorComponent } from './light-selector.component';
import { OrientationCubeComponent } from './orientation-cube.component';

/**
 * IFC Viewer Component
 * Displays a 3D viewport with IFC file loading and fragment export capabilities
 */
@Component({
  selector: 'app-ifc-viewer',
  standalone: true,
  imports: [CommonModule, IfcClassFilterComponent, CameraSelectorComponent, LightSelectorComponent, OrientationCubeComponent],
  templateUrl: './ifc-viewer.component.html',
  styleUrl: './ifc-viewer.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IfcViewerComponent implements OnDestroy {
  private readonly viewerService = inject(IfcViewerService);
  private readonly notificationService = inject(NotificationService);
  private readonly logger = inject(LoggerService);
  private readonly canvasRef = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');

  protected readonly isLoading = signal<boolean>(false);
  protected readonly currentFileName = signal<string>('');
  protected readonly isSidebarCollapsed = signal<boolean>(false);
  protected readonly ifcClasses = signal<IfcClass[]>([]);
  protected readonly currentCameraMode = signal<CameraMode>(CameraMode.PERSPECTIVE_3D);
  protected readonly currentLightMode = signal<LightMode>(LightMode.DEFAULT);
  protected readonly isPanMode = signal<boolean>(false);
  protected readonly isDragging = signal<boolean>(false);

  // Computed signal to get the current camera for the orientation cube
  protected readonly currentCamera = computed(() => this.viewerService.cameraSignal());

  constructor() {
    afterNextRender(() => {
      this.initializeViewer();
    });
  }

  /**
   * Initialize the 3D viewer
   */
  private async initializeViewer(): Promise<void> {
    const canvas = this.canvasRef().nativeElement;
    await this.viewerService.initialize(canvas);
  }

  /**
   * Handle file selection for IFC import
   */
  protected async onFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) return;

    // Sanitize filename
    const sanitizedName = sanitizeFileName(file.name);

    // Validate file extension
    if (!hasAllowedExtension(sanitizedName, FILE_VALIDATION.ALLOWED_EXTENSIONS)) {
      this.notificationService.warning(ERROR_MESSAGES.INVALID_FILE_TYPE);
      return;
    }

    // Validate file size
    if (file.size > FILE_VALIDATION.MAX_FILE_SIZE) {
      this.notificationService.error(ERROR_MESSAGES.FILE_TOO_LARGE);
      return;
    }

    this.isLoading.set(true);
    this.currentFileName.set(sanitizedName);

    try {
      this.logger.info(`Starting to load file: ${sanitizedName}`);

      // Read file as ArrayBuffer using utility
      const uint8Array = await readFileAsArrayBuffer(file);

      this.logger.debug(`File read successfully, size: ${uint8Array.byteLength} bytes`);

      // Load IFC file
      const modelName = getFileNameWithoutExtension(sanitizedName);
      const model = await this.viewerService.loadIfcFile(uint8Array, modelName);

      if (model) {
        this.logger.info(`Successfully loaded: ${sanitizedName}`);
        this.notificationService.success(SUCCESS_MESSAGES.FILE_LOADED(sanitizedName));
        
        // Load IFC classes after successful model load
        await this.loadIfcClasses();
      } else {
        this.logger.error('Model loading returned null');
        this.notificationService.error(`${ERROR_MESSAGES.LOAD_FAILED}. Check console for details.`);
      }
    } catch (error) {
      this.logger.error('Error loading IFC file:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.notificationService.error(
        `Error loading IFC file: ${errorMessage}. Check console for details.`
      );
    } finally {
      this.isLoading.set(false);
      // Reset input to allow reloading the same file
      input.value = '';
    }
  }

  /**
   * Export current model as .frag file
   */
  protected async onExportFragments(): Promise<void> {
    const currentModel = this.viewerService.getCurrentModel();

    if (!currentModel) {
      this.notificationService.warning(ERROR_MESSAGES.NO_MODEL_LOADED);
      return;
    }

    try {
      const fileName = this.currentFileName() || 'model';
      const baseName = getFileNameWithoutExtension(sanitizeFileName(fileName));

      await this.viewerService.exportFragments(baseName);
      this.notificationService.success(SUCCESS_MESSAGES.FILE_EXPORTED(baseName));
    } catch (error) {
      this.logger.error('Error exporting fragments:', error);
      this.notificationService.error(ERROR_MESSAGES.EXPORT_FAILED);
    }
  }

  /**
   * Toggle sidebar collapsed state
   */
  protected toggleSidebar(): void {
    this.isSidebarCollapsed.update(collapsed => !collapsed);
  }

  /**
   * Load IFC classes from the current model
   */
  private async loadIfcClasses(): Promise<void> {
    try {
      this.logger.info('Loading IFC classes...');
      
      // Get all categories from the model
      const categories = await this.viewerService.getCategories();
      
      if (categories.length === 0) {
        this.logger.warn('No categories found in the model');
        return;
      }

      // Get items for each category
      const categoryItems = await this.viewerService.getItemsOfCategories(categories);
      
      // Create IfcClass objects with visibility set based on configuration
      const ifcClasses: IfcClass[] = categories
        .map(category => {
          // Check if this category should be hidden by default
          const shouldBeHidden = IFC_CLASS_CONFIG.DEFAULT_HIDDEN_CLASSES.includes(category);
          return {
            name: category,
            visible: !shouldBeHidden, // Hide if in the default hidden list
            itemIds: categoryItems[category] || [],
          };
        })
        .filter(ifcClass => ifcClass.itemIds.length > 0) // Only include categories with items
        .sort((a, b) => a.name.localeCompare(b.name)); // Sort alphabetically

      this.ifcClasses.set(ifcClasses);
      this.logger.info(`Loaded ${ifcClasses.length} IFC classes`);

      // Apply initial visibility state to the viewer for all classes
      for (const ifcClass of ifcClasses) {
        await this.viewerService.setItemsVisible(ifcClass.itemIds, ifcClass.visible);
        if (!ifcClass.visible) {
          this.logger.debug(`Hidden by default: ${ifcClass.name} (${ifcClass.itemIds.length} items)`);
        }
      }
    } catch (error) {
      this.logger.error('Error loading IFC classes:', error);
      this.notificationService.error('Failed to load IFC classes');
    }
  }

  /**
   * Handle visibility change for an IFC class
   */
  protected async onClassVisibilityChange(event: { className: string; visible: boolean }): Promise<void> {
    try {
      // Find the class
      const classes = this.ifcClasses();
      const classIndex = classes.findIndex(c => c.name === event.className);
      
      if (classIndex === -1) {
        this.logger.warn(`Class not found: ${event.className}`);
        return;
      }

      const ifcClass = classes[classIndex];

      // Update visibility in the viewer
      await this.viewerService.setItemsVisible(ifcClass.itemIds, event.visible);

      // Update local state
      const updatedClasses = [...classes];
      updatedClasses[classIndex] = { ...ifcClass, visible: event.visible };
      this.ifcClasses.set(updatedClasses);

      this.logger.debug(`Set visibility for ${event.className} to ${event.visible}`);
    } catch (error) {
      this.logger.error('Error changing class visibility:', error);
      this.notificationService.error('Failed to change class visibility');
    }
  }

  /**
   * Handle camera mode change
   */
  protected onCameraModeChange(mode: CameraMode): void {
    try {
      this.viewerService.setCameraMode(mode);
      this.currentCameraMode.set(mode);
      this.logger.info(`Camera mode changed to: ${mode}`);
    } catch (error) {
      this.logger.error('Error changing camera mode:', error);
      this.notificationService.error('Failed to change camera mode');
    }
  }

  /**
   * Handle mouse down on canvas
   */
  protected onCanvasMouseDown(event: MouseEvent): void {
    // Only set dragging state for primary mouse button (left click)
    if (event.button === 0) {
      this.isDragging.set(true);
    }
  }

  /**
   * Handle mouse up on canvas
   */
  protected onCanvasMouseUp(): void {
    this.isDragging.set(false);
  }

  /**
   * Handle light mode change
   */
  protected onLightModeChange(mode: LightMode): void {
    try {
      this.viewerService.setLightMode(mode);
      this.currentLightMode.set(mode);
      this.logger.info(`Light mode changed to: ${mode}`);
    } catch (error) {
      this.logger.error('Error changing light mode:', error);
      this.notificationService.error('Failed to change light mode');
    }
  }

  /**
   * Toggle pan mode
   */
  protected togglePanMode(): void {
    const newPanMode = !this.isPanMode();
    try {
      this.viewerService.setPanMode(newPanMode);
      this.isPanMode.set(newPanMode);
      this.logger.info(`Pan mode ${newPanMode ? 'enabled' : 'disabled'}`);
    } catch (error) {
      this.logger.error('Error toggling pan mode:', error);
      this.notificationService.error('Failed to toggle pan mode');
    }
  }

  /**
   * Clean up on component destroy
   */
  ngOnDestroy(): void {
    this.viewerService.dispose();
  }
}
