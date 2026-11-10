import { Injectable, inject } from "@angular/core";
import { HttpClient, HttpParams } from "@angular/common/http";
import { Observable, catchError, map, of } from "rxjs";
import { Publicacion, CrearPublicacionDTO } from "../models/publicacion.model";
import { Variante } from "../models/variante.model";

export interface FiltrosCatalogo {
  estado?: string;
  vendedorId?: string;
  search?: string;
  pais?: string;
  tipo_indumentaria?: string;
  estado_prenda?: string;
  min_precio?: number;
  max_precio?: number;
  sort?: string;
}

@Injectable({ providedIn: "root" })
export class PublicacionService {
  private http = inject(HttpClient);
  private apiUrl = "http://localhost:3000/api";

  getPublicaciones(filtros?: FiltrosCatalogo | string, vendedorId?: string): Observable<Publicacion[]> {
    let params = new HttpParams();

    if (typeof filtros === "string") {
      params = params.set("estado", filtros);
      if (vendedorId) params = params.set("vendedor_id", vendedorId);
    } else if (filtros) {
      if (filtros.estado) params = params.set("estado", filtros.estado);
      if (filtros.vendedorId) params = params.set("vendedor_id", filtros.vendedorId);
      if (filtros.search && filtros.search.trim()) params = params.set("search", filtros.search.trim());
      if (filtros.pais && filtros.pais !== "todos") params = params.set("pais", filtros.pais);
      if (filtros.tipo_indumentaria && filtros.tipo_indumentaria !== "todos") {
        params = params.set("tipo_indumentaria", filtros.tipo_indumentaria);
      }
      if (filtros.estado_prenda && filtros.estado_prenda !== "todos") {
        params = params.set("estado_prenda", filtros.estado_prenda);
      }
      if (filtros.min_precio !== undefined && filtros.min_precio !== null) {
        params = params.set("min_precio", filtros.min_precio.toString());
      }
      if (filtros.max_precio !== undefined && filtros.max_precio !== null) {
        params = params.set("max_precio", filtros.max_precio.toString());
      }
      if (filtros.sort) params = params.set("sort", filtros.sort);
    } else {
      params = params.set("estado", "activa");
    }

    return this.http.get<any>(`${this.apiUrl}/publicaciones`, { params }).pipe(
      map(res => res.data || res || []),
      catchError(() => of([]))
    );
  }

  getPublicacionPorId(id: string): Observable<Publicacion | null> {
    return this.http.get<any>(`${this.apiUrl}/publicaciones/${id}`).pipe(
      map(res => res.data || res || null),
      catchError(() => of(null))
    );
  }

  crearPublicacion(publicacion: CrearPublicacionDTO): Observable<any> {
    return this.http.post(`${this.apiUrl}/publicaciones`, publicacion);
  }

  actualizarPublicacion(id: string, datos: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/publicaciones/${id}`, datos);
  }

  eliminarPublicacion(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/publicaciones/${id}`);
  }

  getVariantesPorPublicacion(publicacionId: string): Observable<Variante[]> {
    return this.http.get<Variante[]>(`${this.apiUrl}/variantes/publicacion/${publicacionId}`).pipe(
      catchError(() => of([]))
    );
  }

  agregarVariante(variante: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/variantes`, variante);
  }

  actualizarVariante(id: string, datos: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/variantes/${id}`, datos);
  }
}
