// @ts-nocheck
import { Request, Response } from "express";
import { UserModeloCamiseta } from "../Models/ModeloCamisetaModels";
import { z } from "zod";

export const modeloCamisetaSchema = z.object({
  equipo_id: z.number().int().positive(),
  marca_id: z.number().int().positive(),
  anio_inicio_temporada: z.number().int().min(1900).max(2100),
  anio_fin_temporada: z.number().int().optional(),
  tipo_indumentaria: z.enum([
    "local", "visitante", "tercera", "cuarta", "arquero", "edicion_especial", "entrenamiento"
  ]),
  etiqueta_edicion: z.string().optional(),
  es_retro: z.boolean().optional(),
  nombre_canonico: z.string().min(3),
  descripcion: z.string().optional(),
});

export const getModelosCamiseta = async (req: Request, res: Response) => {
  try {
    const obj = new UserModeloCamiseta();
    const lista = await obj.listarModelos();
    res.status(200).json({ success: true, message: "Modelos encontrados.", data: lista });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Error interno del servidor." });
  }
};

export const getModeloCamisetaPorId = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const obj = new UserModeloCamiseta();
    const modelo = await obj.obtenerPorId(id);

    if (!modelo) {
      res.status(404).json({ success: false, message: "Modelo de camiseta no encontrado." });
      return;
    }

    res.status(200).json({ success: true, data: modelo });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Error interno del servidor." });
  }
};

export const postModeloCamiseta = async (req: Request, res: Response) => {
  try {
    const validated = modeloCamisetaSchema.parse(req.body);
    const obj = new UserModeloCamiseta(validated);
    const result = await obj.insertarModelo();

    if (result.success) {
      res.status(201).json({ success: true, message: result.message, data: result.modelo });
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

export const putModeloCamiseta = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const obj = new UserModeloCamiseta({ id, ...req.body });
    const result = await obj.editarModelo();

    if (result.success) {
      res.status(200).json({ success: true, message: result.message, data: result.modelo });
    } else {
      res.status(400).json({ success: false, message: result.message });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Error interno del servidor." });
  }
};

export const deleteModeloCamiseta = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const obj = new UserModeloCamiseta();
    const result = await obj.eliminarModelo(id);

    if (result.success) {
      res.status(200).json({ success: true, message: result.message });
    } else {
      res.status(400).json({ success: false, message: result.message });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Error interno del servidor." });
  }
};
