import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { PedidoService } from '../../core/services/pedido.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css']
})
export class AdminDashboardComponent implements OnInit {
  public authService = inject(AuthService);
  private pedidoService = inject(PedidoService);
  private toastService = inject(ToastService);
  private fb = inject(FormBuilder);

  activeTab = signal<'pedidos' | 'disputas' | 'usuarios' | 'crear'>('pedidos');
  pedidos = signal<any[]>([]);
  disputas = signal<any[]>([]);
  usuarios = signal<any[]>([]);
  metricas = signal<any>(null);

  cargandoPedidos = signal(true);
  cargandoDisputas = signal(true);
  cargandoUsuarios = signal(true);
  creando = signal(false);
  procesandoEstado = signal<string | null>(null);
  msgCrear = signal('');
  msgOk = signal(false);

  busquedaUsuarios = '';
  rolFiltro = 'todos';

  rolesDisponibles = computed(() => {
    if (this.authService.isSuperAdmin()) {
      return [
        { id: 'superadmin', label: 'Super Admin (Acceso Total y Configuración)' },
        { id: 'admin', label: 'Administrador (Gestión General)' },
        { id: 'moderador', label: 'Moderador (Catálogo y Contenido)' },
        { id: 'soporte', label: 'Soporte al Cliente (Atención y Pedidos)' },
      ];
    }
    // Si es Administrador normal, solo puede crear roles subordinados
    return [
      { id: 'moderador', label: 'Moderador (Catálogo y Contenido)' },
      { id: 'soporte', label: 'Soporte al Cliente (Atención y Pedidos)' },
    ];
  });

  crearAdminForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    nombres: ['', [Validators.required, Validators.minLength(2)]],
    apellidos: ['', [Validators.required, Validators.minLength(2)]],
    telefono: [''],
    rol: ['moderador', Validators.required]
  });

  ngOnInit() {
    // Si es superadmin por defecto sugerimos 'admin', si es admin sugerimos 'moderador'
    const defaultRol = this.authService.isSuperAdmin() ? 'admin' : 'moderador';
    this.crearAdminForm.patchValue({ rol: defaultRol });

    this.cargarMetricas();
    this.cargarPedidos();
    this.cargarDisputas();
    this.cargarUsuarios();
  }

  cargarMetricas() {
    this.pedidoService.getMetricasAdmin().subscribe({
      next: data => this.metricas.set(data),
      error: () => {}
    });
  }

  cargarPedidos() {
    this.cargandoPedidos.set(true);
    this.pedidoService.getTodosLosPedidosAdmin().subscribe({
      next: data => {
        this.pedidos.set(data || []);
        this.cargandoPedidos.set(false);
      },
      error: () => this.cargandoPedidos.set(false)
    });
  }

  cargarDisputas() {
    this.cargandoDisputas.set(true);
    this.pedidoService.getDisputasAdmin().subscribe({
      next: data => {
        this.disputas.set(data || []);
        this.cargandoDisputas.set(false);
      },
      error: () => this.cargandoDisputas.set(false)
    });
  }

  cargarUsuarios() {
    this.cargandoUsuarios.set(true);
    this.authService.listarUsuarios(this.busquedaUsuarios, this.rolFiltro).subscribe({
      next: (res: any) => {
        this.usuarios.set(res.data || []);
        this.cargandoUsuarios.set(false);
      },
      error: () => this.cargandoUsuarios.set(false)
    });
  }

  onFiltrarUsuarios() {
    this.cargarUsuarios();
  }

  puedeGestionarUsuario(target: any): boolean {
    const miId = this.authService.currentUser()?.id;
    if (target.id === miId) return false; // No auto-suspenderse
    if (this.authService.isSuperAdmin()) return true;

    // Admin solo puede gestionar roles subordinados
    const rolTarget = target.rol_principal || 'comprador';
    return !['superadmin', 'admin'].includes(rolTarget);
  }

  toggleEstado(u: any) {
    if (!this.puedeGestionarUsuario(u)) {
      this.toastService.error('No tienes permisos jerárquicos sobre este usuario.');
      return;
    }

    const nuevoEstado = !(u.activo ?? u.esta_activo);
    this.procesandoEstado.set(u.id);

    this.authService.cambiarEstadoUsuario(u.id, nuevoEstado).subscribe({
      next: (res: any) => {
        this.procesandoEstado.set(null);
        if (res.success) {
          this.toastService.success(res.message || `Usuario ${nuevoEstado ? 'activado' : 'suspendido'}`);
          this.cargarUsuarios();
        } else {
          this.toastService.error(res.message || 'Error al actualizar estado.');
        }
      },
      error: (err: any) => {
        this.procesandoEstado.set(null);
        this.toastService.error(err?.error?.message || 'Error al actualizar estado del usuario.');
      }
    });
  }

  crearAdmin() {
    if (this.crearAdminForm.invalid) return;
    this.creando.set(true);
    this.msgCrear.set('');

    const payload = this.crearAdminForm.value as any;

    this.authService.crearAdmin(payload).subscribe({
      next: (res: any) => {
        this.creando.set(false);
        this.msgOk.set(res.success);
        this.msgCrear.set(res.message || (res.success ? 'Usuario creado exitosamente.' : 'Error'));
        if (res.success) {
          this.toastService.success(`Usuario con rol '${payload.rol}' registrado con éxito`);
          const defaultRol = this.authService.isSuperAdmin() ? 'admin' : 'moderador';
          this.crearAdminForm.reset({ rol: defaultRol });
          this.cargarUsuarios();
          this.cargarMetricas();
        }
      },
      error: (err: any) => {
        this.creando.set(false);
        this.msgOk.set(false);
        this.msgCrear.set(err?.error?.message || 'Error al crear usuario administrativo.');
        this.toastService.error(err?.error?.message || 'Error al registrar personal');
      }
    });
  }
}
