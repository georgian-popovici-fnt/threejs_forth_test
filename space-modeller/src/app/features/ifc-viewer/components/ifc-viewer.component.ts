import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  viewChild,
  inject,
  afterNextRender,
  signal,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { IfcViewerService } from '../services/ifc-viewer.service';
import { NotificationService } from '../../../shared/services/notification.service';
import { LoggerService } from '../../../shared/services/logger.service';
import { FILE_VALIDATION, ERROR_MESSAGES, SUCCESS_MESSAGES } from '../../../shared/constants/app.constants';
import {
  sanitizeFileName,
  hasAllowedExtension,
  readFileAsArrayBuffer,
  getFileNameWithoutExtension,
} from '../../../shared/utils/file.utils';

/**
 * IFC Viewer Component
 * Displays a 3D viewport with IFC file loading and fragment export capabilities
 */
@Component({
  selector: 'app-ifc-viewer',
  standalone: true,
  imports: [CommonModule],
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
   * Clean up on component destroy
   */
  ngOnDestroy(): void {
    this.viewerService.dispose();
  }
}
