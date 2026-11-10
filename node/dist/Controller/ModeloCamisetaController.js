"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteModeloCamiseta = exports.putModeloCamiseta = exports.postModeloCamiseta = exports.getModeloCamisetaPorId = exports.getModelosCamiseta = exports.modeloCamisetaSchema = void 0;
const ModeloCamisetaModels_1 = require("../Models/ModeloCamisetaModels");
const zod_1 = require("zod");
exports.modeloCamisetaSchema = zod_1.z.object({
    equipo_id: zod_1.z.number().int().positive(),
    marca_id: zod_1.z.number().int().positive(),
    anio_inicio_temporada: zod_1.z.number().int().min(1900).max(2100),
    anio_fin_temporada: zod_1.z.number().int().optional(),
    tipo_indumentaria: zod_1.z.enum([
        "local", "visitante", "tercera", "cuarta", "arquero", "edicion_especial", "entrenamiento"
    ]),
    etiqueta_edicion: zod_1.z.string().optional(),
    es_retro: zod_1.z.boolean().optional(),
    nombre_canonico: zod_1.z.string().min(3),
    descripcion: zod_1.z.string().optional(),
});
const getModelosCamiseta = async (req, res) => {
    try {
        const obj = new ModeloCamisetaModels_1.UserModeloCamiseta();
        const lista = await obj.listarModelos();
        res.status(200).json({ success: true, message: "Modelos encontrados.", data: lista });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message || "Error interno del servidor." });
    }
};
exports.getModelosCamiseta = getModelosCamiseta;
const getModeloCamisetaPorId = async (req, res) => {
    try {
        const { id } = req.params;
        const obj = new ModeloCamisetaModels_1.UserModeloCamiseta();
        const modelo = await obj.obtenerPorId(id);
        if (!modelo) {
            res.status(404).json({ success: false, message: "Modelo de camiseta no encontrado." });
            return;
        }
        res.status(200).json({ success: true, data: modelo });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message || "Error interno del servidor." });
    }
};
exports.getModeloCamisetaPorId = getModeloCamisetaPorId;
const postModeloCamiseta = async (req, res) => {
    try {
        const validated = exports.modeloCamisetaSchema.parse(req.body);
        const obj = new ModeloCamisetaModels_1.UserModeloCamiseta(validated);
        const result = await obj.insertarModelo();
        if (result.success) {
            res.status(201).json({ success: true, message: result.message, data: result.modelo });
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
exports.postModeloCamiseta = postModeloCamiseta;
const putModeloCamiseta = async (req, res) => {
    try {
        const { id } = req.params;
        const obj = new ModeloCamisetaModels_1.UserModeloCamiseta({ id, ...req.body });
        const result = await obj.editarModelo();
        if (result.success) {
            res.status(200).json({ success: true, message: result.message, data: result.modelo });
        }
        else {
            res.status(400).json({ success: false, message: result.message });
        }
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message || "Error interno del servidor." });
    }
};
exports.putModeloCamiseta = putModeloCamiseta;
const deleteModeloCamiseta = async (req, res) => {
    try {
        const { id } = req.params;
        const obj = new ModeloCamisetaModels_1.UserModeloCamiseta();
        const result = await obj.eliminarModelo(id);
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
exports.deleteModeloCamiseta = deleteModeloCamiseta;
