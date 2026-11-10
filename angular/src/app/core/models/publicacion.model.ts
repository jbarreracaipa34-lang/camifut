export interface PublicacionVariante {
  id: string;
  sku?: string;
  talla: string;
  precio: number;
  stock: number;
  stock_reservado?: number;
}

export interface PublicacionImagen {
  id?: string;
  publicacion_id?: string;
  imagen_url: string;
  orden?: number;
  es_portada?: boolean;
}

export interface Publicacion {
  id: string;
  vendedor_id: string;
  modelo_camiseta_id?: string;
  titulo: string;
  descripcion: string;
  tipo_edicion?: string;
  autenticidad?: string;
  estado_prenda: string;
  cantidad_usos?: number;
  detalles_defectos?: string;
  genero?: string;
  permite_envio_transportadora?: boolean;
  permite_entrega_en_persona?: boolean;
  ciudad_entrega_persona?: string;
  zona_entrega_persona?: string;
  estado?: string;
  creado_en?: string;
  camiseta_nombre?: string;
  tipo_indumentaria?: string;
  anio_inicio_temporada?: number;
  anio_temporada?: number;
  equipo_nombre?: string;
  equipo_pais?: string;
  pais?: string;
  escudo_url?: string;
  nombre_tienda?: string;
  vendedor_reputacion?: number;
  imagen_portada?: string;
  imagen_url?: string;
  imagenes?: PublicacionImagen[];
  variantes?: PublicacionVariante[];
  // Campos adicionales traídos por el backend
  marca?: string;
  es_retro?: boolean;
  total_visitas?: number;
}

export interface CrearPublicacionDTO {
  vendedor_id: string;
  modelo_camiseta_id?: string;
  titulo: string;
  descripcion: string;
  tipo_edicion?: string;
  autenticidad?: string;
  estado_prenda: string;
  cantidad_usos?: number;
  detalles_defectos?: string;
  genero?: string;
  permite_envio_transportadora?: boolean;
  permite_entrega_en_persona?: boolean;
  ciudad_entrega_persona?: string;
  zona_entrega_persona?: string;
}
