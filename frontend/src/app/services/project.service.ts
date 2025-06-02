import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { environment } from '../../environments/environment';

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
  tasks: Task[] = [];
}

export class Project {
  id: number = 0;
  name: string = '';
  description: string = '';
  createdAt: Date = new Date('2023-01-01');
  boards: Board[] = [];
}

export class ProjectCreateRequest {
  name: string = '';
  description: string = '';
  order: number = 0;
}

@Injectable({
  providedIn: 'root'
})
export class ProjectService {
  http = inject(HttpClient);

  getProjects(): Observable<Project[]> {
    return this.http.get<Project[]>(environment.apiUrl + '/projects');
  }

  getProjectById(id: number): Observable<Project> {
    return this.http.get<Project>(environment.apiUrl + '/projects' + `/${id}`);
  }

  deleteProjectById(id: number): Observable<void> {
    return this.http.delete<void>(environment.apiUrl + '/projects' + `/${id}`);
  }

  createProject(project: ProjectCreateRequest): Observable<Project> {
    return this.http.post<Project>(environment.apiUrl + '/projects', project);
  }


}
