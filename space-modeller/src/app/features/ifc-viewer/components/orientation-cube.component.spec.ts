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
});
