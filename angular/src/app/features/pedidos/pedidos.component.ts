import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { PedidoService } from '../../core/services/pedido.service';
import { Pedido } from '../../core/models/pedido.model';

@Component({
  selector: 'app-pedidos',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './pedidos.component.html',
  styleUrls: ['./pedidos.component.css']
})
export class PedidosComponent implements OnInit {
  private pedidoService = inject(PedidoService);
  public authService = inject(AuthService);
  pedidos = signal<Pedido[]>([]);
  cargando = signal(true);

  ngOnInit() {
    if (!this.authService.isLoggedIn()) {
      this.cargando.set(false);
      return;
    }
    const compradorId = this.authService.currentUser()?.id!;
    this.pedidoService.getPedidosPorComprador(compradorId).subscribe({
      next: data => {
        this.pedidos.set(data || []);
        this.cargando.set(false);
      },
      error: () => {
        this.cargando.set(false);
      }
    });
  }

  getStepIndex(estado: string | undefined): number {
    switch (estado?.toLowerCase()) {
      case 'entregado': return 4;
      case 'en_camino': return 3;
      case 'pendiente_despacho':
      case 'pagado': return 2;
      case 'pendiente_pago':
      case 'creado':
      default: return 1;
    }
  }

  formatEstado(estado: string | undefined): string {
    if (!estado) return 'CREADO';
    return estado.replace(/_/g, ' ').toUpperCase();
  }
}

