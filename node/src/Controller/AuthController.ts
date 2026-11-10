import { Request, Response } from "express";
import { AuthModel } from "../Models/AuthModels";
import { z } from "zod";
import { zCleanString, zCleanOptionalString } from "../Utils/sanitizer";
import { RequestAutenticado } from "../Middlewares/AuthMiddleware";

export const loginSchema = z.object({
  email: z.string().trim().email("Correo electrónico no válido"),
  password: z.string().min(1, "La contraseña es requerida"),
});

export const registroSchema = z.object({
  email: z.string().trim().email("Correo electrónico no válido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  nombres: zCleanString(2, 100),
  apellidos: zCleanString(2, 100),
  telefono: zCleanOptionalString(50),
  nombre_tienda: zCleanOptionalString(150),
});

export const convertirVendedorSchema = z.object({
  usuario_id: z.string().min(1, "ID de usuario no válido"),
  nombre_tienda: zCleanString(3, 150),
});

export const asignarRolAdminSchema = z.object({
  usuario_id: z.string().min(1, "ID de usuario no válido"),
  rol: z.enum(["admin", "superadmin", "moderador", "soporte"]),
});

export const crearAdminSchema = z.object({
  email: z.string().trim().email("Correo electrónico no válido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  nombres: zCleanString(2, 100),
  apellidos: zCleanString(2, 100),
  telefono: zCleanOptionalString(50),
  rol: z.enum(["admin", "superadmin", "moderador", "soporte"]).optional(),
});

export const cambiarEstadoUsuarioSchema = z.object({
  usuario_id: z.string().uuid("ID de usuario no válido"),
  activo: z.boolean(),
});

export const postLogin = async (req: Request, res: Response) => {
  try {
    const credenciales = loginSchema.parse(req.body);
    const auth = new AuthModel();
    const result = await auth.login(credenciales);

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(401).json(result);
    }
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, message: "Datos inválidos.", errors: error.format() });
    } else {
      res.status(500).json({ success: false, message: error.message || "Error interno del servidor." });
    }
  }
};

export const postRegistro = async (req: Request, res: Response) => {
  try {
    const datos = registroSchema.parse(req.body);
    const auth = new AuthModel();
    const result = await auth.registro(datos);

    if (result.success) {
      res.status(201).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, message: "Datos inválidos.", errors: error.format() });
    } else {
      res.status(500).json({ success: false, message: error.message || "Error interno del servidor." });
    }
  }
};

export const postConvertirEnVendedor = async (req: Request, res: Response) => {
  try {
    const { usuario_id, nombre_tienda } = convertirVendedorSchema.parse(req.body);
    const auth = new AuthModel();
    const result = await auth.convertirEnVendedor(usuario_id, nombre_tienda);

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, message: "Datos inválidos.", errors: error.format() });
    } else {
      res.status(500).json({ success: false, message: error.message || "Error interno del servidor." });
    }
  }
};

export const postAsignarRolAdmin = async (req: Request, res: Response) => {
  try {
    const usuarioAutenticado = (req as RequestAutenticado).usuario;
    const rolEjecutor = usuarioAutenticado?.roles?.rol_principal || "admin";

    if (rolEjecutor !== "superadmin") {
      res.status(403).json({
        success: false,
        message: "Acceso denegado: Solo un Superadmin puede asignar o ascender roles administrativos.",
      });
      return;
    }

    const { usuario_id, rol } = asignarRolAdminSchema.parse(req.body);
    const auth = new AuthModel();
    const result = await auth.asignarRolAdmin(usuario_id, rol, rolEjecutor);

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, message: "Datos inválidos.", errors: error.format() });
    } else {
      res.status(500).json({ success: false, message: error.message || "Error interno del servidor." });
    }
  }
};

export const getPerfil = async (req: Request, res: Response) => {
  try {
    const usuario = (req as any).usuario;
    if (!usuario) {
      res.status(401).json({ success: false, message: "No autenticado." });
      return;
    }
    res.status(200).json({ success: true, data: usuario });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Error interno del servidor." });
  }
};

export const postCrearAdmin = async (req: Request, res: Response) => {
  try {
    const usuarioAutenticado = (req as RequestAutenticado).usuario;
    const rolEjecutor =
      usuarioAutenticado?.roles?.rol_principal ||
      (usuarioAutenticado?.roles?.es_superadmin ? "superadmin" : "admin");

    const datos = crearAdminSchema.parse(req.body);

    // Validación jerárquica explícita
    const rolDeseado = datos.rol || "moderador";
    if (rolEjecutor !== "superadmin" && (rolDeseado === "superadmin" || rolDeseado === "admin")) {
      res.status(403).json({
        success: false,
        message: `Acceso denegado: Los administradores solo pueden crear roles subordinados (moderador, soporte). No puedes crear un usuario '${rolDeseado}'.`,
      });
      return;
    }

    const auth = new AuthModel();
    const result = await auth.crearUsuarioStaff(
      { ...datos, rol: rolDeseado, telefono: datos.telefono ?? undefined },
      rolEjecutor
    );

    if (result.success) {
      res.status(201).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, message: "Datos inválidos.", errors: error.format() });
    } else {
      res.status(500).json({ success: false, message: error.message || "Error interno del servidor." });
    }
  }
};

export const getUsuarios = async (req: Request, res: Response) => {
  try {
    const busqueda = req.query.busqueda as string | undefined;
    const rol = req.query.rol as string | undefined;
    const auth = new AuthModel();
    const lista = await auth.listarUsuarios({ busqueda, rol });
    res.status(200).json({ success: true, data: lista });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Error interno del servidor." });
  }
};

export const postCambiarEstadoUsuario = async (req: Request, res: Response) => {
  try {
    const usuarioAutenticado = (req as RequestAutenticado).usuario;
    const rolEjecutor =
      usuarioAutenticado?.roles?.rol_principal ||
      (usuarioAutenticado?.roles?.es_superadmin ? "superadmin" : "admin");

    const { usuario_id, activo } = cambiarEstadoUsuarioSchema.parse(req.body);

    if (usuarioAutenticado?.id === usuario_id && !activo) {
      res.status(400).json({ success: false, message: "No puedes desactivar tu propia cuenta." });
      return;
    }

    const auth = new AuthModel();
    const result = await auth.cambiarEstadoUsuario(usuario_id, activo, rolEjecutor);

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(403).json(result);
    }
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, message: "Datos inválidos.", errors: error.format() });
    } else {
      res.status(500).json({ success: false, message: error.message || "Error interno del servidor." });
    }
  }
};
