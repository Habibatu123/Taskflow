import { DatePipe } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ProjectService, Project, ProjectCreateRequest } from '../services/project.service';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatButtonModule } from '@angular/material/button';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { DialogComponent } from "../dialog/dialog.component";
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { AuthService } from '../services/auth.service';
import { MatTableModule } from '@angular/material/table';
import { MatToolbarModule } from '@angular/material/toolbar';

class ProjectModalContext {
  isOpen: boolean = false;
  name = new FormControl<string>('', [Validators.required, Validators.minLength(3)]);
  description = new FormControl<string>('');
  order = new FormControl('0');
}

@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [MatToolbarModule, MatTableModule, MatFormFieldModule, MatInputModule, RouterLink, DatePipe, MatButtonModule, MatDividerModule, MatIconModule, ReactiveFormsModule, DialogComponent],
  templateUrl: './projects.component.html',
  styleUrl: './projects.component.scss'
})
export class ProjectsComponent implements OnInit {
  router = inject(Router);
  authService = inject(AuthService);
  projectService = inject(ProjectService);
  projects: Project[] = [];
  colunns: string[] = ['name', 'createdAt', 'actions'];

  projectModalContext = new ProjectModalContext();

  ngOnInit(): void {
    this.fetchProjects();
  }

  fetchProjects() {
    this.projectService.getProjects().subscribe({
      next: (projects) => {
        this.projects = projects;
      },
      error: (error) => {
        console.error('Error fetching projects:', error);
      }
    });
  }

  deleteProject(project: Project) {
    this.projectService.deleteProjectById(project.id).subscribe({
      next: () => {
        this.projects = this.projects.filter(p => p.id !== project.id);
      },
      error: (error) => {
        console.error('Error deleting project:', error);
      }
    });
  }

  saveProject() {
    const project = new ProjectCreateRequest();
    project.name = this.projectModalContext.name.value || '';
    project.description = this.projectModalContext.description.value || '';
    project.order = Number(this.projectModalContext.order.value) || 0;

    this.projectService.createProject(project).subscribe({
      next: (createdProject) => {
        this.projects.push(createdProject);
        this.projectModalContext.isOpen = false;
        this.projectModalContext.name.reset();
        this.projectModalContext.description.reset();
        this.projectModalContext.order.reset();
      }
      ,
      error: (error) => {
        console.error('Error creating project:', error);
      }
    });
  }

  logout() {
    this.authService.logout().subscribe({
      complete: () => {
        this.router.navigate(['/login']);
      },
      error: (error) => {
        console.error('Error during logout:', error);
      }
    });
  }
}
