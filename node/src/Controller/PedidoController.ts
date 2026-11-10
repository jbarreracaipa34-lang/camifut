import { Request, Response } from "express";
import { UserPedido } from "../Models/PedidoModels";
import { RequestAutenticado } from "../Middlewares/AuthMiddleware";
import { z } from "zod";
import { zCleanOptionalString } from "../Utils/sanitizer";

export const actualizarEstadoSubpedidoSchema = z.object({
  estado: z.enum([
    "pendiente_despacho",
    "por_coordinar_entrega",
    "guia_generada",
    "en_camino",
    "listo_para_entrega_en_persona",
    "entregado",
    "cancelado",
    "devuelto"
  ]),
  comentario: zCleanOptionalString(500),
});

export const checkoutSchema = z.object({
  metodo_entrega: z.enum(["envio_transportadora", "entrega_en_persona"]).optional(),
  ciudad: zCleanOptionalString(100),
  direccion: zCleanOptionalString(250),
  punto_encuentro: zCleanOptionalString(200),
  telefono_contacto: zCleanOptionalString(50),
  comentarios: zCleanOptionalString(500),
});

export const getPedidosPorComprador = async (req: RequestAutenticado, res: Response): Promise<void> => {
  try {
    const compradorId = (req.usuario?.id || req.params.compradorId) as string;
    if (!compradorId) {
      res.status(400).json({ success: false, message: "ID de comprador no proporcionado." });
      return;
    }
    const obj = new UserPedido();
    const lista = await obj.listarPedidosPorComprador(compradorId);
    res.status(200).json({ success: true, message: "Pedidos encontrados.", data: lista });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Error interno del servidor." });
  }
};

export const getPedidosPorVendedor = async (req: RequestAutenticado, res: Response): Promise<void> => {
  try {
    const tiendaIdSolicitante = req.usuario?.roles?.tienda?.id;
    const esAdmin = !!req.usuario?.roles?.es_admin;
    const vendedorId = (req.params.vendedorId || tiendaIdSolicitante || req.usuario?.id) as string;

    if (!vendedorId) {
      res.status(400).json({ success: false, message: "ID de vendedor no proporcionado." });
      return;
    }

    const obj = new UserPedido();
    const lista = await obj.listarPedidosPorVendedor(vendedorId, tiendaIdSolicitante, esAdmin);
    res.status(200).json({ success: true, message: "Ventas del vendedor encontradas.", data: lista });
  } catch (error: any) {
    const status = error.message.includes("denegado") ? 403 : 500;
    res.status(status).json({ success: false, message: error.message || "Error interno del servidor." });
  }
};

export const getPedidosAdmin = async (req: RequestAutenticado, res: Response): Promise<void> => {
  try {
    const obj = new UserPedido();
    const lista = await obj.listarTodosLosPedidosAdmin();
    res.status(200).json({ success: true, message: "Todos los pedidos para administración.", data: lista });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Error interno del servidor." });
  }
};

export const getMetricasAdmin = async (req: RequestAutenticado, res: Response): Promise<void> => {
  try {
    const obj = new UserPedido();
    const metricas = await obj.obtenerMetricasPlataforma();
    res.status(200).json({ success: true, data: metricas });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Error interno del servidor." });
  }
};

export const getDisputasAdmin = async (req: RequestAutenticado, res: Response): Promise<void> => {
  try {
    const obj = new UserPedido();
    const disputas = await obj.listarDisputasAdmin();
    res.status(200).json({ success: true, data: disputas });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Error interno del servidor." });
  }
};

export const postCheckout = async (req: RequestAutenticado, res: Response): Promise<void> => {
  try {
    const compradorId = req.usuario?.id;
    if (!compradorId) {
      res.status(401).json({ success: false, message: "Usuario no autenticado para realizar checkout." });
      return;
    }

    const datosEnvioValidados = req.body ? checkoutSchema.parse(req.body) : {};
    const obj = new UserPedido();
    const result = await obj.checkout(compradorId, datosEnvioValidados);

    if (result.success) {
      res.status(201).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, message: "Datos de envío inválidos.", errors: error.format() });
    } else {
      res.status(500).json({ success: false, message: error.message || "Error interno del servidor." });
    }
  }
};

export const getPedidoPorId = async (req: RequestAutenticado, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const obj = new UserPedido();
    const pedido = await obj.obtenerPorId(id);

    if (!pedido) {
      res.status(404).json({ success: false, message: "Pedido no encontrado." });
      return;
    }

    res.status(200).json({ success: true, data: pedido });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Error interno del servidor." });
  }
};

export const patchEstadoSubpedido = async (req: RequestAutenticado, res: Response): Promise<void> => {
  try {
    const subpedidoId = req.params.subpedidoId as string;
    const tiendaId = req.usuario?.roles?.tienda?.id;
    const esAdmin = !!req.usuario?.roles?.es_admin;

    if (!tiendaId && !esAdmin) {
      res.status(403).json({ success: false, message: "Acceso denegado. Se requieren permisos de vendedor o administrador." });
      return;
    }

    const validated = actualizarEstadoSubpedidoSchema.parse(req.body);
    const obj = new UserPedido();
    const result = await obj.actualizarEstadoSubpedido(
      subpedidoId,
      validated.estado,
      validated.comentario || undefined,
      tiendaId,
      esAdmin
    );

    if (result.success) {
      res.status(200).json({ success: true, message: result.message });
    } else {
      const status = result.message.includes("denegado") ? 403 : 400;
      res.status(status).json({ success: false, message: result.message });
    }
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, message: "Estado no válido.", errors: error.format() });
    } else {
      res.status(500).json({ success: false, message: error.message || "Error interno del servidor." });
    }
  }
};
