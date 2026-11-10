import { Router } from "express";
import {
  getPedidosPorComprador,
  getPedidosPorVendedor,
  getPedidosAdmin,
  getMetricasAdmin,
  getDisputasAdmin,
  postCheckout,
  getPedidoPorId,
  patchEstadoSubpedido,
} from "../Controller/PedidoController";
import {
  verificarAutenticacion,
  requerirVendedor,
  requerirAdmin,
} from "../Middlewares/AuthMiddleware";

const PedidoRouter = Router();

// Checkout de compra (Comprador autenticado)
PedidoRouter.post("/checkout", verificarAutenticacion, postCheckout);

// Supervisión de órdenes, métricas y disputas (Exclusivo Administrador)
PedidoRouter.get("/admin/metricas", verificarAutenticacion, requerirAdmin, getMetricasAdmin);
PedidoRouter.get("/admin/disputas", verificarAutenticacion, requerirAdmin, getDisputasAdmin);
PedidoRouter.get("/admin/todos", verificarAutenticacion, requerirAdmin, getPedidosAdmin);

// Ventas recibidas por vendedor (Exclusivo Vendedor / Inquilino protegido)
PedidoRouter.get("/vendedor/:vendedorId", verificarAutenticacion, requerirVendedor, getPedidosPorVendedor);

// Historial de pedidos del comprador autenticado
PedidoRouter.get("/comprador/mis", verificarAutenticacion, getPedidosPorComprador);
PedidoRouter.get("/comprador/:compradorId", verificarAutenticacion, getPedidosPorComprador);

// Detalle de un pedido
PedidoRouter.get("/:id", verificarAutenticacion, getPedidoPorId);

// Actualizar estado de despacho de un subpedido (Vendedor dueño o Admin)
PedidoRouter.patch("/subpedido/:subpedidoId/estado", verificarAutenticacion, patchEstadoSubpedido);

export { PedidoRouter };
