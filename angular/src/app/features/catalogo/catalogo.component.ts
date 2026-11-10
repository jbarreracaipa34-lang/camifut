import { Component, OnInit, inject, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule, ActivatedRoute, Router, NavigationEnd } from "@angular/router";
import { FormsModule } from "@angular/forms";
import { filter } from "rxjs/operators";
import { PublicacionService, FiltrosCatalogo } from "../../core/services/publicacion.service";
import { Publicacion } from "../../core/models/publicacion.model";

@Component({
  selector: "app-catalogo",
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: "./catalogo.component.html",
  styleUrls: ["./catalogo.component.css"]
})
export class CatalogoComponent implements OnInit {
  private publicacionService = inject(PublicacionService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  public publicaciones = signal<Publicacion[]>([]);
  public cargando = signal<boolean>(true);
  public imagenesFallidas = signal<Record<string, boolean>>({});

  // Filtros reactivos con valores predeterminados limpios
  public busqueda = signal<string>("");
  public paisSeleccionado = signal<string>("todos");
  public tipoSeleccionado = signal<string>("todos");
  public condicionSeleccionada = signal<string>("todos");
  public ordenSeleccionado = signal<string>("recientes");
  public minPrecio = signal<number | null>(null);
  public maxPrecio = signal<number | null>(null);

  // Lista de ligas y países
  public paises = ["todos", "Colombia", "España", "Italia", "Inglaterra", "Alemania", "Argentina", "Francia", "Brasil"];

  constructor() {
    // Si el usuario navega o hace clic en /catalogo desde cualquier lugar, restablecer a filtros predeterminados
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd)
    ).subscribe((event) => {
      const url = event.urlAfterRedirects || event.url;
      if (url === "/catalogo") {
        this.limpiarFiltros();
      }
    });
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.busqueda.set(params["search"] || "");
      this.paisSeleccionado.set(params["pais"] || "todos");
      this.tipoSeleccionado.set(params["tipo"] || "todos");
      this.condicionSeleccionada.set(params["estado_prenda"] || params["condicion"] || "todos");
      this.ordenSeleccionado.set(params["sort"] || "recientes");
      this.minPrecio.set(params["min_precio"] ? Number(params["min_precio"]) : null);
      this.maxPrecio.set(params["max_precio"] ? Number(params["max_precio"]) : null);
      this.cargarCatalogo();
    });
  }

  public cargarCatalogo(): void {
    this.cargando.set(true);

    const filtros: FiltrosCatalogo = {
      estado: "activa",
      search: this.busqueda(),
      pais: this.paisSeleccionado(),
      tipo_indumentaria: this.tipoSeleccionado(),
      estado_prenda: this.condicionSeleccionada(),
      min_precio: this.minPrecio() !== null ? this.minPrecio()! : undefined,
      max_precio: this.maxPrecio() !== null ? this.maxPrecio()! : undefined,
      sort: this.ordenSeleccionado(),
    };

    this.publicacionService.getPublicaciones(filtros).subscribe({
      next: (data) => {
        this.publicaciones.set(data || []);
        this.cargando.set(false);
      },
      error: () => {
        this.publicaciones.set([]);
        this.cargando.set(false);
      }
    });
  }

  public onBusquedaInput(val: string): void {
    this.busqueda.set(val);
    this.cargarCatalogo();
  }

  public setPais(p: string): void {
    this.paisSeleccionado.set(p);
    this.cargarCatalogo();
  }

  public setTipo(t: string): void {
    this.tipoSeleccionado.set(t);
    this.cargarCatalogo();
  }

  public setCondicion(c: string): void {
    this.condicionSeleccionada.set(c);
    this.cargarCatalogo();
  }

  public setOrden(o: string): void {
    this.ordenSeleccionado.set(o);
    this.cargarCatalogo();
  }

  public aplicarRangoPrecios(): void {
    this.cargarCatalogo();
  }

  public limpiarFiltros(): void {
    this.busqueda.set("");
    this.paisSeleccionado.set("todos");
    this.tipoSeleccionado.set("todos");
    this.condicionSeleccionada.set("todos");
    this.ordenSeleccionado.set("recientes");
    this.minPrecio.set(null);
    this.maxPrecio.set(null);
    this.cargarCatalogo();
  }

  public registrarFalloImagen(pubId: string): void {
    this.imagenesFallidas.update((map) => ({ ...map, [pubId]: true }));
  }

  public getPrecioMin(pub: Publicacion): number {
    return pub.variantes && pub.variantes.length ? Math.min(...pub.variantes.map((v) => Number(v.precio))) : 0;
  }

  public fmt(v: number): string {
    return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(v);
  }

  public scrollToGrid(): void {
    const el = document.getElementById("catalogo-main");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  }

  public formatoEdicion(tipo?: string): string {
    switch (tipo) {
      case "jugador_version_profesional":
        return "Versión Jugador (Pro)";
      case "aficionado_estadio":
      case "hincha_replica":
        return "Versión Aficionado";
      case "reedicion_retro":
      case "edicion_limitada":
        return "Edición Retro / Especial";
      default:
        return tipo ? tipo.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()) : "";
    }
  }

  public formatoAutenticidad(aut?: string): string {
    switch (aut) {
      case "original_oficial":
        return "Original Oficial";
      case "replica_autorizada":
        return "Réplica Autorizada";
      case "reedicion_retro":
        return "Retro Oficial";
      case "replica_no_oficial":
      case "copia_no_oficial":
        return "Copia / Réplica";
      default:
        return aut ? aut.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()) : "";
    }
  }

  public formatoTexto(texto?: string): string {
    if (!texto) return "";
    return texto.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  }
}
