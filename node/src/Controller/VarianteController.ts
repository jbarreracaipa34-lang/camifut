import { Request, Response } from "express";
import { UserVariante } from "../Models/VarianteModels";
import { RequestAutenticado } from "../Middlewares/AuthMiddleware";
import { z } from "zod";
import { zCleanOptionalString } from "../Utils/sanitizer";

export const varianteSchema = z.object({
  publicacion_id: z.string().trim().min(1, "ID de publicación requerido"),
  sku: zCleanOptionalString(100),
  talla: z.enum([
    "2XS", "XS", "S", "M", "L", "XL", "2XL", "3XL", "4XL",
    "NINO_2", "NINO_4", "NINO_6", "NINO_8", "NINO_10", "NINO_12", "NINO_14", "NINO_16"
  ]),
  color_id: z.number().int().optional().nullable(),
  nombre_estampado: zCleanOptionalString(100),
  numero_estampado: z.number().int().min(0).max(99).optional().nullable(),
  precio: z.number().positive("El precio debe ser positivo"),
  stock: z.number().int().min(0, "El stock no puede ser negativo"),
});

export const editarVarianteSchema = z.object({
  precio: z.number().positive("El precio debe ser positivo").optional(),
  stock: z.number().int().min(0, "El stock no puede ser negativo").optional(),
});

export const getVariantesPorPublicacion = async (req: Request, res: Response): Promise<void> => {
  try {
    const publicacionId = req.params.publicacionId as string;
    const obj = new UserVariante();
    const lista = await obj.listarPorPublicacion(publicacionId);
    res.status(200).json({ success: true, message: "Variantes encontradas.", data: lista });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Error interno del servidor." });
  }
};

export const postVariante = async (req: RequestAutenticado, res: Response): Promise<void> => {
  try {
    const tiendaId = req.usuario?.roles?.tienda?.id;
    const esAdmin = !!req.usuario?.roles?.es_admin;

    const validated = varianteSchema.parse(req.body);
    const obj = new UserVariante(validated as any);
    const result = await obj.insertarVariante(tiendaId, esAdmin);

    if (result.success) {
      res.status(201).json({ success: true, message: result.message, data: result.variante });
    } else {
      const status = result.message.includes("denegado") ? 403 : 400;
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

export const putVariante = async (req: RequestAutenticado, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const tiendaId = req.usuario?.roles?.tienda?.id;
    const esAdmin = !!req.usuario?.roles?.es_admin;

    const validated = editarVarianteSchema.parse(req.body);
    const obj = new UserVariante({ id, ...validated } as any);
    const result = await obj.editarVariante(tiendaId, esAdmin);

    if (result.success) {
      res.status(200).json({ success: true, message: result.message, data: result.variante });
    } else {
      const status = result.message.includes("denegado") ? 403 : 400;
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

export const deleteVariante = async (req: RequestAutenticado, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const tiendaId = req.usuario?.roles?.tienda?.id;
    const esAdmin = !!req.usuario?.roles?.es_admin;

    const obj = new UserVariante();
    const result = await obj.eliminarVariante(id, tiendaId, esAdmin);

    if (result.success) {
      res.status(200).json({ success: true, message: result.message });
    } else {
      const status = result.message.includes("denegado") ? 403 : 400;
      res.status(status).json({ success: false, message: result.message });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Error interno del servidor." });
  }
};
