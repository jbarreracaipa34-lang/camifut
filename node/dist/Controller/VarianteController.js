"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteVariante = exports.putVariante = exports.postVariante = exports.getVariantesPorPublicacion = exports.editarVarianteSchema = exports.varianteSchema = void 0;
const VarianteModels_1 = require("../Models/VarianteModels");
const zod_1 = require("zod");
const sanitizer_1 = require("../Utils/sanitizer");
exports.varianteSchema = zod_1.z.object({
    publicacion_id: zod_1.z.string().trim().min(1, "ID de publicación requerido"),
    sku: (0, sanitizer_1.zCleanOptionalString)(100),
    talla: zod_1.z.enum([
        "2XS", "XS", "S", "M", "L", "XL", "2XL", "3XL", "4XL",
        "NINO_2", "NINO_4", "NINO_6", "NINO_8", "NINO_10", "NINO_12", "NINO_14", "NINO_16"
    ]),
    color_id: zod_1.z.number().int().optional().nullable(),
    nombre_estampado: (0, sanitizer_1.zCleanOptionalString)(100),
    numero_estampado: zod_1.z.number().int().min(0).max(99).optional().nullable(),
    precio: zod_1.z.number().positive("El precio debe ser positivo"),
    stock: zod_1.z.number().int().min(0, "El stock no puede ser negativo"),
});
exports.editarVarianteSchema = zod_1.z.object({
    precio: zod_1.z.number().positive("El precio debe ser positivo").optional(),
    stock: zod_1.z.number().int().min(0, "El stock no puede ser negativo").optional(),
});
const getVariantesPorPublicacion = async (req, res) => {
    try {
        const publicacionId = req.params.publicacionId;
        const obj = new VarianteModels_1.UserVariante();
        const lista = await obj.listarPorPublicacion(publicacionId);
        res.status(200).json({ success: true, message: "Variantes encontradas.", data: lista });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message || "Error interno del servidor." });
    }
};
exports.getVariantesPorPublicacion = getVariantesPorPublicacion;
const postVariante = async (req, res) => {
    try {
        const tiendaId = req.usuario?.roles?.tienda?.id;
        const esAdmin = !!req.usuario?.roles?.es_admin;
        const validated = exports.varianteSchema.parse(req.body);
        const obj = new VarianteModels_1.UserVariante(validated);
        const result = await obj.insertarVariante(tiendaId, esAdmin);
        if (result.success) {
            res.status(201).json({ success: true, message: result.message, data: result.variante });
        }
        else {
            const status = result.message.includes("denegado") ? 403 : 400;
            res.status(status).json({ success: false, message: result.message });
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
exports.postVariante = postVariante;
const putVariante = async (req, res) => {
    try {
        const id = req.params.id;
        const tiendaId = req.usuario?.roles?.tienda?.id;
        const esAdmin = !!req.usuario?.roles?.es_admin;
        const validated = exports.editarVarianteSchema.parse(req.body);
        const obj = new VarianteModels_1.UserVariante({ id, ...validated });
        const result = await obj.editarVariante(tiendaId, esAdmin);
        if (result.success) {
            res.status(200).json({ success: true, message: result.message, data: result.variante });
        }
        else {
            const status = result.message.includes("denegado") ? 403 : 400;
            res.status(status).json({ success: false, message: result.message });
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
exports.putVariante = putVariante;
const deleteVariante = async (req, res) => {
    try {
        const id = req.params.id;
        const tiendaId = req.usuario?.roles?.tienda?.id;
        const esAdmin = !!req.usuario?.roles?.es_admin;
        const obj = new VarianteModels_1.UserVariante();
        const result = await obj.eliminarVariante(id, tiendaId, esAdmin);
        if (result.success) {
            res.status(200).json({ success: true, message: result.message });
        }
        else {
            const status = result.message.includes("denegado") ? 403 : 400;
            res.status(status).json({ success: false, message: result.message });
        }
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message || "Error interno del servidor." });
    }
};
exports.deleteVariante = deleteVariante;
