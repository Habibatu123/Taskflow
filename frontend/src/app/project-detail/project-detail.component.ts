import { Component, inject, OnInit } from '@angular/core';
import { Board, Project, ProjectService, Task } from '../project.service';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule, DatePipe } from '@angular/common';
import { CdkDrag, CdkDragDrop, CdkDropList, moveItemInArray } from '@angular/cdk/drag-drop';
import { FormsModule } from '@angular/forms';

class TaskModalContext {
  isOpen: boolean = false;
  task: Task | null = null;
}

@Component({
  selector: 'app-project-detail',
  standalone: true,
  imports: [DatePipe, CommonModule, CdkDrag, CdkDropList, FormsModule],
  templateUrl: './project-detail.component.html',
  styleUrl: './project-detail.component.scss'
})
export class ProjectDetailComponent implements OnInit {
  router = inject(Router);
  route = inject(ActivatedRoute);
  projectService = inject(ProjectService);

  project: Project | undefined | null = undefined;
  taskModalContext: TaskModalContext = new TaskModalContext();

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
        this.selectTask(project.boards[0].tasks[0]);
      },
      error: (error) => {
        console.error('Error fetching project:', error);
        this.router.navigate(['/projects']);
      }
    });

  }

  selectTask(task: Task): void {
    this.taskModalContext.task = JSON.parse(JSON.stringify(task));
    this.taskModalContext.isOpen = true;
  }

  sortTasksByOrder(tasks: Task[]): Task[] {
    return tasks.slice().sort((a, b) => a.order - b.order);
  }

  taskDrop(event: CdkDragDrop<Task[]>, board: Board): void {
    moveItemInArray(board.tasks, event.previousIndex, event.currentIndex);
    // Update the order of tasks after reordering
    board.tasks.forEach((task, index) => {
      task.order = index + 1; // Assuming order starts from 1
    });
  }
}
