export interface ItemCarrito {
  item_id: string;
  variante_id: string;
  cantidad: number;
  solicitud_nombre_personalizado?: string;
  solicitud_numero_personalizado?: number;
  talla: string;
  precio: number;
  stock: number;
  publicacion_id: string;
  publicacion_titulo: string;
  vendedor_id: string;
  nombre_tienda: string;
  subtotal_item: number;
}

export interface CarritoResponse {
  carrito_id: string;
  usuario_id: string;
  items: ItemCarrito[];
  total_items: number;
  subtotal_estimado: number;
}

export interface AgregarItemDTO {
  usuario_id: string;
  variante_id: string;
  cantidad: number;
  solicitud_nombre_personalizado?: string;
  solicitud_numero_personalizado?: number;
}
