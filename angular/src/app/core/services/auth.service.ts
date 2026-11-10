import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { AuthResponse, CredencialesLogin, RegistroDTO, UsuarioSesion, RolesSesion, AuthData } from '../models/auth.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/api/auth';

  private readonly STORAGE_AUTH = 'camifut_auth_data';
  private readonly STORAGE_TOKEN = 'camifut_token';

  // Signals reactivos para el estado de autenticación
  public currentUser = signal<UsuarioSesion | null>(null);
  public currentRoles = signal<RolesSesion | null>(null);
  public token = signal<string | null>(null);
  public modalAbierto = signal<boolean>(false);
  public tabModal = signal<'login' | 'registro'>('login');
  public cargando = signal<boolean>(false);

  // Computados de roles y jerarquía
  public isLoggedIn = computed(() => !!this.currentUser());
  public isAdmin = computed(() => !!this.currentRoles()?.es_admin || this.currentRoles()?.rol_principal === 'superadmin' || this.currentRoles()?.rol_principal === 'admin');
  public isSuperAdmin = computed(() => this.currentRoles()?.rol_principal === 'superadmin' || !!this.currentRoles()?.roles_administrativos?.includes('superadmin'));
  public isModerador = computed(() => this.currentRoles()?.rol_principal === 'moderador' || !!this.currentRoles()?.roles_administrativos?.includes('moderador'));
  public isSoporte = computed(() => this.currentRoles()?.rol_principal === 'soporte' || !!this.currentRoles()?.roles_administrativos?.includes('soporte'));
  public isStaff = computed(() => this.isAdmin() || this.isSuperAdmin() || this.isModerador() || this.isSoporte());
  public isVendedor = computed(() => !!this.currentRoles()?.es_vendedor);
  public esAdmin = this.isAdmin;
  public esVendedor = this.isVendedor;
  public rolPrincipal = computed(() => this.currentRoles()?.rol_principal || 'invitado');
  public nombreCompleto = computed(() => {
    const u = this.currentUser();
    return u ? `${u.nombres} ${u.apellidos}` : 'Invitado';
  });
  public nombreTienda = computed(() => this.currentRoles()?.tienda?.nombre_tienda || '');
  public vendedorId = computed(() => this.currentRoles()?.tienda?.id || null);

  constructor() {
    this.restaurarSesion();
  }

  private restaurarSesion(): void {
    try {
      const savedAuth = localStorage.getItem(this.STORAGE_AUTH);
      const savedToken = localStorage.getItem(this.STORAGE_TOKEN);
      if (savedAuth && savedToken) {
        const parsed: AuthData = JSON.parse(savedAuth);
        this.currentUser.set(parsed.usuario);
        this.currentRoles.set(parsed.roles);
        this.token.set(savedToken);
      }
    } catch (e) {
      console.error('Error restaurando sesion:', e);
      this.limpiarSesion();
    }
  }

  public abrirModal(tab: 'login' | 'registro' = 'login'): void {
    this.tabModal.set(tab);
    this.modalAbierto.set(true);
  }

  public cerrarModal(): void {
    this.modalAbierto.set(false);
  }

  public login(credenciales: CredencialesLogin): Observable<AuthResponse> {
    this.cargando.set(true);
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, credenciales).pipe(
      tap((resp) => {
        this.cargando.set(false);
        if (resp.success && resp.data) {
          this.guardarSesion(resp.data);
          this.cerrarModal();
        }
      }),
      catchError((err) => {
        this.cargando.set(false);
        return throwError(() => err.error?.message || 'Error al conectar con el servidor.');
      })
    );
  }

  public registro(datos: RegistroDTO): Observable<AuthResponse> {
    this.cargando.set(true);
    return this.http.post<AuthResponse>(`${this.apiUrl}/registro`, datos).pipe(
      tap(() => {
        this.cargando.set(false);
      }),
      catchError((err) => {
        this.cargando.set(false);
        return throwError(() => err.error?.message || 'Error al registrar el usuario.');
      })
    );
  }

  public guardarSesion(data: AuthData): void {
    this.currentUser.set(data.usuario);
    this.currentRoles.set(data.roles);
    this.token.set(data.token);
    localStorage.setItem(this.STORAGE_AUTH, JSON.stringify(data));
    localStorage.setItem(this.STORAGE_TOKEN, data.token);
  }

  public logout(): void {
    this.limpiarSesion();
  }

  public limpiarSesion(): void {
    this.currentUser.set(null);
    this.currentRoles.set(null);
    this.token.set(null);
    localStorage.removeItem(this.STORAGE_AUTH);
    localStorage.removeItem(this.STORAGE_TOKEN);
  }

  public crearAdmin(datos: { email: string; password: string; nombres: string; apellidos: string; telefono?: string; rol?: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/crear-admin`, datos);
  }

  public listarUsuarios(busqueda?: string, rol?: string): Observable<any> {
    let params = new HttpParams();
    if (busqueda && busqueda.trim()) params = params.set('busqueda', busqueda.trim());
    if (rol && rol !== 'todos') params = params.set('rol', rol);
    return this.http.get(`${this.apiUrl}/usuarios`, { params });
  }

  public cambiarEstadoUsuario(usuarioId: string, activo: boolean): Observable<any> {
    return this.http.post(`${this.apiUrl}/cambiar-estado`, { usuario_id: usuarioId, activo });
  }
}
