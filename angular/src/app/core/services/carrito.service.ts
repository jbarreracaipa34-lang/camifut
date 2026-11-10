import { Injectable, inject, signal } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable, tap, catchError, of } from "rxjs";
import { AuthService } from "./auth.service";
import { ToastService } from "./toast.service";

@Injectable({ providedIn: "root" })
export class CarritoService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private apiUrl = "http://localhost:3000/api/carrito";

  public items = signal<any[]>([]);
  public totalItems = signal<number>(0);
  public subtotalEstimado = signal<number>(0);
  public cargando = signal<boolean>(false);

  private get usuarioId(): string | null {
    return this.authService.currentUser()?.id || null;
  }

  constructor() {
    this.cargarCarrito();
  }

  public cargarCarrito(): void {
    const uid = this.usuarioId;
    if (!uid) {
      this.items.set([]);
      this.totalItems.set(0);
      this.subtotalEstimado.set(0);
      return;
    }
    this.cargando.set(true);
    this.http.get<any>(`${this.apiUrl}/${uid}`).pipe(
      catchError(() => of({ data: { carrito_id: "", usuario_id: uid, items: [], total_items: 0, subtotal_estimado: 0 } }))
    ).subscribe(resp => {
      const data = resp?.data || resp || {};
      const itemsList: any[] = data.items || [];
      this.items.set(itemsList);
      this.totalItems.set(itemsList.reduce((a, i) => a + (Number(i.cantidad) || 1), 0));
      this.subtotalEstimado.set(Number(data.subtotal_estimado) || 0);
      this.cargando.set(false);
    });
  }

  public agregarItem(varianteId: string, cantidad: number = 1): Observable<any> {
    const uid = this.usuarioId;
    if (!uid) {
      this.authService.abrirModal("login");
      this.toastService.info("Inicia sesión para agregar productos a tu carrito.");
      return of(null);
    }
    const payload = { variante_id: varianteId, cantidad };
    return this.http.post(`${this.apiUrl}/item`, payload).pipe(
      tap(() => {
        this.cargarCarrito();
        this.toastService.success("¡Camiseta agregada al carrito con éxito!");
      }),
      catchError(err => {
        this.toastService.error(err?.error?.message || "No se pudo agregar al carrito.");
        throw err;
      })
    );
  }

  public eliminarItem(itemId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/item/${itemId}`).pipe(
      tap(() => {
        this.cargarCarrito();
        this.toastService.info("Prenda eliminada del carrito.");
      }),
      catchError(err => {
        this.toastService.error("Error al eliminar la prenda del carrito.");
        throw err;
      })
    );
  }

  public vaciarCarrito(): Observable<any> {
    const uid = this.usuarioId;
    if (!uid) return of(null);
    return this.http.delete(`${this.apiUrl}/vaciar/${uid}`).pipe(
      tap(() => {
        this.items.set([]);
        this.totalItems.set(0);
        this.subtotalEstimado.set(0);
        this.toastService.info("El carrito ha sido vaciado.");
      }),
      catchError(err => {
        this.toastService.error("Error al vaciar el carrito.");
        throw err;
      })
    );
  }
}
