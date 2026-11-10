"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.puedeGestionarRol = exports.requerirStaff = exports.requerirModerador = exports.requerirAdmin = exports.requerirSuperadmin = exports.requerirVendedor = exports.verificarAutenticacion = exports.JERARQUIA_ROLES = void 0;
const crypto_1 = __importDefault(require("crypto"));
const SECRET = process.env.JWT_SECRET || "camifut_secret_key_2026";
exports.JERARQUIA_ROLES = {
    superadmin: 100,
    admin: 80,
    moderador: 60,
    soporte: 40,
    vendedor: 20,
    comprador: 10,
};
/**
 * 1. Validar que la petición tenga un token JWT válido y no expirado
 */
const verificarAutenticacion = (req, res, next) => {
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
        const signatureCalculada = crypto_1.default
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
    }
    catch (error) {
        res.status(401).json({
            success: false,
            message: "Error al validar la sesión.",
            error: error.message,
        });
    }
};
exports.verificarAutenticacion = verificarAutenticacion;
/**
 * 2. Requerir permisos de VENDEDOR con tienda activa
 */
const requerirVendedor = (req, res, next) => {
    if (!req.usuario || !req.usuario.roles?.es_vendedor || !req.usuario.roles?.tienda?.id) {
        res.status(403).json({
            success: false,
            message: "Acceso denegado. Esta acción requiere permisos de vendedor con tienda activa.",
        });
        return;
    }
    next();
};
exports.requerirVendedor = requerirVendedor;
/**
 * 3. Requerir rol de SUPERADMIN exclusivo (Nivel 100)
 */
const requerirSuperadmin = (req, res, next) => {
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
exports.requerirSuperadmin = requerirSuperadmin;
/**
 * 4. Requerir permisos de ADMINISTRADOR (Superadmin o Admin) (Nivel >= 80)
 */
const requerirAdmin = (req, res, next) => {
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
exports.requerirAdmin = requerirAdmin;
/**
 * 5. Requerir permisos de MODERACIÓN (Superadmin, Admin o Moderador) (Nivel >= 60)
 */
const requerirModerador = (req, res, next) => {
    const roles = req.usuario?.roles;
    const esMod = roles?.es_moderador ||
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
exports.requerirModerador = requerirModerador;
/**
 * 6. Requerir cualquier rol STAFF del sistema (Superadmin, Admin, Moderador o Soporte) (Nivel >= 40)
 */
const requerirStaff = (req, res, next) => {
    const roles = req.usuario?.roles;
    const esStaff = (roles?.roles_administrativos?.length ?? 0) > 0 ||
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
exports.requerirStaff = requerirStaff;
/**
 * Comprueba si un rol ejecutor puede actuar sobre o crear un rol objetivo
 */
const puedeGestionarRol = (rolEjecutor, rolObjetivo) => {
    if (rolEjecutor === "superadmin")
        return true; // Superadmin gestiona todos, incluso otros superadmin
    const nivelEjecutor = exports.JERARQUIA_ROLES[rolEjecutor] || 0;
    const nivelObjetivo = exports.JERARQUIA_ROLES[rolObjetivo] || 0;
    return nivelEjecutor > nivelObjetivo;
};
exports.puedeGestionarRol = puedeGestionarRol;
