import { Request, Response } from "express";
import { UserPublicacion } from "../Models/PublicacionModels";
import { RequestAutenticado } from "../Middlewares/AuthMiddleware";
import { z } from "zod";
import { zCleanString, zCleanOptionalString } from "../Utils/sanitizer";

// Normalizadores para enums de base de datos
const normalizeTipoIndumentaria = z.preprocess((val) => {
  if (!val) return val;
  if (val === "portero") return "arquero";
  return val;
}, z.enum(["local", "visitante", "tercera", "cuarta", "arquero", "edicion_especial", "entrenamiento"]).optional().nullable());

const normalizeTipoEdicion = z.preprocess((val) => {
  if (!val) return val;
  if (val === "hincha_replica") return "aficionado_estadio";
  if (val === "edicion_limitada") return "reedicion_retro";
  if (val === "match_worn") return "jugador_version_profesional";
  return val;
}, z.enum(["aficionado_estadio", "jugador_version_profesional", "reedicion_retro"]));

const normalizeTipoEdicionOptional = z.preprocess((val) => {
  if (!val) return val;
  if (val === "hincha_replica") return "aficionado_estadio";
  if (val === "edicion_limitada") return "reedicion_retro";
  if (val === "match_worn") return "jugador_version_profesional";
  return val;
}, z.enum(["aficionado_estadio", "jugador_version_profesional", "reedicion_retro"]).optional().nullable());

const normalizeAutenticidad = z.preprocess((val) => {
  if (!val) return val;
  if (val === "copia_no_oficial") return "replica_no_oficial";
  return val;
}, z.enum(["original_oficial", "replica_autorizada", "reedicion_retro", "replica_no_oficial"]));

const normalizeAutenticidadOptional = z.preprocess((val) => {
  if (!val) return val;
  if (val === "copia_no_oficial") return "replica_no_oficial";
  return val;
}, z.enum(["original_oficial", "replica_autorizada", "reedicion_retro", "replica_no_oficial"]).optional().nullable());

const normalizeEstadoPrenda = z.preprocess((val) => {
  if (!val) return val;
  if (val === "como_nueva") return "usada_como_nueva";
  if (val === "buen_estado") return "usada_buen_estado";
  if (val === "uso_visible") return "usada_estado_aceptable";
  return val;
}, z.enum([
  "nueva_con_etiqueta", "nueva_sin_etiqueta", "usada_como_nueva", "usada_buen_estado", "usada_estado_aceptable", "reliquia_coleccion"
]));

const normalizeEstadoPrendaOptional = z.preprocess((val) => {
  if (!val) return val;
  if (val === "como_nueva") return "usada_como_nueva";
  if (val === "buen_estado") return "usada_buen_estado";
  if (val === "uso_visible") return "usada_estado_aceptable";
  return val;
}, z.enum([
  "nueva_con_etiqueta", "nueva_sin_etiqueta", "usada_como_nueva", "usada_buen_estado", "usada_estado_aceptable", "reliquia_coleccion"
]).optional().nullable());

const normalizeGenero = z.preprocess((val) => {
  if (!val) return val;
  if (val === "nino") return "unisex";
  return val;
}, z.enum(["hombre", "mujer", "unisex"]).optional().nullable());

const normalizeTalla = z.preprocess((val) => {
  if (!val) return undefined;
  const s = String(val).trim().toUpperCase();
  if (s === "XXL") return "2XL";
  if (s === "XXXL") return "3XL";
  return s;
}, z.string().optional().nullable());

export const publicacionSchema = z.object({
  vendedor_id: zCleanOptionalString(100),
  modelo_camiseta_id: zCleanOptionalString(100),
  equipo_nombre: zCleanOptionalString(150),
  pais: zCleanOptionalString(100),
  marca: zCleanOptionalString(100),
  anio_temporada: z.union([z.number(), z.string()]).optional().nullable(),
  tipo_indumentaria: normalizeTipoIndumentaria,
  modelo_nombre: zCleanOptionalString(200),
  titulo: zCleanString(3, 200),
  descripcion: zCleanString(5, 5000),
  tipo_edicion: normalizeTipoEdicion,
  autenticidad: normalizeAutenticidad,
  estado_prenda: normalizeEstadoPrenda,
  cantidad_usos: z.preprocess((val) => {
    if (val === "" || val === null || val === undefined) return 0;
    const num = Number(val);
    return isNaN(num) ? 0 : num;
  }, z.number().int().min(0)).optional().nullable(),
  detalles_defectos: zCleanOptionalString(1000),
  genero: normalizeGenero,
  permite_envio_transportadora: z.boolean().optional(),
  permite_entrega_en_persona: z.boolean().optional(),
  ciudad_entrega_persona: zCleanOptionalString(100),
  zona_entrega_persona: zCleanOptionalString(150),
  imagen_portada: zCleanOptionalString(2000),
  imagen_url: zCleanOptionalString(2000),
  estado: z.enum(["borrador", "en_revision", "activa", "pausada", "agotada", "bloqueada_admin", "archivada"]).optional(),
  talla: normalizeTalla,
  precio: z.union([z.number(), z.string()]).optional(),
  stock: z.union([z.number(), z.string()]).optional(),
  nombre_estampado: zCleanOptionalString(100),
  numero_estampado: z.union([z.number(), z.string()]).optional().nullable(),
});

export const editarPublicacionSchema = z.object({
  equipo_nombre: zCleanOptionalString(150),
  pais: zCleanOptionalString(100),
  marca: zCleanOptionalString(100),
  anio_temporada: z.union([z.number(), z.string()]).optional().nullable(),
  tipo_indumentaria: normalizeTipoIndumentaria,
  modelo_nombre: zCleanOptionalString(200),
  titulo: zCleanString(3, 200).optional(),
  descripcion: zCleanString(5, 5000).optional(),
  tipo_edicion: normalizeTipoEdicionOptional,
  autenticidad: normalizeAutenticidadOptional,
  estado_prenda: normalizeEstadoPrendaOptional,
  cantidad_usos: z.preprocess((val) => {
    if (val === "" || val === null || val === undefined) return 0;
    const num = Number(val);
    return isNaN(num) ? 0 : num;
  }, z.number().int().min(0)).optional().nullable(),
  detalles_defectos: zCleanOptionalString(1000),
  genero: normalizeGenero,
  permite_envio_transportadora: z.boolean().optional(),
  permite_entrega_en_persona: z.boolean().optional(),
  ciudad_entrega_persona: zCleanOptionalString(100),
  zona_entrega_persona: zCleanOptionalString(150),
  imagen_portada: zCleanOptionalString(2000),
  imagen_url: zCleanOptionalString(2000),
  estado: z.enum(["borrador", "en_revision", "activa", "pausada", "agotada", "bloqueada_admin", "archivada"]).optional(),
  talla: normalizeTalla,
  precio: z.union([z.number(), z.string()]).optional(),
  stock: z.union([z.number(), z.string()]).optional(),
  nombre_estampado: zCleanOptionalString(100),
  numero_estampado: z.union([z.number(), z.string()]).optional().nullable(),
});

export const getPublicaciones = async (req: Request, res: Response): Promise<void> => {
  try {
    const estado = req.query.estado as string | undefined;
    const vendedor_id = req.query.vendedor_id as string | undefined;
    const search = (req.query.search || req.query.q) as string | undefined;
    const pais = req.query.pais as string | undefined;
    const tipo_indumentaria = req.query.tipo_indumentaria as string | undefined;
    const estado_prenda = req.query.estado_prenda as string | undefined;
    const min_precio = req.query.min_precio ? Number(req.query.min_precio) : undefined;
    const max_precio = req.query.max_precio ? Number(req.query.max_precio) : undefined;
    const sort = req.query.sort as string | undefined;

    const obj = new UserPublicacion();
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
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Error interno del servidor." });
  }
};

export const getPublicacionPorId = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const obj = new UserPublicacion();
    const publicacion = await obj.obtenerPorId(id);

    if (!publicacion) {
      res.status(404).json({ success: false, message: "Publicación no encontrada." });
      return;
    }

    res.status(200).json({ success: true, data: publicacion });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Error interno del servidor." });
  }
};

export const postPublicacion = async (req: RequestAutenticado, res: Response): Promise<void> => {
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

    const validated = publicacionSchema.parse(bodyData);
    const obj = new UserPublicacion(validated as any);
    const result = await obj.insertarPublicacion();

    if (result.success) {
      res.status(201).json({ success: true, message: result.message, data: result.publicacion });
    } else {
      res.status(400).json({ success: false, message: result.message });
    }
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, message: "Datos inválidos.", errors: error.format() });
    } else {
      console.error("Error en postPublicacion:", error);
      res.status(500).json({ success: false, message: error.message || "Error interno del servidor." });
    }
  }
};

export const putPublicacion = async (req: RequestAutenticado, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const tiendaId = req.usuario?.roles?.tienda?.id;
    const esAdmin = !!req.usuario?.roles?.es_admin;

    if (!tiendaId && !esAdmin) {
      res.status(403).json({ success: false, message: "No tienes permisos de vendedor o administrador." });
      return;
    }

    const validated = editarPublicacionSchema.parse(req.body);
    const obj = new UserPublicacion({ id, ...(validated as any) });
    const result = await obj.editarPublicacion(tiendaId, esAdmin);

    if (result.success) {
      res.status(200).json({ success: true, message: result.message, data: result.publicacion });
    } else {
      const status = result.message.includes("permisos") || result.message.includes("denegado") ? 403 : 400;
      res.status(status).json({ success: false, message: result.message });
    }
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, message: "Datos inválidos.", errors: error.format() });
    } else {
      res.status(500).json({ success: false, message: error.message || "Error interno del servidor." });
    }
  }
};

export const deletePublicacion = async (req: RequestAutenticado, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const tiendaId = req.usuario?.roles?.tienda?.id;
    const esAdmin = !!req.usuario?.roles?.es_admin;

    if (!tiendaId && !esAdmin) {
      res.status(403).json({ success: false, message: "No tienes permisos de vendedor o administrador." });
      return;
    }

    const obj = new UserPublicacion();
    const result = await obj.eliminarPublicacion(id, tiendaId, esAdmin);

    if (result.success) {
      res.status(200).json({ success: true, message: result.message });
    } else {
      const status = result.message.includes("permisos") || result.message.includes("denegado") ? 403 : 400;
      res.status(status).json({ success: false, message: result.message });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Error interno del servidor." });
  }
};
