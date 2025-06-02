import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { User } from './api.service';

export class LoginCredential {
  email: string = '';
  password: string = '';
}

export class AuthResponse {
  token: string = '';
}

export class SignupCredential {
  name: string = '';
  email: string = '';
  password: string = '';
}


@Injectable({
  providedIn: 'root'
})
export class AuthService {
  http = inject(HttpClient);
  private currentUserSubject = new BehaviorSubject<User | null>(null);


  login(cred: LoginCredential): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/login`, cred)
      .pipe(tap(response => {
        localStorage.setItem('accessToken', response.token);
        // this.currentUserSubject.next(response.user);
      }));
  }

  signup(cred: SignupCredential): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/register`, cred);
  }

  logout(): Observable<void> {
    localStorage.removeItem('accessToken');
    this.currentUserSubject.next(null);
    return of();
  }
} 