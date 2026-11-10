import { Request, Response } from "express";
import { UserUsuario } from "../Models/UsuarioModels";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { zCleanString, zCleanOptionalString } from "../Utils/sanitizer";
import { RequestAutenticado, JERARQUIA_ROLES } from "../Middlewares/AuthMiddleware";
import { pool } from "../Models/Conexion";

export const usuarioSchema = z.object({
  email: z.string().trim().email("Correo electrónico no válido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  nombres: zCleanString(2, 100),
  apellidos: zCleanString(2, 100),
  telefono: zCleanOptionalString(50),
});

export const editarUsuarioSchema = z.object({
  nombres: zCleanString(2, 100).optional(),
  apellidos: zCleanString(2, 100).optional(),
  telefono: zCleanOptionalString(50),
});

export const getUsuarios = async (req: Request, res: Response): Promise<void> => {
  try {
    const obj = new UserUsuario();
    const lista = await obj.listarUsuarios();
    res.status(200).json({ success: true, message: "Usuarios encontrados.", data: lista });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Error interno del servidor." });
  }
};

export const getUsuarioPorId = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const authUser = (req as RequestAutenticado).usuario;

    // Permitir ver detalle a la propia persona o a cualquier staff
    const esPropio = authUser?.id === id;
    const esStaff = (authUser?.roles?.nivel_jerarquia ?? 0) >= 40 || authUser?.roles?.es_admin;

    if (!esPropio && !esStaff) {
      res.status(403).json({ success: false, message: "Acceso denegado al perfil de otro usuario." });
      return;
    }

    const obj = new UserUsuario();
    const usuario = await obj.obtenerPorId(id);

    if (!usuario) {
      res.status(404).json({ success: false, message: "Usuario no encontrado." });
      return;
    }

    res.status(200).json({ success: true, data: usuario });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Error interno del servidor." });
  }
};

export const postUsuario = async (req: Request, res: Response): Promise<void> => {
  try {
    const validated = usuarioSchema.parse(req.body);
    const passwordHash = await bcrypt.hash(validated.password, 10);
    const obj = new UserUsuario({
      email: validated.email,
      password_hash: passwordHash,
      nombres: validated.nombres,
      apellidos: validated.apellidos,
      telefono: validated.telefono ?? undefined,
    });
    const result = await obj.insertarUsuario();

    if (result.success) {
      res.status(201).json({ success: true, message: result.message, data: result.usuario });
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

export const putUsuario = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const authUser = (req as RequestAutenticado).usuario;
    const esPropio = authUser?.id === id;
    const rolEjecutor = authUser?.roles?.rol_principal || "comprador";

    if (!esPropio) {
      // Verificar rol del usuario objetivo
      const target = await pool.query(
        `SELECT u.id,
                COALESCE(
                  (SELECT ra.rol::text FROM roles_administrativos ra WHERE ra.usuario_id = u.id ORDER BY CASE ra.rol WHEN 'superadmin' THEN 1 WHEN 'admin' THEN 2 ELSE 3 END LIMIT 1),
                  CASE WHEN pv.id IS NOT NULL THEN 'vendedor' ELSE 'comprador' END
                ) as rol_principal
         FROM usuarios u
         LEFT JOIN perfiles_vendedor pv ON pv.usuario_id = u.id
         WHERE u.id = $1`,
        [id]
      );

      if (target.rows.length === 0) {
        res.status(404).json({ success: false, message: "Usuario no encontrado." });
        return;
      }

      const targetRol = target.rows[0].rol_principal;
      const nivelEjecutor = JERARQUIA_ROLES[rolEjecutor] || 0;
      const nivelTarget = JERARQUIA_ROLES[targetRol] || 0;

      if (rolEjecutor !== "superadmin" && nivelEjecutor <= nivelTarget) {
        res.status(403).json({
          success: false,
          message: `Acceso denegado: No tienes permisos jerárquicos para modificar a un '${targetRol}'.`,
        });
        return;
      }
    }

    const validated = editarUsuarioSchema.parse(req.body);
    const obj = new UserUsuario({ id, ...validated, telefono: validated.telefono ?? undefined } as any);
    const result = await obj.editarUsuario();

    if (result.success) {
      res.status(200).json({ success: true, message: result.message, data: result.usuario });
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

export const deleteUsuario = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const authUser = (req as RequestAutenticado).usuario;
    const rolEjecutor = authUser?.roles?.rol_principal || "admin";

    if (authUser?.id === id) {
      res.status(400).json({ success: false, message: "No puedes eliminar tu propia cuenta desde este panel." });
      return;
    }

    // Verificar rol del usuario objetivo
    const target = await pool.query(
      `SELECT u.id,
              COALESCE(
                (SELECT ra.rol::text FROM roles_administrativos ra WHERE ra.usuario_id = u.id ORDER BY CASE ra.rol WHEN 'superadmin' THEN 1 WHEN 'admin' THEN 2 ELSE 3 END LIMIT 1),
                CASE WHEN pv.id IS NOT NULL THEN 'vendedor' ELSE 'comprador' END
              ) as rol_principal
       FROM usuarios u
       LEFT JOIN perfiles_vendedor pv ON pv.usuario_id = u.id
       WHERE u.id = $1`,
      [id]
    );

    if (target.rows.length === 0) {
      res.status(404).json({ success: false, message: "Usuario no encontrado." });
      return;
    }

    const targetRol = target.rows[0].rol_principal;

    if (targetRol === "superadmin") {
      res.status(403).json({ success: false, message: "Acceso denegado: Ningún usuario puede eliminar a un Superadministrador." });
      return;
    }

    if (targetRol === "admin" && rolEjecutor !== "superadmin") {
      res.status(403).json({
        success: false,
        message: "Acceso denegado: Solo un Superadministrador puede dar de baja a un Administrador.",
      });
      return;
    }

    const obj = new UserUsuario();
    const result = await obj.eliminarUsuario(id);

    if (result.success) {
      res.status(200).json({ success: true, message: result.message });
    } else {
      res.status(400).json({ success: false, message: result.message });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Error interno del servidor." });
  }
};
