import { Request, Response, NextFunction } from "express";
import crypto from "crypto";

const SECRET = process.env.JWT_SECRET || "camifut_secret_key_2026";

export const JERARQUIA_ROLES: Record<string, number> = {
  superadmin: 100,
  admin: 80,
  moderador: 60,
  soporte: 40,
  vendedor: 20,
  comprador: 10,
};

export interface TiendaAutenticada {
  id: string;
  nombre_tienda: string;
  slug: string;
  esta_verificado: boolean;
}

export interface RolesAutenticados {
  es_comprador: boolean;
  es_vendedor: boolean;
  es_admin: boolean;
  es_superadmin: boolean;
  es_moderador: boolean;
  es_soporte: boolean;
  roles_administrativos: string[];
  rol_principal: "superadmin" | "admin" | "moderador" | "soporte" | "vendedor" | "comprador";
  nivel_jerarquia: number;
  tienda?: TiendaAutenticada | null;
}

export interface UsuarioAutenticado {
  id: string;
  email: string;
  roles: RolesAutenticados;
}

export interface RequestAutenticado extends Request {
  usuario?: UsuarioAutenticado;
}

/**
 * 1. Validar que la petición tenga un token JWT válido y no expirado
 */
export const verificarAutenticacion = (
  req: RequestAutenticado,
  res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({
        success: false,
        message: "Acceso no autorizado. Se requiere un token Bearer en el encabezado Authorization.",
      });
      return;
    }

    const token = authHeader.split(" ")[1];
    const partes = token.split(".");

    if (partes.length !== 3) {
      res.status(401).json({ success: false, message: "Token con formato inválido." });
      return;
    }

    const [headerB64, payloadB64, signatureB64] = partes;

    // Verificar firma criptográfica HMAC SHA-256
    const signatureCalculada = crypto
      .createHmac("sha256", SECRET)
      .update(`${headerB64}.${payloadB64}`)
      .digest("base64url");

    if (signatureB64 !== signatureCalculada) {
      res.status(401).json({ success: false, message: "Token no válido o adulterado." });
      return;
    }

    // Decodificar payload
    const payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf-8"));

    // Comprobar expiración estricta
    const ahora = Math.floor(Date.now() / 1000);
    if (!payload.exp || payload.exp < ahora) {
      res.status(401).json({ success: false, message: "El token ha expirado. Inicie sesión nuevamente." });
      return;
    }

    req.usuario = {
      id: payload.id,
      email: payload.email,
      roles: payload.roles,
    };

    next();
  } catch (error: any) {
    res.status(401).json({
      success: false,
      message: "Error al validar la sesión.",
      error: error.message,
    });
  }
};

/**
 * 2. Requerir permisos de VENDEDOR con tienda activa
 */
export const requerirVendedor = (
  req: RequestAutenticado,
  res: Response,
  next: NextFunction
): void => {
  if (!req.usuario || !req.usuario.roles?.es_vendedor || !req.usuario.roles?.tienda?.id) {
    res.status(403).json({
      success: false,
      message: "Acceso denegado. Esta acción requiere permisos de vendedor con tienda activa.",
    });
    return;
  }
  next();
};

/**
 * 3. Requerir rol de SUPERADMIN exclusivo (Nivel 100)
 */
export const requerirSuperadmin = (
  req: RequestAutenticado,
  res: Response,
  next: NextFunction
): void => {
  const roles = req.usuario?.roles;
  const esSuper = roles?.es_superadmin || roles?.rol_principal === "superadmin" || roles?.roles_administrativos?.includes("superadmin");

  if (!req.usuario || !esSuper) {
    res.status(403).json({
      success: false,
      message: "Acceso denegado. Acción reservada exclusivamente para Superadministradores.",
    });
    return;
  }
  next();
};

/**
 * 4. Requerir permisos de ADMINISTRADOR (Superadmin o Admin) (Nivel >= 80)
 */
export const requerirAdmin = (
  req: RequestAutenticado,
  res: Response,
  next: NextFunction
): void => {
  const roles = req.usuario?.roles;
  const esAdmin = roles?.es_admin || roles?.es_superadmin || (roles?.nivel_jerarquia ?? 0) >= 80;

  if (!req.usuario || !esAdmin) {
    res.status(403).json({
      success: false,
      message: "Acceso denegado. Esta acción requiere permisos de administrador.",
    });
    return;
  }
  next();
};

/**
 * 5. Requerir permisos de MODERACIÓN (Superadmin, Admin o Moderador) (Nivel >= 60)
 */
export const requerirModerador = (
  req: RequestAutenticado,
  res: Response,
  next: NextFunction
): void => {
  const roles = req.usuario?.roles;
  const esMod =
    roles?.es_moderador ||
    roles?.es_admin ||
    roles?.es_superadmin ||
    roles?.roles_administrativos?.includes("moderador") ||
    (roles?.nivel_jerarquia ?? 0) >= 60;

  if (!req.usuario || !esMod) {
    res.status(403).json({
      success: false,
      message: "Acceso denegado. Esta acción requiere permisos de moderador o superior.",
    });
    return;
  }
  next();
};

/**
 * 6. Requerir cualquier rol STAFF del sistema (Superadmin, Admin, Moderador o Soporte) (Nivel >= 40)
 */
export const requerirStaff = (
  req: RequestAutenticado,
  res: Response,
  next: NextFunction
): void => {
  const roles = req.usuario?.roles;
  const esStaff =
    (roles?.roles_administrativos?.length ?? 0) > 0 ||
    roles?.es_admin ||
    roles?.es_superadmin ||
    roles?.es_moderador ||
    roles?.es_soporte ||
    (roles?.nivel_jerarquia ?? 0) >= 40;

  if (!req.usuario || !esStaff) {
    res.status(403).json({
      success: false,
      message: "Acceso denegado. Esta acción requiere pertenecer al personal administrativo de la plataforma.",
    });
    return;
  }
  next();
};

/**
 * Comprueba si un rol ejecutor puede actuar sobre o crear un rol objetivo
 */
export const puedeGestionarRol = (rolEjecutor: string, rolObjetivo: string): boolean => {
  if (rolEjecutor === "superadmin") return true; // Superadmin gestiona todos, incluso otros superadmin
  const nivelEjecutor = JERARQUIA_ROLES[rolEjecutor] || 0;
  const nivelObjetivo = JERARQUIA_ROLES[rolObjetivo] || 0;
  return nivelEjecutor > nivelObjetivo;
};
