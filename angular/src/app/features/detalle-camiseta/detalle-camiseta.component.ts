import { Component, OnInit, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ActivatedRoute, RouterModule } from "@angular/router";
import { FormsModule } from "@angular/forms";
import { PublicacionService } from "../../core/services/publicacion.service";
import { CarritoService } from "../../core/services/carrito.service";
import { AuthService } from "../../core/services/auth.service";
import { Publicacion } from "../../core/models/publicacion.model";

@Component({
  selector: "app-detalle-camiseta",
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: "./detalle-camiseta.component.html",
  styleUrls: ["./detalle-camiseta.component.css"]
})
export class DetalleCamisetaComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private publicacionService = inject(PublicacionService);
  private carritoService = inject(CarritoService);
  public authService = inject(AuthService);

  publicacion: Publicacion | null = null;
  varianteSeleccionada: any = null;
  cantidadSeleccionada = 1;
  cargando = true;
  agregando = false;
  mensajeExito = "";
  mensajeError = "";
  imagenActual = 0;

  ngOnInit() {
    this.route.paramMap.subscribe(p => {
      const id = p.get("id");
      if (id) this.cargarDetalle(id);
    });
  }

  cargarDetalle(id: string) {
    this.cargando = true;
    this.publicacionService.getPublicacionPorId(id).subscribe({
      next: pub => {
        this.publicacion = pub;
        const vars = this.getVariantesActivas();
        if (vars && vars.length > 0) {
          this.seleccionarVariante(vars[0]);
        } else {
          this.varianteSeleccionada = null;
          this.cantidadSeleccionada = 0;
        }
        this.cargando = false;
      },
      error: () => {
        this.cargando = false;
      }
    });
  }

  getVariantesActivas(): any[] {
    if (!this.publicacion?.variantes || this.publicacion.variantes.length === 0) {
      return [];
    }
    // Filtrar solo las variantes que tengan stock disponible real
    const conStock = this.publicacion.variantes.filter((v: any) => Number(v.stock) > 0);
    return conStock.length > 0 ? conStock : this.publicacion.variantes;
  }

  seleccionarVariante(v: any) {
    this.varianteSeleccionada = v;
    const stockDisp = this.getStockDisponible();
    this.cantidadSeleccionada = stockDisp > 0 ? 1 : 0;
  }

  get opcionesCantidad(): number[] {
    const stock = this.getStockDisponible();
    if (stock <= 0) return [];
    const max = Math.min(stock, 10);
    const opts: number[] = [];
    for (let i = 1; i <= max; i++) {
      opts.push(i);
    }
    return opts;
  }

  getStockDisponible(): number {
    if (!this.varianteSeleccionada) return 0;
    const stock = Number(this.varianteSeleccionada.stock) || 0;
    const reservado = Number(this.varianteSeleccionada.stock_reservado) || 0;
    return Math.max(0, stock - reservado);
  }

  agregarAlCarrito() {
    if (!this.authService.isLoggedIn()) {
      this.authService.abrirModal("login");
      return;
    }
    if (!this.varianteSeleccionada?.id) {
      this.mensajeError = "Por favor selecciona una talla.";
      return;
    }
    if (this.getStockDisponible() <= 0) {
      this.mensajeError = "Esta prenda se encuentra actualmente agotada.";
      return;
    }
    if (this.cantidadSeleccionada <= 0 || this.cantidadSeleccionada > this.getStockDisponible()) {
      this.mensajeError = `Solo hay ${this.getStockDisponible()} unidad(es) disponible(s).`;
      return;
    }

    this.agregando = true;
    this.mensajeError = "";
    this.carritoService.agregarItem(this.varianteSeleccionada.id, this.cantidadSeleccionada).subscribe({
      next: () => {
        this.agregando = false;
        this.mostrarExito("¡Camiseta agregada al carrito con éxito!");
      },
      error: (err: any) => {
        this.agregando = false;
        this.mensajeError = err?.error?.message || "Error al agregar al carrito.";
        setTimeout(() => (this.mensajeError = ""), 5000);
      }
    });
  }

  mostrarExito(msg: string) {
    this.mensajeExito = msg;
    setTimeout(() => (this.mensajeExito = ""), 4000);
  }

  getImagenes(): string[] {
    if (this.publicacion?.imagenes && this.publicacion.imagenes.length > 0) {
      return this.publicacion.imagenes.map((img: any) => img.imagen_url);
    }
    if (this.publicacion?.imagen_portada) return [this.publicacion.imagen_portada];
    return ["https://images.unsplash.com/photo-1577223625816-7546f13df25d?auto=format&fit=crop&w=1200&q=80"];
  }

  getPrecioActual(): number {
    if (this.varianteSeleccionada?.precio) {
      return Number(this.varianteSeleccionada.precio);
    }
    if (this.publicacion?.variantes && this.publicacion.variantes.length > 0) {
      return Number(this.publicacion.variantes[0].precio);
    }
    return 0;
  }

  fmt(v: number): string {
    return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(v);
  }

  // Formateadores legibles en lenguaje natural (sin snake_case)
  formatoEdicion(tipo: string | undefined): string {
    switch (tipo) {
      case "jugador_version_profesional":
        return "Versión Jugador (Pro)";
      case "aficionado_estadio":
      case "hincha_replica":
        return "Versión Aficionado / Estadio (Fan / Réplica)";
      case "reedicion_retro":
      case "edicion_limitada":
        return "Reedición Retro / Conmemorativa";
      default:
        return tipo ? tipo.replace(/_/g, " ") : "Oficial";
    }
  }

  formatoAutenticidad(aut: string | undefined): string {
    switch (aut) {
      case "original_oficial":
        return "Original Oficial";
      case "replica_autorizada":
        return "Réplica Autorizada";
      case "reedicion_retro":
        return "Reedición Retro Oficial";
      case "replica_no_oficial":
      case "copia_no_oficial":
        return "Copia / Réplica No Oficial";
      default:
        return aut ? aut.replace(/_/g, " ") : "Verificada";
    }
  }

  formatoEstadoPrenda(estado: string | undefined): string {
    switch (estado) {
      case "nueva_con_etiqueta":
        return "Nueva con Etiqueta (BNWT)";
      case "nueva_sin_etiqueta":
        return "Nueva sin Etiqueta (BNWOT)";
      case "usada_como_nueva":
      case "como_nueva":
        return "Como Nueva (Mint / Usada 1-2 veces)";
      case "usada_buen_estado":
      case "buen_estado":
        return "Usada en Buen Estado";
      case "usada_estado_aceptable":
      case "uso_visible":
        return "Uso Visible (Con marcas de uso)";
      case "reliquia_coleccion":
        return "Reliquia de Colección";
      default:
        return estado ? estado.replace(/_/g, " ") : "Buen Estado";
    }
  }

  formatoTipoIndumentaria(tipo: string | undefined): string {
    switch (tipo) {
      case "local":
        return "Local (Titular)";
      case "visitante":
        return "Visitante (Suplente)";
      case "tercera":
        return "Tercera Equipación";
      case "cuarta":
        return "Cuarta Equipación";
      case "arquero":
      case "portero":
        return "Arquero / Portero (GK)";
      case "entrenamiento":
        return "Entrenamiento";
      case "edicion_especial":
        return "Edición Especial";
      default:
        return tipo ? tipo.toUpperCase() : "OFICIAL";
    }
  }

  formatoGenero(gen: string | undefined): string {
    switch (gen) {
      case "hombre":
        return "Hombre";
      case "mujer":
        return "Mujer";
      case "unisex":
        return "Unisex";
      default:
        return gen ? gen.toUpperCase() : "UNISEX";
    }
  }

  formatoUsos(pub: any): string {
    if (!pub) return "0";
    if (pub.estado_prenda === "nueva_con_etiqueta" || pub.estado_prenda === "nueva_sin_etiqueta") {
      return "0 (Prenda sin estrenar)";
    }
    const n = Number(pub.cantidad_usos);
    if (isNaN(n) || n === 0) return "0 (Sin uso visible)";
    return n === 1 ? "1 uso previo" : `${n} usos previos`;
  }
}
