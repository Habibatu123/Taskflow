import { Component, inject, model, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { provideNativeDateAdapter } from '@angular/material/core';
import { ApiService, Task, TaskCreateRequest, TaskPriority, TaskStatus, TaskUpdateRequest, User, UserWithRole } from '../services/api.service';
import { MatListModule } from '@angular/material/list';

import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';

export class CreateTaskData {
  boardId: string = '';
  projectUsers: UserWithRole[] = [];
  context: 'create' | 'edit' = 'create';
  task: Task | null = null;
}

@Component({
  selector: 'app-create-task',
  standalone: true,
  imports: [ReactiveFormsModule,
    MatIconModule,
    MatListModule,
    MatDatepickerModule,
    MatInputModule,
    MatFormFieldModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions, MatFormFieldModule, MatSelectModule, MatInputModule, FormsModule
  ],
  providers: [provideNativeDateAdapter()],
  templateUrl: './create-task.component.html',
  styleUrl: './create-task.component.scss'
})
export class CreateTaskComponent implements OnInit {
  apiService = inject(ApiService);
  data = inject<CreateTaskData>(MAT_DIALOG_DATA);
  readonly dialogRef = inject(MatDialogRef<CreateTaskComponent>);

  form = new FormGroup({
    title: new FormControl<string>('', [Validators.required]),
    description: new FormControl<string | null>(null),
    dueDate: new FormControl<Date | null>(null),
    status: new FormControl<TaskStatus | null>(null, [Validators.required]),
    priority: new FormControl<TaskPriority | null>(null, [Validators.required])
  });

  priorities = Object.keys(TaskPriority).filter((key) => isNaN(Number(key)));
  statuses = Object.keys(TaskStatus).filter((key) => isNaN(Number(key)));

  assignedUsers: User[] = [];
  projectUsers = this.data.projectUsers;

  ngOnInit(): void {
    if (this.data.context === 'edit' && this.data.task) {
      this.form.patchValue({
        title: this.data.task.title || '',
        description: this.data.task.description || null,
        dueDate: this.data.task.dueDate || null,
        status: this.data.task.status || TaskStatus.Pending,
        priority: this.data.task.priority || TaskPriority.Low
      });
      this.assignedUsers = this.data.task.assignedTo || [];
    }
  }

  saveTask() {
    if (this.form.invalid) {
      return;
    }

    const task = new TaskCreateRequest();
    task.boardId = this.data.boardId;
    task.title = this.form.value.title || '';
    task.dueDate = this.form.value.dueDate || null;
    task.priority = this.form.value.priority || TaskPriority.Low;
    task.status = this.form.value.status || TaskStatus.Pending;
    task.assignedTo = this.assignedUsers;

    this.apiService.createTask(task).subscribe({
      next: () => {
        this.dismiss(true);
      },
      error: (error) => {
        console.error('Error creating board:', error);
      }
    });
  }

  updateTask() {
    if (this.form.invalid) {
      return;
    }

    const task = new TaskUpdateRequest();
    task.id = this.data.task!.id || '';
    task.title = this.form.value.title || '';
    task.dueDate = this.form.value.dueDate || null;
    task.priority = this.form.value.priority || TaskPriority.Low;
    task.status = this.form.value.status || TaskStatus.Pending;
    task.assignedTo = this.assignedUsers;

    this.apiService.updateTask(task).subscribe({
      next: () => {
        this.dismiss(true);
      },
      error: (error) => {
        console.error('Error creating board:', error);
      }
    });
  }


  dismiss(complete: boolean = false): void {
    this.dialogRef.close(complete);
  }
}
