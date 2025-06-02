import { ActivatedRouteSnapshot, CanActivateFn, Router, RouterStateSnapshot, Routes } from '@angular/router';
import { SignupComponent } from './signup/signup.component';
import { ProjectsComponent } from './projects/projects.component';
import { ProjectDetailComponent } from './project-detail/project-detail.component';
import { LoginComponent } from './login/login.component';
import { inject } from '@angular/core';

export const authGuard: CanActivateFn = (
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
) => {
    const router = inject(Router);
    if (localStorage.getItem('accessToken')) {
        return true;
    }

    return router.parseUrl('/login');
}

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
        canActivate: [authGuard]
    },
    {
        path: 'projects/:id',
        component: ProjectDetailComponent,
        canActivate: [authGuard]
    },
    {
        path: '**',
        component: LoginComponent
    }
];
