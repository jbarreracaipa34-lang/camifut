import { Injectable, inject } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable, catchError, map, of } from "rxjs";
import { Pedido } from "../models/pedido.model";
import { AuthService } from "./auth.service";

@Injectable({ providedIn: "root" })
export class PedidoService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private apiUrl = "http://localhost:3000/api/pedidos";

  getMisPedidos(): Observable<Pedido[]> {
    return this.http.get<any>(`${this.apiUrl}/comprador/mis`).pipe(
      map(res => res.data || []),
      catchError(() => of([]))
    );
  }

  getPedidosPorComprador(compradorId: string): Observable<Pedido[]> {
    return this.http.get<any>(`${this.apiUrl}/comprador/${compradorId}`).pipe(
      map(res => res.data || []),
      catchError(() => of([]))
    );
  }

  getVentasVendedor(vendedorId: string): Observable<any[]> {
    return this.http.get<any>(`${this.apiUrl}/vendedor/${vendedorId}`).pipe(
      map(res => res.data || []),
      catchError(() => of([]))
    );
  }

  getTodosLosPedidosAdmin(): Observable<any[]> {
    return this.http.get<any>(`${this.apiUrl}/admin/todos`).pipe(
      map(res => res.data || []),
      catchError(() => of([]))
    );
  }

  getMetricasAdmin(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/admin/metricas`).pipe(
      map(res => res.data || null),
      catchError(() => of(null))
    );
  }

  getDisputasAdmin(): Observable<any[]> {
    return this.http.get<any>(`${this.apiUrl}/admin/disputas`).pipe(
      map(res => res.data || []),
      catchError(() => of([]))
    );
  }

  checkout(datosEnvio?: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/checkout`, datosEnvio || {});
  }

  actualizarEstadoSubpedido(subpedidoId: string, nuevoEstado: string, comentario?: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/subpedido/${subpedidoId}/estado`, { estado: nuevoEstado, comentario });
  }
}
