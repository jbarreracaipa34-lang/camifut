// @ts-nocheck
import { Request, Response } from "express";
import { UserEquipo } from "../Models/EquipoModels";
import { z } from "zod";

export const equipoSchema = z.object({
  nombre: z.string().min(2),
  nombre_corto: z.string().optional().nullable(),
  slug: z.string().min(2),
  pais: z.string().min(2),
  tipo_equipo: z.enum(["club", "seleccion_nacional"]).optional(),
  escudo_url: z.string().optional().nullable(),
});

export const getEquipos = async (req: Request, res: Response) => {
  try {
    const obj = new UserEquipo();
    const lista = await obj.listarEquipos();
    res.status(200).json({ success: true, message: "Equipos encontrados.", data: lista });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Error interno del servidor." });
  }
};

export const getEquipoPorId = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ success: false, message: "ID no válido." });
      return;
    }
    const obj = new UserEquipo();
    const equipo = await obj.obtenerPorId(id);

    if (!equipo) {
      res.status(404).json({ success: false, message: "Equipo no encontrado." });
      return;
    }

    res.status(200).json({ success: true, data: equipo });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Error interno del servidor." });
  }
};

export const postEquipo = async (req: Request, res: Response) => {
  try {
    const validated = equipoSchema.parse(req.body);
    const obj = new UserEquipo(validated);
    const result = await obj.insertarEquipo();

    if (result.success) {
      res.status(201).json({ success: true, message: result.message, data: result.equipo });
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

export const putEquipo = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ success: false, message: "ID no válido." });
      return;
    }
    const obj = new UserEquipo({ id, ...req.body });
    const result = await obj.editarEquipo();

    if (result.success) {
      res.status(200).json({ success: true, message: result.message, data: result.equipo });
    } else {
      res.status(400).json({ success: false, message: result.message });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Error interno del servidor." });
  }
};

export const deleteEquipo = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ success: false, message: "ID no válido." });
      return;
    }
    const obj = new UserEquipo();
    const result = await obj.eliminarEquipo(id);

    if (result.success) {
      res.status(200).json({ success: true, message: result.message });
    } else {
      res.status(400).json({ success: false, message: result.message });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Error interno del servidor." });
  }
};
