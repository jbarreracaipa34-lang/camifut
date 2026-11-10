"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deletePublicacion = exports.putPublicacion = exports.postPublicacion = exports.getPublicacionPorId = exports.getPublicaciones = exports.editarPublicacionSchema = exports.publicacionSchema = void 0;
const PublicacionModels_1 = require("../Models/PublicacionModels");
const zod_1 = require("zod");
const sanitizer_1 = require("../Utils/sanitizer");
// Normalizadores para enums de base de datos
const normalizeTipoIndumentaria = zod_1.z.preprocess((val) => {
    if (!val)
        return val;
    if (val === "portero")
        return "arquero";
    return val;
}, zod_1.z.enum(["local", "visitante", "tercera", "cuarta", "arquero", "edicion_especial", "entrenamiento"]).optional().nullable());
const normalizeTipoEdicion = zod_1.z.preprocess((val) => {
    if (!val)
        return val;
    if (val === "hincha_replica")
        return "aficionado_estadio";
    if (val === "edicion_limitada")
        return "reedicion_retro";
    if (val === "match_worn")
        return "jugador_version_profesional";
    return val;
}, zod_1.z.enum(["aficionado_estadio", "jugador_version_profesional", "reedicion_retro"]));
const normalizeTipoEdicionOptional = zod_1.z.preprocess((val) => {
    if (!val)
        return val;
    if (val === "hincha_replica")
        return "aficionado_estadio";
    if (val === "edicion_limitada")
        return "reedicion_retro";
    if (val === "match_worn")
        return "jugador_version_profesional";
    return val;
}, zod_1.z.enum(["aficionado_estadio", "jugador_version_profesional", "reedicion_retro"]).optional().nullable());
const normalizeAutenticidad = zod_1.z.preprocess((val) => {
    if (!val)
        return val;
    if (val === "copia_no_oficial")
        return "replica_no_oficial";
    return val;
}, zod_1.z.enum(["original_oficial", "replica_autorizada", "reedicion_retro", "replica_no_oficial"]));
const normalizeAutenticidadOptional = zod_1.z.preprocess((val) => {
    if (!val)
        return val;
    if (val === "copia_no_oficial")
        return "replica_no_oficial";
    return val;
}, zod_1.z.enum(["original_oficial", "replica_autorizada", "reedicion_retro", "replica_no_oficial"]).optional().nullable());
const normalizeEstadoPrenda = zod_1.z.preprocess((val) => {
    if (!val)
        return val;
    if (val === "como_nueva")
        return "usada_como_nueva";
    if (val === "buen_estado")
        return "usada_buen_estado";
    if (val === "uso_visible")
        return "usada_estado_aceptable";
    return val;
}, zod_1.z.enum([
    "nueva_con_etiqueta", "nueva_sin_etiqueta", "usada_como_nueva", "usada_buen_estado", "usada_estado_aceptable", "reliquia_coleccion"
]));
const normalizeEstadoPrendaOptional = zod_1.z.preprocess((val) => {
    if (!val)
        return val;
    if (val === "como_nueva")
        return "usada_como_nueva";
    if (val === "buen_estado")
        return "usada_buen_estado";
    if (val === "uso_visible")
        return "usada_estado_aceptable";
    return val;
}, zod_1.z.enum([
    "nueva_con_etiqueta", "nueva_sin_etiqueta", "usada_como_nueva", "usada_buen_estado", "usada_estado_aceptable", "reliquia_coleccion"
]).optional().nullable());
const normalizeGenero = zod_1.z.preprocess((val) => {
    if (!val)
        return val;
    if (val === "nino")
        return "unisex";
    return val;
}, zod_1.z.enum(["hombre", "mujer", "unisex"]).optional().nullable());
const normalizeTalla = zod_1.z.preprocess((val) => {
    if (!val)
        return undefined;
    const s = String(val).trim().toUpperCase();
    if (s === "XXL")
        return "2XL";
    if (s === "XXXL")
        return "3XL";
    return s;
}, zod_1.z.string().optional().nullable());
exports.publicacionSchema = zod_1.z.object({
    vendedor_id: (0, sanitizer_1.zCleanOptionalString)(100),
    modelo_camiseta_id: (0, sanitizer_1.zCleanOptionalString)(100),
    equipo_nombre: (0, sanitizer_1.zCleanOptionalString)(150),
    pais: (0, sanitizer_1.zCleanOptionalString)(100),
    marca: (0, sanitizer_1.zCleanOptionalString)(100),
    anio_temporada: zod_1.z.union([zod_1.z.number(), zod_1.z.string()]).optional().nullable(),
    tipo_indumentaria: normalizeTipoIndumentaria,
    modelo_nombre: (0, sanitizer_1.zCleanOptionalString)(200),
    titulo: (0, sanitizer_1.zCleanString)(3, 200),
    descripcion: (0, sanitizer_1.zCleanString)(5, 5000),
    tipo_edicion: normalizeTipoEdicion,
    autenticidad: normalizeAutenticidad,
    estado_prenda: normalizeEstadoPrenda,
    cantidad_usos: zod_1.z.preprocess((val) => {
        if (val === "" || val === null || val === undefined)
            return 0;
        const num = Number(val);
        return isNaN(num) ? 0 : num;
    }, zod_1.z.number().int().min(0)).optional().nullable(),
    detalles_defectos: (0, sanitizer_1.zCleanOptionalString)(1000),
    genero: normalizeGenero,
    permite_envio_transportadora: zod_1.z.boolean().optional(),
    permite_entrega_en_persona: zod_1.z.boolean().optional(),
    ciudad_entrega_persona: (0, sanitizer_1.zCleanOptionalString)(100),
    zona_entrega_persona: (0, sanitizer_1.zCleanOptionalString)(150),
    imagen_portada: (0, sanitizer_1.zCleanOptionalString)(2000),
    imagen_url: (0, sanitizer_1.zCleanOptionalString)(2000),
    estado: zod_1.z.enum(["borrador", "en_revision", "activa", "pausada", "agotada", "bloqueada_admin", "archivada"]).optional(),
    talla: normalizeTalla,
    precio: zod_1.z.union([zod_1.z.number(), zod_1.z.string()]).optional(),
    stock: zod_1.z.union([zod_1.z.number(), zod_1.z.string()]).optional(),
    nombre_estampado: (0, sanitizer_1.zCleanOptionalString)(100),
    numero_estampado: zod_1.z.union([zod_1.z.number(), zod_1.z.string()]).optional().nullable(),
});
exports.editarPublicacionSchema = zod_1.z.object({
    equipo_nombre: (0, sanitizer_1.zCleanOptionalString)(150),
    pais: (0, sanitizer_1.zCleanOptionalString)(100),
    marca: (0, sanitizer_1.zCleanOptionalString)(100),
    anio_temporada: zod_1.z.union([zod_1.z.number(), zod_1.z.string()]).optional().nullable(),
    tipo_indumentaria: normalizeTipoIndumentaria,
    modelo_nombre: (0, sanitizer_1.zCleanOptionalString)(200),
    titulo: (0, sanitizer_1.zCleanString)(3, 200).optional(),
    descripcion: (0, sanitizer_1.zCleanString)(5, 5000).optional(),
    tipo_edicion: normalizeTipoEdicionOptional,
    autenticidad: normalizeAutenticidadOptional,
    estado_prenda: normalizeEstadoPrendaOptional,
    cantidad_usos: zod_1.z.preprocess((val) => {
        if (val === "" || val === null || val === undefined)
            return 0;
        const num = Number(val);
        return isNaN(num) ? 0 : num;
    }, zod_1.z.number().int().min(0)).optional().nullable(),
    detalles_defectos: (0, sanitizer_1.zCleanOptionalString)(1000),
    genero: normalizeGenero,
    permite_envio_transportadora: zod_1.z.boolean().optional(),
    permite_entrega_en_persona: zod_1.z.boolean().optional(),
    ciudad_entrega_persona: (0, sanitizer_1.zCleanOptionalString)(100),
    zona_entrega_persona: (0, sanitizer_1.zCleanOptionalString)(150),
    imagen_portada: (0, sanitizer_1.zCleanOptionalString)(2000),
    imagen_url: (0, sanitizer_1.zCleanOptionalString)(2000),
    estado: zod_1.z.enum(["borrador", "en_revision", "activa", "pausada", "agotada", "bloqueada_admin", "archivada"]).optional(),
    talla: normalizeTalla,
    precio: zod_1.z.union([zod_1.z.number(), zod_1.z.string()]).optional(),
    stock: zod_1.z.union([zod_1.z.number(), zod_1.z.string()]).optional(),
    nombre_estampado: (0, sanitizer_1.zCleanOptionalString)(100),
    numero_estampado: zod_1.z.union([zod_1.z.number(), zod_1.z.string()]).optional().nullable(),
});
const getPublicaciones = async (req, res) => {
    try {
        const estado = req.query.estado;
        const vendedor_id = req.query.vendedor_id;
        const search = (req.query.search || req.query.q);
        const pais = req.query.pais;
        const tipo_indumentaria = req.query.tipo_indumentaria;
        const estado_prenda = req.query.estado_prenda;
        const min_precio = req.query.min_precio ? Number(req.query.min_precio) : undefined;
        const max_precio = req.query.max_precio ? Number(req.query.max_precio) : undefined;
        const sort = req.query.sort;
        const obj = new PublicacionModels_1.UserPublicacion();
        const lista = await obj.listarPublicaciones({
            estado,
            vendedor_id,
            search,
            pais,
            tipo_indumentaria,
            estado_prenda,
            min_precio,
            max_precio,
            sort,
        });
        res.status(200).json({ success: true, count: lista.length, data: lista });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message || "Error interno del servidor." });
    }
};
exports.getPublicaciones = getPublicaciones;
const getPublicacionPorId = async (req, res) => {
    try {
        const id = req.params.id;
        const obj = new PublicacionModels_1.UserPublicacion();
        const publicacion = await obj.obtenerPorId(id);
        if (!publicacion) {
            res.status(404).json({ success: false, message: "Publicación no encontrada." });
            return;
        }
        res.status(200).json({ success: true, data: publicacion });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message || "Error interno del servidor." });
    }
};
exports.getPublicacionPorId = getPublicacionPorId;
const postPublicacion = async (req, res) => {
    try {
        const tiendaId = req.usuario?.roles?.tienda?.id;
        const bodyData = { ...req.body };
        if (tiendaId) {
            bodyData.vendedor_id = tiendaId;
        }
        if (!bodyData.vendedor_id) {
            res.status(400).json({ success: false, message: "No se pudo identificar la tienda del vendedor. Inicia sesión nuevamente." });
            return;
        }
        const validated = exports.publicacionSchema.parse(bodyData);
        const obj = new PublicacionModels_1.UserPublicacion(validated);
        const result = await obj.insertarPublicacion();
        if (result.success) {
            res.status(201).json({ success: true, message: result.message, data: result.publicacion });
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
            console.error("Error en postPublicacion:", error);
            res.status(500).json({ success: false, message: error.message || "Error interno del servidor." });
        }
    }
};
exports.postPublicacion = postPublicacion;
const putPublicacion = async (req, res) => {
    try {
        const id = req.params.id;
        const tiendaId = req.usuario?.roles?.tienda?.id;
        const esAdmin = !!req.usuario?.roles?.es_admin;
        if (!tiendaId && !esAdmin) {
            res.status(403).json({ success: false, message: "No tienes permisos de vendedor o administrador." });
            return;
        }
        const validated = exports.editarPublicacionSchema.parse(req.body);
        const obj = new PublicacionModels_1.UserPublicacion({ id, ...validated });
        const result = await obj.editarPublicacion(tiendaId, esAdmin);
        if (result.success) {
            res.status(200).json({ success: true, message: result.message, data: result.publicacion });
        }
        else {
            const status = result.message.includes("permisos") || result.message.includes("denegado") ? 403 : 400;
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
exports.putPublicacion = putPublicacion;
const deletePublicacion = async (req, res) => {
    try {
        const id = req.params.id;
        const tiendaId = req.usuario?.roles?.tienda?.id;
        const esAdmin = !!req.usuario?.roles?.es_admin;
        if (!tiendaId && !esAdmin) {
            res.status(403).json({ success: false, message: "No tienes permisos de vendedor o administrador." });
            return;
        }
        const obj = new PublicacionModels_1.UserPublicacion();
        const result = await obj.eliminarPublicacion(id, tiendaId, esAdmin);
        if (result.success) {
            res.status(200).json({ success: true, message: result.message });
        }
        else {
            const status = result.message.includes("permisos") || result.message.includes("denegado") ? 403 : 400;
            res.status(status).json({ success: false, message: result.message });
        }
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message || "Error interno del servidor." });
    }
};
exports.deletePublicacion = deletePublicacion;
