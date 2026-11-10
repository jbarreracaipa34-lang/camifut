import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { PedidoService } from '../../core/services/pedido.service';
import { PublicacionService } from '../../core/services/publicacion.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-vendedor-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './vendedor-dashboard.component.html',
  styleUrls: ['./vendedor-dashboard.component.css']
})
export class VendedorDashboardComponent implements OnInit {
  public authService = inject(AuthService);
  private pedidoService = inject(PedidoService);
  private publicacionService = inject(PublicacionService);
  private toastService = inject(ToastService);
  private router = inject(Router);

  activeTab = signal<'ordenes' | 'publicaciones'>('ordenes');
  ventas = signal<any[]>([]);
  publicaciones = signal<any[]>([]);
  cargandoVentas = signal(true);
  cargandoPubs = signal(false);
  procesando = signal<string | null>(null);

  modalEdicionAbierto = signal(false);
  publicacionAEditar: any = null;
  guardandoEdicion = signal(false);
  publicacionAEliminar: any = null;
  eliminandoPub = signal(false);

  pendienteDespacho = computed(() => this.ventas().filter(v => v.estado === 'pendiente_despacho').length);
  totalGanado = computed(() => this.ventas().reduce((acc, v) => acc + Number(v.pago_neto_vendedor || 0), 0));
  totalComisiones = computed(() => this.ventas().reduce((acc, v) => acc + Number(v.monto_comision_plataforma || 0), 0));

  fmt(val: any): string {
    const num = Number(val || 0);
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(num);
  }

  ngOnInit() {
    this.cargarVentas();
    this.cargarPublicaciones();
  }

  cargarVentas() {
    const vendedorId = this.authService.vendedorId() || this.authService.currentUser()?.id || '';
    this.cargandoVentas.set(true);
    this.pedidoService.getVentasVendedor(vendedorId).subscribe({
      next: data => { this.ventas.set(data || []); this.cargandoVentas.set(false); },
      error: () => { this.cargandoVentas.set(false); }
    });
  }

  cargarPublicaciones() {
    const vendedorId = this.authService.vendedorId() || this.authService.currentUser()?.id || '';
    this.cargandoPubs.set(true);
    this.publicacionService.getPublicaciones('todas', vendedorId).subscribe({
      next: data => { this.publicaciones.set(data || []); this.cargandoPubs.set(false); },
      error: () => { this.cargandoPubs.set(false); }
    });
  }

  abrirModalEdicion(pub: any) {
    this.router.navigate(['/publicar', pub.id]);
    return;
    const primeraVariante = pub.variantes && pub.variantes.length > 0 ? { ...pub.variantes[0] } : null;
    this.publicacionAEditar = {
      ...pub,
      varianteEditable: primeraVariante
    };
    this.modalEdicionAbierto.set(true);
  }

  cerrarModalEdicion() {
    this.modalEdicionAbierto.set(false);
    this.publicacionAEditar = null;
  }

  guardarCambiosPublicacion() {
    if (!this.publicacionAEditar) return;
    this.guardandoEdicion.set(true);

    const payloadPub = {
      titulo: this.publicacionAEditar.titulo,
      descripcion: this.publicacionAEditar.descripcion,
      estado: this.publicacionAEditar.estado,
      ciudad_entrega_persona: this.publicacionAEditar.ciudad_entrega_persona || null
    };

    this.publicacionService.actualizarPublicacion(this.publicacionAEditar.id, payloadPub).subscribe({
      next: () => {
        if (this.publicacionAEditar.varianteEditable?.id) {
          const payloadVar = {
            precio: Number(this.publicacionAEditar.varianteEditable.precio),
            stock: Number(this.publicacionAEditar.varianteEditable.stock)
          };
          this.publicacionService.actualizarVariante(this.publicacionAEditar.varianteEditable.id, payloadVar).subscribe({
            next: () => {
              this.guardandoEdicion.set(false);
              this.cerrarModalEdicion();
              this.toastService.success('¡Precios, stock y publicación actualizados exitosamente!');
              this.cargarPublicaciones();
            },
            error: () => {
              this.guardandoEdicion.set(false);
              this.cerrarModalEdicion();
              this.toastService.info('Publicación actualizada.');
              this.cargarPublicaciones();
            }
          });
        } else {
          this.guardandoEdicion.set(false);
          this.cerrarModalEdicion();
          this.toastService.success('¡Publicación actualizada exitosamente!');
          this.cargarPublicaciones();
        }
      },
      error: (err) => {
        this.guardandoEdicion.set(false);
        this.toastService.error(err?.error?.message || 'Error al actualizar la publicación.');
      }
    });
  }

  confirmarEliminar(pub: any) {
    this.publicacionAEliminar = pub;
  }

  ejecutarEliminacion() {
    if (!this.publicacionAEliminar) return;
    this.eliminandoPub.set(true);

    this.publicacionService.eliminarPublicacion(this.publicacionAEliminar.id).subscribe({
      next: () => {
        this.eliminandoPub.set(false);
        const nom = this.publicacionAEliminar.titulo;
        this.publicacionAEliminar = null;
        this.toastService.info(`Publicación "${nom}" eliminada del catálogo.`);
        this.cargarPublicaciones();
      },
      error: (err) => {
        this.eliminandoPub.set(false);
        this.toastService.error(err?.error?.message || 'Error al eliminar la publicación.');
      }
    });
  }

  actualizarEstado(subpedidoId: string, nuevoEstado: string) {
    this.procesando.set(subpedidoId);
    this.pedidoService.actualizarEstadoSubpedido(subpedidoId, nuevoEstado).subscribe({
      next: () => {
        this.procesando.set(null);
        this.toastService.success(`Estado de orden actualizado a: ${nuevoEstado.replace('_', ' ').toUpperCase()}`);
        this.cargarVentas();
      },
      error: (err) => {
        this.procesando.set(null);
        this.toastService.error(err?.error?.message || 'Error al actualizar estado del pedido.');
      }
    });
  }
}



