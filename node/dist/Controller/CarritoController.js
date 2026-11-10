"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteVaciarCarrito = exports.deleteItemCarrito = exports.postItemCarrito = exports.getCarritoPorUsuario = exports.itemCarritoSchema = void 0;
const CarritoModels_1 = require("../Models/CarritoModels");
const zod_1 = require("zod");
const sanitizer_1 = require("../Utils/sanitizer");
exports.itemCarritoSchema = zod_1.z.object({
    variante_id: zod_1.z.string().trim().min(1, "ID de variante requerido"),
    cantidad: zod_1.z.number().int().positive("La cantidad debe ser mayor a 0").max(10, "Máximo 10 unidades por prenda"),
    usuario_id: (0, sanitizer_1.zCleanOptionalString)(100),
    solicitud_nombre_personalizado: (0, sanitizer_1.zCleanOptionalString)(100),
    solicitud_numero_personalizado: zod_1.z.number().int().min(0).max(99).optional().nullable(),
});
const getCarritoPorUsuario = async (req, res) => {
    try {
        const usuarioId = (req.usuario?.id || req.params.usuarioId);
        if (!usuarioId) {
            res.status(401).json({ success: false, message: "Usuario no autenticado." });
            return;
        }
        const obj = new CarritoModels_1.UserCarrito();
        const carrito = await obj.obtenerCarritoPorUsuario(usuarioId);
        res.status(200).json({ success: true, data: carrito });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message || "Error interno del servidor." });
    }
};
exports.getCarritoPorUsuario = getCarritoPorUsuario;
const postItemCarrito = async (req, res) => {
    try {
        const usuarioIdJWT = req.usuario?.id;
        const validated = exports.itemCarritoSchema.parse(req.body);
        const payload = {
            ...validated,
            usuario_id: usuarioIdJWT || validated.usuario_id,
        };
        if (!payload.usuario_id) {
            res.status(400).json({ success: false, message: "No se pudo identificar el usuario. Inicia sesión nuevamente." });
            return;
        }
        const obj = new CarritoModels_1.UserCarrito(payload);
        const result = await obj.agregarItem();
        if (result.success) {
            res.status(201).json({ success: true, message: result.message, data: result.item });
        }
        else {
            res.status(400).json({ success: false, message: result.message });
        }
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            res.status(400).json({ success: false, message: "Datos inválidos.", errors: error.format() });
        }
        else {
            res.status(500).json({ success: false, message: error.message || "Error interno del servidor." });
        }
    }
};
exports.postItemCarrito = postItemCarrito;
const deleteItemCarrito = async (req, res) => {
    try {
        const id = req.params.id;
        const obj = new CarritoModels_1.UserCarrito();
        const result = await obj.eliminarItem(id);
        if (result.success) {
            res.status(200).json({ success: true, message: result.message });
        }
        else {
            res.status(400).json({ success: false, message: result.message });
        }
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message || "Error interno del servidor." });
    }
};
exports.deleteItemCarrito = deleteItemCarrito;
const deleteVaciarCarrito = async (req, res) => {
    try {
        const usuarioId = (req.usuario?.id || req.params.usuarioId);
        if (!usuarioId) {
            res.status(401).json({ success: false, message: "Usuario no autenticado." });
            return;
        }
        const obj = new CarritoModels_1.UserCarrito();
        const result = await obj.vaciarCarrito(usuarioId);
        if (result.success) {
            res.status(200).json({ success: true, message: result.message });
        }
        else {
            res.status(400).json({ success: false, message: result.message });
        }
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message || "Error interno del servidor." });
    }
};
exports.deleteVaciarCarrito = deleteVaciarCarrito;
