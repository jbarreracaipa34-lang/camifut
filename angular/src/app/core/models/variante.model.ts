export interface Variante {
  id?: string;
  publicacion_id: string;
  sku?: string;
  talla: string;
  color_id?: number;
  nombre_estampado?: string;
  numero_estampado?: number;
  precio: number;
  stock: number;
  stock_reservado?: number;
  color_nombre?: string;
  codigo_hex?: string;
}
