import { DatePipe } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Project, ProjectService } from '../project.service';


@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [RouterLink, DatePipe],
  templateUrl: './projects.component.html',
  styleUrl: './projects.component.scss'
})
export class ProjectsComponent implements OnInit {
  projectService = inject(ProjectService);
  projects: Project[] = [];

  ngOnInit(): void {
    this.projectService.getProjects().subscribe({
      next: (projects) => {
        this.projects = projects;
      },
      error: (error) => {
        console.error('Error fetching projects:', error);
      }
    });
  }
}
