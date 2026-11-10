"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteEquipo = exports.putEquipo = exports.postEquipo = exports.getEquipoPorId = exports.getEquipos = exports.equipoSchema = void 0;
const EquipoModels_1 = require("../Models/EquipoModels");
const zod_1 = require("zod");
exports.equipoSchema = zod_1.z.object({
    nombre: zod_1.z.string().min(2),
    nombre_corto: zod_1.z.string().optional().nullable(),
    slug: zod_1.z.string().min(2),
    pais: zod_1.z.string().min(2),
    tipo_equipo: zod_1.z.enum(["club", "seleccion_nacional"]).optional(),
    escudo_url: zod_1.z.string().optional().nullable(),
});
const getEquipos = async (req, res) => {
    try {
        const obj = new EquipoModels_1.UserEquipo();
        const lista = await obj.listarEquipos();
        res.status(200).json({ success: true, message: "Equipos encontrados.", data: lista });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message || "Error interno del servidor." });
    }
};
exports.getEquipos = getEquipos;
const getEquipoPorId = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            res.status(400).json({ success: false, message: "ID no válido." });
            return;
        }
        const obj = new EquipoModels_1.UserEquipo();
        const equipo = await obj.obtenerPorId(id);
        if (!equipo) {
            res.status(404).json({ success: false, message: "Equipo no encontrado." });
            return;
        }
        res.status(200).json({ success: true, data: equipo });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message || "Error interno del servidor." });
    }
};
exports.getEquipoPorId = getEquipoPorId;
const postEquipo = async (req, res) => {
    try {
        const validated = exports.equipoSchema.parse(req.body);
        const obj = new EquipoModels_1.UserEquipo(validated);
        const result = await obj.insertarEquipo();
        if (result.success) {
            res.status(201).json({ success: true, message: result.message, data: result.equipo });
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
exports.postEquipo = postEquipo;
const putEquipo = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            res.status(400).json({ success: false, message: "ID no válido." });
            return;
        }
        const obj = new EquipoModels_1.UserEquipo({ id, ...req.body });
        const result = await obj.editarEquipo();
        if (result.success) {
            res.status(200).json({ success: true, message: result.message, data: result.equipo });
        }
        else {
            res.status(400).json({ success: false, message: result.message });
        }
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message || "Error interno del servidor." });
    }
};
exports.putEquipo = putEquipo;
const deleteEquipo = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            res.status(400).json({ success: false, message: "ID no válido." });
            return;
        }
        const obj = new EquipoModels_1.UserEquipo();
        const result = await obj.eliminarEquipo(id);
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
exports.deleteEquipo = deleteEquipo;
