export interface ModeloCamiseta {
  id: string;
  equipo_id: number;
  marca_id: number;
  anio_inicio_temporada: number;
  anio_fin_temporada?: number;
  tipo_indumentaria: string;
  etiqueta_edicion?: string;
  es_retro?: boolean;
  nombre_canonico: string;
  descripcion?: string;
  equipo_nombre?: string;
  escudo_url?: string;
  equipo_pais?: string;
  marca_nombre?: string;
  marca_logo?: string;
}
