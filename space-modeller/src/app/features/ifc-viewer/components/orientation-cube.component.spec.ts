import { ComponentFixture, TestBed } from '@angular/core/testing';
import { OrientationCubeComponent } from './orientation-cube.component';
import * as THREE from 'three';

describe('OrientationCubeComponent', () => {
  let component: OrientationCubeComponent;
  let fixture: ComponentFixture<OrientationCubeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrientationCubeComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(OrientationCubeComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have a canvas element', () => {
    fixture.detectChanges();
    const canvas = fixture.nativeElement.querySelector('canvas');
    expect(canvas).toBeTruthy();
    expect(canvas?.classList.contains('orientation-cube-canvas')).toBe(true);
  });

  it('should accept a camera input', () => {
    const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 100);
    fixture.componentRef.setInput('camera', camera);
    fixture.detectChanges();
    expect(component.camera()).toBe(camera);
  });

  it('should handle null camera input', () => {
    fixture.componentRef.setInput('camera', null);
    fixture.detectChanges();
    expect(component.camera()).toBeNull();
  });

  it('should cleanup resources on destroy', () => {
    fixture.detectChanges();
    
    // Just verify that component can be destroyed without errors
    expect(() => {
      fixture.destroy();
    }).not.toThrow();
  });

  it('should display coordinates panel', () => {
    fixture.detectChanges();
    const coordinatesPanel = fixture.nativeElement.querySelector('.coordinates-panel');
    expect(coordinatesPanel).toBeTruthy();
  });

  it('should display position coordinates', () => {
    fixture.detectChanges();
    const positionValues = fixture.nativeElement.querySelectorAll('.coordinates-value');
    expect(positionValues.length).toBeGreaterThan(0);
  });

  it('should initialize with default camera position', () => {
    fixture.detectChanges();
    expect(component['cameraPosition']().x).toBe('0.00');
    expect(component['cameraPosition']().y).toBe('0.00');
    expect(component['cameraPosition']().z).toBe('0.00');
  });

  it('should initialize with default camera rotation', () => {
    fixture.detectChanges();
    expect(component['cameraRotation']().x).toBe('0');
    expect(component['cameraRotation']().y).toBe('0');
    expect(component['cameraRotation']().z).toBe('0');
  });

  it('should update when camera input changes', () => {
    fixture.detectChanges();
    
    const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 100);
    camera.position.set(10, 20, 30);
    
    fixture.componentRef.setInput('camera', camera);
    fixture.detectChanges();
    
    expect(component.camera()).toBe(camera);
  });

  it('should handle camera rotation updates', (done) => {
    fixture.detectChanges();
    
    const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 100);
    camera.rotation.set(Math.PI / 4, Math.PI / 2, 0);
    
    fixture.componentRef.setInput('camera', camera);
    fixture.detectChanges();
    
    // Wait for the coordinate update interval
    setTimeout(() => {
      // Coordinates should be updated
      const rotation = component['cameraRotation']();
      expect(rotation.x).not.toBe('0');
      done();
    }, 200);
  });
});
