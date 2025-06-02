import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule, DatePipe } from '@angular/common';
import { CdkDrag, CdkDragDrop, CdkDropList, moveItemInArray } from '@angular/cdk/drag-drop';
import { Task, ApiService, Project, Board, BoardCreateRequest, TaskCreateRequest, TaskStatus } from '../services/api.service';
import { FormsModule } from '@angular/forms';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { DialogComponent } from "../dialog/dialog.component";
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatDialog } from '@angular/material/dialog';
import { CreateBoardComponent } from '../create-board/create-board.component';
import { CreateTaskComponent, CreateTaskData } from '../create-task/create-task.component';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatRippleModule } from '@angular/material/core';

@Component({
  selector: 'app-project-detail',
  standalone: true,
  imports: [
    MatFormFieldModule, MatInputModule, MatSelectModule, MatDividerModule, MatRippleModule,
    MatToolbarModule, MatCardModule, MatListModule, MatGridListModule, MatCheckboxModule,
    MatButtonModule, MatIconModule, DatePipe, CommonModule, CdkDrag, CdkDropList, FormsModule, DialogComponent],
  templateUrl: './project-detail.component.html',
  styleUrl: './project-detail.component.scss'
})
export class ProjectDetailComponent implements OnInit {
  editTask(_t50: Task) {
    throw new Error('Method not implemented.');
  }
  deleteTask(_t50: Task) {
    throw new Error('Method not implemented.');
  }
  router = inject(Router);
  route = inject(ActivatedRoute);
  apiService = inject(ApiService);
  readonly dialog = inject(MatDialog);

  statuses = TaskStatus;
  projectId: string | null = null;
  project: Project | null = null;

  ngOnInit(): void {
    this.projectId = this.route.snapshot.paramMap.get('id');
    if (!this.projectId) {
      console.error('Project ID is not provided in the route.');
      this.router.navigate(['/projects']);
      return;
    }

    this.fetchBoards();
  }

  navigateAway() {
    this.router.navigate(['/projects']);
  }

  selectTask(boardId: string, task: Task): void {
    this.openCreateTaskDialog(boardId, task);
  }

  saveTask() {
    throw new Error('Method not implemented.');
  }

  sortTasksByOrder(tasks: Task[]): Task[] {
    return tasks.slice().sort((a, b) => a.order - b.order);
  }

  taskDrop(event: CdkDragDrop<Task[]>, board: Board): void {
    moveItemInArray(board.tasks, event.previousIndex, event.currentIndex);
    board.tasks.forEach((task, index) => {
      task.order = index + 1;
    });
  }

  boardDrop(event: CdkDragDrop<Board[]>) {
    if (!this.project) {
      return;
    }

    moveItemInArray(this.project.boards, event.previousIndex, event.currentIndex);
    this.project.boards.forEach((board, index) => {
      board.order = index + 1;
    });
  }

  openCreateBoardDialog() {
    const dialogRef = this.dialog.open(CreateBoardComponent, {
      data: this.projectId,
    });

    dialogRef.afterClosed().subscribe({
      next: (result: boolean) => {
        if (result) {
          this.fetchBoards();
        }
      }
    });
  }

  openCreateTaskDialog(boardId: string, task?: Task) {
    const data = new CreateTaskData();
    data.boardId = boardId;
    data.projectUsers = this.project?.users || [];
    data.context = task ? 'edit' : 'create';
    data.task = task || null;

    const dialogRef = this.dialog.open(CreateTaskComponent, {
      data: data,
    });

    dialogRef.afterClosed().subscribe({
      next: (result: boolean) => {
        if (result) {
          this.fetchBoards();
        }
      }
    });
  }

  deleteBoard(board: Board) {
    this.apiService.deleteBoardById(board.id).subscribe({
      next: () => {
        this.fetchBoards();
      },
      error: (error) => {
        console.error('Error deleting project:', error);
      }
    });
  }

  fetchBoards() {
    if (!this.projectId) {
      console.error('Project ID is not defined.');
      this.router.navigate(['/projects']);
      return;
    }

    this.apiService.getProjectById(this.projectId).subscribe({
      next: (project) => {
        this.project = project;
        // this.selectTask(project.boards[0].tasks[0]);
      },
      error: (error) => {
        console.error('Error fetching project:', error);
        this.router.navigate(['/projects']);
      }
    });
  }

  logout() {
    throw new Error('Method not implemented.');
  }
}
