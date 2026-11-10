"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.patchEstadoSubpedido = exports.getPedidoPorId = exports.postCheckout = exports.getDisputasAdmin = exports.getMetricasAdmin = exports.getPedidosAdmin = exports.getPedidosPorVendedor = exports.getPedidosPorComprador = exports.checkoutSchema = exports.actualizarEstadoSubpedidoSchema = void 0;
const PedidoModels_1 = require("../Models/PedidoModels");
const zod_1 = require("zod");
const sanitizer_1 = require("../Utils/sanitizer");
exports.actualizarEstadoSubpedidoSchema = zod_1.z.object({
    estado: zod_1.z.enum([
        "pendiente_despacho",
        "por_coordinar_entrega",
        "guia_generada",
        "en_camino",
        "listo_para_entrega_en_persona",
        "entregado",
        "cancelado",
        "devuelto"
    ]),
    comentario: (0, sanitizer_1.zCleanOptionalString)(500),
});
exports.checkoutSchema = zod_1.z.object({
    metodo_entrega: zod_1.z.enum(["envio_transportadora", "entrega_en_persona"]).optional(),
    ciudad: (0, sanitizer_1.zCleanOptionalString)(100),
    direccion: (0, sanitizer_1.zCleanOptionalString)(250),
    punto_encuentro: (0, sanitizer_1.zCleanOptionalString)(200),
    telefono_contacto: (0, sanitizer_1.zCleanOptionalString)(50),
    comentarios: (0, sanitizer_1.zCleanOptionalString)(500),
});
const getPedidosPorComprador = async (req, res) => {
    try {
        const compradorId = (req.usuario?.id || req.params.compradorId);
        if (!compradorId) {
            res.status(400).json({ success: false, message: "ID de comprador no proporcionado." });
            return;
        }
        const obj = new PedidoModels_1.UserPedido();
        const lista = await obj.listarPedidosPorComprador(compradorId);
        res.status(200).json({ success: true, message: "Pedidos encontrados.", data: lista });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message || "Error interno del servidor." });
    }
};
exports.getPedidosPorComprador = getPedidosPorComprador;
const getPedidosPorVendedor = async (req, res) => {
    try {
        const tiendaIdSolicitante = req.usuario?.roles?.tienda?.id;
        const esAdmin = !!req.usuario?.roles?.es_admin;
        const vendedorId = (req.params.vendedorId || tiendaIdSolicitante || req.usuario?.id);
        if (!vendedorId) {
            res.status(400).json({ success: false, message: "ID de vendedor no proporcionado." });
            return;
        }
        const obj = new PedidoModels_1.UserPedido();
        const lista = await obj.listarPedidosPorVendedor(vendedorId, tiendaIdSolicitante, esAdmin);
        res.status(200).json({ success: true, message: "Ventas del vendedor encontradas.", data: lista });
    }
    catch (error) {
        const status = error.message.includes("denegado") ? 403 : 500;
        res.status(status).json({ success: false, message: error.message || "Error interno del servidor." });
    }
};
exports.getPedidosPorVendedor = getPedidosPorVendedor;
const getPedidosAdmin = async (req, res) => {
    try {
        const obj = new PedidoModels_1.UserPedido();
        const lista = await obj.listarTodosLosPedidosAdmin();
        res.status(200).json({ success: true, message: "Todos los pedidos para administración.", data: lista });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message || "Error interno del servidor." });
    }
};
exports.getPedidosAdmin = getPedidosAdmin;
const getMetricasAdmin = async (req, res) => {
    try {
        const obj = new PedidoModels_1.UserPedido();
        const metricas = await obj.obtenerMetricasPlataforma();
        res.status(200).json({ success: true, data: metricas });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message || "Error interno del servidor." });
    }
};
exports.getMetricasAdmin = getMetricasAdmin;
const getDisputasAdmin = async (req, res) => {
    try {
        const obj = new PedidoModels_1.UserPedido();
        const disputas = await obj.listarDisputasAdmin();
        res.status(200).json({ success: true, data: disputas });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message || "Error interno del servidor." });
    }
};
exports.getDisputasAdmin = getDisputasAdmin;
const postCheckout = async (req, res) => {
    try {
        const compradorId = req.usuario?.id;
        if (!compradorId) {
            res.status(401).json({ success: false, message: "Usuario no autenticado para realizar checkout." });
            return;
        }
        const datosEnvioValidados = req.body ? exports.checkoutSchema.parse(req.body) : {};
        const obj = new PedidoModels_1.UserPedido();
        const result = await obj.checkout(compradorId, datosEnvioValidados);
        if (result.success) {
            res.status(201).json(result);
        }
        else {
            res.status(400).json(result);
        }
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            res.status(400).json({ success: false, message: "Datos de envío inválidos.", errors: error.format() });
        }
        else {
            res.status(500).json({ success: false, message: error.message || "Error interno del servidor." });
        }
    }
};
exports.postCheckout = postCheckout;
const getPedidoPorId = async (req, res) => {
    try {
        const id = req.params.id;
        const obj = new PedidoModels_1.UserPedido();
        const pedido = await obj.obtenerPorId(id);
        if (!pedido) {
            res.status(404).json({ success: false, message: "Pedido no encontrado." });
            return;
        }
        res.status(200).json({ success: true, data: pedido });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message || "Error interno del servidor." });
    }
};
exports.getPedidoPorId = getPedidoPorId;
const patchEstadoSubpedido = async (req, res) => {
    try {
        const subpedidoId = req.params.subpedidoId;
        const tiendaId = req.usuario?.roles?.tienda?.id;
        const esAdmin = !!req.usuario?.roles?.es_admin;
        if (!tiendaId && !esAdmin) {
            res.status(403).json({ success: false, message: "Acceso denegado. Se requieren permisos de vendedor o administrador." });
            return;
        }
        const validated = exports.actualizarEstadoSubpedidoSchema.parse(req.body);
        const obj = new PedidoModels_1.UserPedido();
        const result = await obj.actualizarEstadoSubpedido(subpedidoId, validated.estado, validated.comentario || undefined, tiendaId, esAdmin);
        if (result.success) {
            res.status(200).json({ success: true, message: result.message });
        }
        else {
            const status = result.message.includes("denegado") ? 403 : 400;
            res.status(status).json({ success: false, message: result.message });
        }
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            res.status(400).json({ success: false, message: "Estado no válido.", errors: error.format() });
        }
        else {
            res.status(500).json({ success: false, message: error.message || "Error interno del servidor." });
        }
    }
};
exports.patchEstadoSubpedido = patchEstadoSubpedido;
