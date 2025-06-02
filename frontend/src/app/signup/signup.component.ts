import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService, SignupCredential } from '../services/auth.service';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule],
  templateUrl: './signup.component.html',
  styleUrl: './signup.component.scss'
})
export class SignupComponent {
  router = inject(Router);
  authService = inject(AuthService);

  isLoading = false;
  errorMessage = '';

  form = new FormGroup({
    fullname: new FormControl('', [Validators.required, Validators.minLength(6)]),
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required])
  });

  signup() {
    if (this.form.valid && !this.isLoading) {
      this.isLoading = true;
      this.errorMessage = '';

      const signup = new SignupCredential();
      signup.email = this.form.value.email || '';
      signup.password = this.form.value.password || '';
      signup.name = this.form.value.fullname || '';

      this.authService.signup(signup).subscribe({
        next: () => {
          this.router.navigate(['/login']);
        },
        error: (error) => {
          this.isLoading = false;
          this.errorMessage = error.error?.message || 'An error occurred during signup';
        }
      });
    }
  }
}
