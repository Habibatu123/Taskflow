import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-dialog',
  standalone: true,
  imports: [],
  templateUrl: './dialog.component.html',
  styleUrl: './dialog.component.scss'
})
export class DialogComponent {
  @Output()
  onDismiss: EventEmitter<void> = new EventEmitter<void>();
}
