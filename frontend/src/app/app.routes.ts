import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { SignupComponent } from './signup/signup.component';
import { ProjectsComponent } from './projects/projects.component';
import { ProjectDetailComponent } from './project-detail/project-detail.component';

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
        component: ProjectsComponent
    },
    {
        path: 'projects/:id',
        component: ProjectDetailComponent
    },
    {
        path: '**',
        component: LoginComponent
    }
];
