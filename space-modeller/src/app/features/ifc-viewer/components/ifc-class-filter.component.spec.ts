import { TestBed } from '@angular/core/testing';
import { IfcClassFilterComponent } from './ifc-class-filter.component';
import { IfcClass } from '../../../shared/models/ifc-class.model';

describe('IfcClassFilterComponent', () => {
  it('should create the component', () => {
    const fixture = TestBed.createComponent(IfcClassFilterComponent);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });

  it('should display empty message when no classes are provided', () => {
    const fixture = TestBed.createComponent(IfcClassFilterComponent);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const emptyMessage = compiled.querySelector('.filter-empty');
    expect(emptyMessage?.textContent).toContain('No classes available');
  });

  it('should display list of IFC classes', () => {
    const fixture = TestBed.createComponent(IfcClassFilterComponent);
    const component = fixture.componentInstance;

    const mockClasses: IfcClass[] = [
      { name: 'IfcWall', visible: true, itemIds: [1, 2, 3] },
      { name: 'IfcDoor', visible: true, itemIds: [4, 5] },
      { name: 'IfcWindow', visible: false, itemIds: [6, 7, 8] },
    ];

    component.classes = mockClasses;
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const listItems = compiled.querySelectorAll('.filter-item');
    expect(listItems.length).toBe(3);
  });

  it('should show correct item counts', () => {
    const fixture = TestBed.createComponent(IfcClassFilterComponent);
    const component = fixture.componentInstance;

    const mockClasses: IfcClass[] = [
      { name: 'IfcWall', visible: true, itemIds: [1, 2, 3] },
      { name: 'IfcDoor', visible: true, itemIds: [4, 5] },
    ];

    component.classes = mockClasses;
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const counts = compiled.querySelectorAll('.filter-count');
    expect(counts[0].textContent).toContain('(3)');
    expect(counts[1].textContent).toContain('(2)');
  });

  it('should emit visibility change event when checkbox is clicked', () => {
    const fixture = TestBed.createComponent(IfcClassFilterComponent);
    const component = fixture.componentInstance;

    const mockClasses: IfcClass[] = [
      { name: 'IfcWall', visible: true, itemIds: [1, 2, 3] },
    ];

    component.classes = mockClasses;
    fixture.detectChanges();

    spyOn(component.visibilityChange, 'emit');

    const checkbox = fixture.nativeElement.querySelector('.filter-checkbox') as HTMLInputElement;
    checkbox.click();

    expect(component.visibilityChange.emit).toHaveBeenCalledWith({
      className: 'IfcWall',
      visible: false,
    });
  });

  it('should reflect checked state based on visible property', () => {
    const fixture = TestBed.createComponent(IfcClassFilterComponent);
    const component = fixture.componentInstance;

    const mockClasses: IfcClass[] = [
      { name: 'IfcWall', visible: true, itemIds: [1, 2, 3] },
      { name: 'IfcDoor', visible: false, itemIds: [4, 5] },
    ];

    component.classes = mockClasses;
    fixture.detectChanges();

    const checkboxes = fixture.nativeElement.querySelectorAll('.filter-checkbox') as NodeListOf<HTMLInputElement>;
    expect(checkboxes[0].checked).toBeTrue();
    expect(checkboxes[1].checked).toBeFalse();
  });
});
