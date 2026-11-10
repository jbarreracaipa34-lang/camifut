export interface Subpedido {
  id: string;
  numero_subpedido: string;
  estado: string;
  metodo_entrega: string;
  subtotal: number;
  costo_envio: number;
  vendedor_id: string;
  nombre_tienda: string;
  items?: Array<{
    id: string;
    variante_id: string;
    titulo: string;
    talla: string;
    precio_unitario: number;
    cantidad: number;
    subtotal: number;
  }>;
}

export interface Pedido {
  id: string;
  comprador_id: string;
  monto_total: number;
  estado_general?: string;
  estado?: string;
  numero_pedido?: string;
  creado_en: string;
  subpedidos: Subpedido[];
}
