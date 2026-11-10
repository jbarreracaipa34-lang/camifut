import { Request, Response } from "express";
import { UserCarrito } from "../Models/CarritoModels";
import { RequestAutenticado } from "../Middlewares/AuthMiddleware";
import { z } from "zod";
import { zCleanString, zCleanOptionalString } from "../Utils/sanitizer";

export const itemCarritoSchema = z.object({
  variante_id: z.string().trim().min(1, "ID de variante requerido"),
  cantidad: z.number().int().positive("La cantidad debe ser mayor a 0").max(10, "Máximo 10 unidades por prenda"),
  usuario_id: zCleanOptionalString(100),
  solicitud_nombre_personalizado: zCleanOptionalString(100),
  solicitud_numero_personalizado: z.number().int().min(0).max(99).optional().nullable(),
});

export const getCarritoPorUsuario = async (req: RequestAutenticado, res: Response): Promise<void> => {
  try {
    const usuarioId = (req.usuario?.id || req.params.usuarioId) as string;
    if (!usuarioId) {
      res.status(401).json({ success: false, message: "Usuario no autenticado." });
      return;
    }
    const obj = new UserCarrito();
    const carrito = await obj.obtenerCarritoPorUsuario(usuarioId);
    res.status(200).json({ success: true, data: carrito });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Error interno del servidor." });
  }
};

export const postItemCarrito = async (req: RequestAutenticado, res: Response): Promise<void> => {
  try {
    const usuarioIdJWT = req.usuario?.id;
    const validated = itemCarritoSchema.parse(req.body);
    const payload = {
      ...validated,
      usuario_id: usuarioIdJWT || validated.usuario_id,
    };

    if (!payload.usuario_id) {
      res.status(400).json({ success: false, message: "No se pudo identificar el usuario. Inicia sesión nuevamente." });
      return;
    }

    const obj = new UserCarrito(payload as any);
    const result = await obj.agregarItem();

    if (result.success) {
      res.status(201).json({ success: true, message: result.message, data: result.item });
    } else {
      res.status(400).json({ success: false, message: result.message });
    }
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, message: "Datos inválidos.", errors: error.format() });
    } else {
      res.status(500).json({ success: false, message: error.message || "Error interno del servidor." });
    }
  }
};

export const deleteItemCarrito = async (req: RequestAutenticado, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const obj = new UserCarrito();
    const result = await obj.eliminarItem(id);

    if (result.success) {
      res.status(200).json({ success: true, message: result.message });
    } else {
      res.status(400).json({ success: false, message: result.message });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Error interno del servidor." });
  }
};

export const deleteVaciarCarrito = async (req: RequestAutenticado, res: Response): Promise<void> => {
  try {
    const usuarioId = (req.usuario?.id || req.params.usuarioId) as string;
    if (!usuarioId) {
      res.status(401).json({ success: false, message: "Usuario no autenticado." });
      return;
    }
    const obj = new UserCarrito();
    const result = await obj.vaciarCarrito(usuarioId);

    if (result.success) {
      res.status(200).json({ success: true, message: result.message });
    } else {
      res.status(400).json({ success: false, message: result.message });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Error interno del servidor." });
  }
};
