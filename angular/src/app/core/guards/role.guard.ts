import { inject } from "@angular/core";
import { CanActivateFn, Router } from "@angular/router";
import { AuthService } from "../services/auth.service";

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.isLoggedIn()) {
    return true;
  }
  auth.abrirModal("login");
  return router.createUrlTree(["/catalogo"]);
};

export const adminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.isLoggedIn() && auth.isAdmin()) {
    return true;
  }
  if (!auth.isLoggedIn()) {
    auth.abrirModal("login");
  }
  return router.createUrlTree(["/catalogo"]);
};

export const vendedorGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.isLoggedIn() && auth.isVendedor()) {
    return true;
  }
  if (!auth.isLoggedIn()) {
    auth.abrirModal("login");
  }
  return router.createUrlTree(["/catalogo"]);
};