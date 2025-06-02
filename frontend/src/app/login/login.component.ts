import { Component, inject } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService, LoginCredential } from '../services/auth.service';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  router = inject(Router);
  authService = inject(AuthService)

  isLoading = false;
  errorMessage = '';
  form = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required])
  });

  login(): void {
    if (this.form.valid && !this.isLoading) {
      this.isLoading = true;
      this.errorMessage = '';

      const login = new LoginCredential();
      login.email = this.form.value.email || '';
      login.password = this.form.value.password || '';

      this.authService.login(login).subscribe({
        next: () => {
          this.router.navigate(['/projects']);
        },
        error: (error) => {
          this.isLoading = false;
          this.errorMessage = error.error?.message || 'An error occurred during login';
        }
      });
    }
  }
}
