import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const toastService = inject(ToastService);
  const token = localStorage.getItem('camifut_token');

  let requestToForward = req;
  if (token) {
    requestToForward = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(requestToForward).pipe(
    catchError((error: HttpErrorResponse) => {
      // Si la petición devuelve 401 (No autorizado / Token expirado) o 403 (Prohibido)
      // Excluir la propia ruta de login para no interferir con mensajes de error de contraseña incorrecta
      if ((error.status === 401 || error.status === 403) && !req.url.includes('/api/auth/login')) {
        authService.limpiarSesion();
        authService.abrirModal('login');
        toastService.info('Tu sesión ha expirado o requiere autorización. Inicia sesión para continuar.');
      }
      return throwError(() => error);
    })
  );
};
