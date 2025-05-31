import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';

export class Task {
  id: number = 0;
  name: string = '';
  description: string = '';
  priority: 'low' | 'medium' | 'high' = 'low';
  dueDate: Date | null = null;
  order: number = 0;
  status: 'pending' | 'in-progress' | 'completed' = 'pending';
  createdAt: Date = new Date();
  updatedAt: Date = new Date();
}

export class Board {
  id: number = 0;
  name: string = '';
  description: string = '';
  createdAt: Date = new Date();
  updatedAt: Date = new Date();
  tasks: Task[] = [];
}

export class Project {
  id: number = 0;
  name: string = '';
  description: string = '';
  status: 'active' | 'inactive' = 'active';
  createdAt: Date = new Date('2023-01-01');
  updatedAt: Date = new Date('2023-01-10');
  boards: Board[] = [];
}

export class ProjectCreateRequest {
  name: string = '';
  description: string = '';
  status: 'active' | 'inactive' = 'active';
}

@Injectable({
  providedIn: 'root'
})
export class ProjectService {
  projects: Project[] = [
    {
      id: 1,
      name: 'Web3 Design System',
      description: 'This is the first project.',
      status: 'active',
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-01-10'),
      boards: [
        {
          id: 1,
          name: 'Todo',
          description: 'This is the first board of Project Alpha.',
          createdAt: new Date('2023-01-02'),
          updatedAt: new Date('2023-01-05'),
          tasks: [
            {
              id: 1,
              name: 'Create an AI file in adobe illustrator for the project',
              description: 'This is the first task of Project Alpha.',
              priority: 'high',
              dueDate: new Date('2023-01-15'),
              order: 2,
              status: 'completed',
              createdAt: new Date('2023-01-02'),
              updatedAt: new Date('2023-01-05')
            },
            {
              id: 2,
              name: 'Task 2',
              description: 'This is the second task of Project Alpha.',
              status: 'pending',
              dueDate: null,
              priority: 'medium',
              order: 1,
              createdAt: new Date('2023-01-03'),
              updatedAt: new Date('2023-01-06')
            }
          ]
        },
        {
          id: 2,
          name: 'In Progress',
          description: 'This is the second board of Project Alpha.',
          createdAt: new Date('2023-01-03'),
          updatedAt: new Date('2023-01-06'),
          tasks: []
        }
      ]
    }
  ];

  getProjects(): Observable<Project[]> {
    return of(this.projects);
  }

  getProjectById(id: number): Observable<Project> {
    const project = this.projects.find(p => p.id === id);
    if (!project) {
      return throwError(() => new Error(`Project with ID ${id} not found`));
    }

    return of(project);
  }

  createProject(project: ProjectCreateRequest): Observable<Project> {
    const newProject = new Project();

    newProject.id = this.projects.length + 1;
    newProject.name = project.name;
    newProject.description = project.description;
    newProject.status = project.status;
    newProject.createdAt = new Date();
    newProject.updatedAt = new Date();

    this.projects.push(newProject);

    return of(newProject);
  }
}
