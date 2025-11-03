import { TestBed } from '@angular/core/testing';
import { IfcViewerComponent } from './ifc-viewer.component';
import { IfcViewerService } from '../services/ifc-viewer.service';

describe('IfcViewerComponent', () => {
  let mockViewerService: jasmine.SpyObj<IfcViewerService>;

  beforeEach(async () => {
    mockViewerService = jasmine.createSpyObj('IfcViewerService', [
      'initialize',
      'loadIfcFile',
      'exportFragments',
      'dispose',
      'getCurrentModel',
    ]);

    await TestBed.configureTestingModule({
      imports: [IfcViewerComponent],
      providers: [{ provide: IfcViewerService, useValue: mockViewerService }],
    }).compileComponents();
  });

  it('should create the component', () => {
    const fixture = TestBed.createComponent(IfcViewerComponent);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });

  it('should dispose viewer service on destroy', () => {
    const fixture = TestBed.createComponent(IfcViewerComponent);
    const component = fixture.componentInstance;

    component.ngOnDestroy();

    expect(mockViewerService.dispose).toHaveBeenCalled();
  });
});
