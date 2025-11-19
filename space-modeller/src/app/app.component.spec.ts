import { TestBed } from '@angular/core/testing';
import { AppComponent } from './app.component';
import { IfcViewerComponent } from './features/ifc-viewer/components/ifc-viewer.component';
import { IfcViewerService } from './features/ifc-viewer/services/ifc-viewer.service';
import { NotificationComponent } from './shared/components/notification/notification.component';

describe('AppComponent', () => {
  let mockViewerService: jasmine.SpyObj<IfcViewerService>;

  beforeEach(async () => {
    mockViewerService = jasmine.createSpyObj('IfcViewerService', [
      'initialize',
      'dispose',
    ], {
      cameraSignal: jasmine.createSpy('cameraSignal').and.returnValue(null),
    });

    await TestBed.configureTestingModule({
      imports: [AppComponent, IfcViewerComponent, NotificationComponent],
      providers: [{ provide: IfcViewerService, useValue: mockViewerService }],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it(`should have the 'space-modeller' title`, () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app.title).toEqual('space-modeller');
  });

  it('should render the IFC viewer component', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-ifc-viewer')).toBeTruthy();
  });
});
