"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PedidoRouter = void 0;
const express_1 = require("express");
const PedidoController_1 = require("../Controller/PedidoController");
const AuthMiddleware_1 = require("../Middlewares/AuthMiddleware");
const PedidoRouter = (0, express_1.Router)();
exports.PedidoRouter = PedidoRouter;
// Checkout de compra (Comprador autenticado)
PedidoRouter.post("/checkout", AuthMiddleware_1.verificarAutenticacion, PedidoController_1.postCheckout);
// Supervisión de órdenes, métricas y disputas (Exclusivo Administrador)
PedidoRouter.get("/admin/metricas", AuthMiddleware_1.verificarAutenticacion, AuthMiddleware_1.requerirAdmin, PedidoController_1.getMetricasAdmin);
PedidoRouter.get("/admin/disputas", AuthMiddleware_1.verificarAutenticacion, AuthMiddleware_1.requerirAdmin, PedidoController_1.getDisputasAdmin);
PedidoRouter.get("/admin/todos", AuthMiddleware_1.verificarAutenticacion, AuthMiddleware_1.requerirAdmin, PedidoController_1.getPedidosAdmin);
// Ventas recibidas por vendedor (Exclusivo Vendedor / Inquilino protegido)
PedidoRouter.get("/vendedor/:vendedorId", AuthMiddleware_1.verificarAutenticacion, AuthMiddleware_1.requerirVendedor, PedidoController_1.getPedidosPorVendedor);
// Historial de pedidos del comprador autenticado
PedidoRouter.get("/comprador/mis", AuthMiddleware_1.verificarAutenticacion, PedidoController_1.getPedidosPorComprador);
PedidoRouter.get("/comprador/:compradorId", AuthMiddleware_1.verificarAutenticacion, PedidoController_1.getPedidosPorComprador);
// Detalle de un pedido
PedidoRouter.get("/:id", AuthMiddleware_1.verificarAutenticacion, PedidoController_1.getPedidoPorId);
// Actualizar estado de despacho de un subpedido (Vendedor dueño o Admin)
PedidoRouter.patch("/subpedido/:subpedidoId/estado", AuthMiddleware_1.verificarAutenticacion, PedidoController_1.patchEstadoSubpedido);
