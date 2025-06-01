import { Routes } from '@angular/router';
import { SignupComponent } from './signup/signup.component';
import { ProjectsComponent } from './projects/projects.component';
import { ProjectDetailComponent } from './project-detail/project-detail.component';
import { authGuardFn } from './guards/auth.guard';
import { LoginComponent } from './login/login.component';

export const routes: Routes = [
    {
        path: 'login',
        component: LoginComponent
    },
    {
        path: 'signup',
        component: SignupComponent
    },
    {
        path: 'projects',
        component: ProjectsComponent,
        canActivate: [authGuardFn]
    },
    {
        path: 'projects/:id',
        component: ProjectDetailComponent,
        canActivate: [authGuardFn]
    },
    {
        path: '**',
        component: LoginComponent
    }
];
