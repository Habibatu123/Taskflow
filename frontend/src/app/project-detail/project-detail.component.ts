import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule, DatePipe } from '@angular/common';
import { CdkDrag, CdkDragDrop, CdkDropList, moveItemInArray } from '@angular/cdk/drag-drop';
import { FormsModule } from '@angular/forms';
import { Task, ProjectService, Project, Board } from '../services/project.service';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';

class ModalContext {
  open: 'board' | 'task' | null = null;
  task: Task | null = null;
  board: Board | null = null;
}

@Component({
  selector: 'app-project-detail',
  standalone: true,
  imports: [MatToolbarModule, MatButtonModule, MatIconModule, DatePipe, CommonModule, CdkDrag, CdkDropList, FormsModule],
  templateUrl: './project-detail.component.html',
  styleUrl: './project-detail.component.scss'
})
export class ProjectDetailComponent implements OnInit {
fetchBoards() {
throw new Error('Method not implemented.');
}
logout() {
throw new Error('Method not implemented.');
}
  router = inject(Router);
  route = inject(ActivatedRoute);
  projectService = inject(ProjectService);

  project: Project | undefined | null = undefined;
  modalContext = new ModalContext();

  ngOnInit(): void {
    const projectId = Number(this.route.snapshot.paramMap.get('id'));
    if (!projectId) {
      console.error('Project ID is not provided in the route.');
      this.router.navigate(['/projects']);
      return;
    }

    this.projectService.getProjectById(projectId).subscribe({
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

  selectTask(task: Task): void {
    this.modalContext.task = JSON.parse(JSON.stringify(task));
    this.modalContext.open = 'task';
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
      task.order = index + 1; // Assuming order starts from 1
    });
  }
}
