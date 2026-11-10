import { Injectable, inject } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable, catchError, map, of } from "rxjs";
import { Equipo } from "../models/equipo.model";
import { ModeloCamiseta } from "../models/modelo-camiseta.model";

@Injectable({ providedIn: "root" })
export class CatalogoService {
  private http = inject(HttpClient);
  private apiUrl = "http://localhost:3000/api";

  getEquipos(): Observable<Equipo[]> {
    return this.http.get<any>(`${this.apiUrl}/equipos`).pipe(
      map(res => res.data || res || []),
      catchError(() => of([]))
    );
  }

  getModelosCamiseta(): Observable<ModeloCamiseta[]> {
    return this.http.get<any>(`${this.apiUrl}/modelos-camiseta`).pipe(
      map(res => res.data || res || []),
      catchError(() => of([]))
    );
  }
}