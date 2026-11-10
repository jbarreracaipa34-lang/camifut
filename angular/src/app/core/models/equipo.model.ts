export interface Equipo {
  id: number;
  nombre: string;
  nombre_corto?: string;
  slug: string;
  pais: string;
  tipo_equipo?: 'club' | 'seleccion_nacional';
  escudo_url?: string;
}
