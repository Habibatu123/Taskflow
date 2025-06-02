import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../environments/environment';


export enum UserRole {
  Admin,
  Manager,
  Employee
}

export enum TaskPriority {
  Low,
  Medium,
  High
}

export enum TaskStatus {
  Pending = 'Pending',
  InProgress = 'InProgress',
  Completed = 'Completed'
}

export class User {
  id: string = '';
  name: string = '';
  email: string = '';
}

export class UserWithRole {
  id: string = '';
  name: string = '';
  email: string = '';
  role: UserRole = UserRole.Employee;
}

export class Task {
  id: string = '';
  order: number = 0;
  title: string = '';
  description: string = '';
  priority: TaskPriority = TaskPriority.Low;
  status: TaskStatus = TaskStatus.Pending;
  dueDate: Date | null = null;
  createdAt: Date = new Date();
  assignedTo: User[] = [];
}

export class Board {
  id: string = '';
  order: number = 0;
  name: string = '';
  description: string = '';
  createdAt: Date = new Date();
  tasks: Task[] = [];
}

export class Project {
  id: string = '';
  name: string = '';
  description: string = '';
  createdAt: Date = new Date('2023-01-01');
  boards: Board[] = [];
  users: UserWithRole[] = [];
}

export class ProjectCreateRequest {
  name: string = '';
  description: string = '';
}

export class BoardCreateRequest {
  projectId: string = '';
  name: string = '';
  description: string | null = null;
}

export class TaskCreateRequest {
  boardId: string = '';
  title: string = '';
  dueDate: Date | null = null;
  status: TaskStatus = TaskStatus.Pending;
  priority: TaskPriority = TaskPriority.Low;
  assignedTo: User[] = [];
}

export class TaskUpdateRequest {
  id: string = '';
  title: string = '';
  dueDate: Date | null = null;
  status: TaskStatus = TaskStatus.Pending;
  priority: TaskPriority = TaskPriority.Low;
  assignedTo: User[] = [];
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  http = inject(HttpClient);

  getProjects(): Observable<Project[]> {
    return this.http.get<Project[]>(environment.apiUrl + '/projects');
  }

  getProjectById(id: string): Observable<Project> {
    return this.http.get<Project>(environment.apiUrl + '/projects' + `/${id}`);
  }

  createProject(project: ProjectCreateRequest): Observable<Project> {
    return this.http.post<Project>(environment.apiUrl + '/projects', project);
  }

  createBoard(board: BoardCreateRequest): Observable<void> {
    return this.http.post<void>(`${environment.apiUrl}/boards`, board);
  }

  createTask(task: TaskCreateRequest): Observable<void> {
    return this.http.post<void>(`${environment.apiUrl}/tasks`, task);
  }

  updateTask(task: TaskUpdateRequest): Observable<void> {
    return this.http.put<void>(`${environment.apiUrl}/tasks`, task);
  }

  deleteProjectById(id: string): Observable<void> {
    return this.http.delete<void>(environment.apiUrl + '/projects' + `/${id}`);
  }

  deleteBoardById(id: string): Observable<void> {
    return this.http.delete<void>(environment.apiUrl + '/boards' + `/${id}`);
  }

  deleteTaskById(id: string): Observable<void> {
    return this.http.delete<void>(environment.apiUrl + '/tasks' + `/${id}`);
  }
}
