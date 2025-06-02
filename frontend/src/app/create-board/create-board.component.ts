import { Component, inject, model } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';
import { ApiService, BoardCreateRequest } from '../services/api.service';

@Component({
  selector: 'app-create-board',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatDialogClose,
  ],
  templateUrl: './create-board.component.html',
  styleUrl: './create-board.component.scss'
})
export class CreateBoardComponent {
  apiService = inject(ApiService);
  projectId = inject<string>(MAT_DIALOG_DATA);

  saveBoard() {
    if (this.form.invalid) {
      return;
    }

    const board = new BoardCreateRequest();
    board.projectId = this.projectId;
    board.name = this.form.value.name || '';
    board.description = this.form.value.description || null;

    this.apiService.createBoard(board).subscribe({
      next: () => {
        this.dismiss(true);
      },
      error: (error) => {
        console.error('Error creating board:', error);
      }
    });
  }
  form = new FormGroup({
    name: new FormControl<string>('', [Validators.required]),
    description: new FormControl<string | null>(null)
  });

  readonly dialogRef = inject(MatDialogRef<CreateBoardComponent>);

  dismiss(complete: boolean = false): void {
    this.dialogRef.close(complete);
  }
}
