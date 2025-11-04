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

    if (!file.name.toLowerCase().endsWith('.ifc')) {
      alert('Please select a valid IFC file');
      return;
    }

    this.isLoading.set(true);
    this.currentFileName.set(file.name);

    try {
      console.log(`Starting to load file: ${file.name}`);

      // Read file as ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);

      console.log(`File read successfully, size: ${uint8Array.byteLength} bytes`);

      // Load IFC file
      const modelName = file.name.replace('.ifc', '');
      const model = await this.viewerService.loadIfcFile(uint8Array, modelName);

      if (model) {
        console.log(`Successfully loaded: ${file.name}`);
        alert(`Successfully loaded: ${file.name}`);
      } else {
        console.error('Model loading returned null');
        alert('Error: Model loading failed. Check console for details.');
      }
    } catch (error) {
      console.error('Error loading IFC file:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(`Error loading IFC file: ${errorMessage}\n\nCheck console for details.`);
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
      alert('No model loaded. Please load an IFC file first.');
      return;
    }

    const fileName = this.currentFileName() || 'model';
    const baseName = fileName.replace('.ifc', '');

    await this.viewerService.exportFragments(baseName);
  }

  /**
   * Clean up on component destroy
   */
  ngOnDestroy(): void {
    this.viewerService.dispose();
  }
}
