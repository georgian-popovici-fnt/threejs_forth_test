import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { IfcViewerComponent } from './features/ifc-viewer/components/ifc-viewer.component';
import { NotificationComponent } from './shared/components/notification/notification.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, IfcViewerComponent, NotificationComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  title = 'space-modeller';
}
