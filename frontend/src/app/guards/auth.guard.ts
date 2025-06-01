import { inject } from "@angular/core";
import { CanActivateFn, Router } from "@angular/router";
import { Observable, take, map } from "rxjs";
import { AuthService } from "../services/auth.service";

export const authGuardFn: CanActivateFn = (): Observable<boolean | ReturnType<Router['createUrlTree']>> => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.currentUser$.pipe(
    take(1),
    map(user => {
      if (user) {
        return true;
      }
      return router.createUrlTree(['/login']);
    })
  );
};