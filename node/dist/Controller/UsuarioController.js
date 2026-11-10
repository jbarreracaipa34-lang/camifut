"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteUsuario = exports.putUsuario = exports.postUsuario = exports.getUsuarioPorId = exports.getUsuarios = exports.editarUsuarioSchema = exports.usuarioSchema = void 0;
const UsuarioModels_1 = require("../Models/UsuarioModels");
const zod_1 = require("zod");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const sanitizer_1 = require("../Utils/sanitizer");
const AuthMiddleware_1 = require("../Middlewares/AuthMiddleware");
const Conexion_1 = require("../Models/Conexion");
exports.usuarioSchema = zod_1.z.object({
    email: zod_1.z.string().trim().email("Correo electrónico no válido"),
    password: zod_1.z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
    nombres: (0, sanitizer_1.zCleanString)(2, 100),
    apellidos: (0, sanitizer_1.zCleanString)(2, 100),
    telefono: (0, sanitizer_1.zCleanOptionalString)(50),
});
exports.editarUsuarioSchema = zod_1.z.object({
    nombres: (0, sanitizer_1.zCleanString)(2, 100).optional(),
    apellidos: (0, sanitizer_1.zCleanString)(2, 100).optional(),
    telefono: (0, sanitizer_1.zCleanOptionalString)(50),
});
const getUsuarios = async (req, res) => {
    try {
        const obj = new UsuarioModels_1.UserUsuario();
        const lista = await obj.listarUsuarios();
        res.status(200).json({ success: true, message: "Usuarios encontrados.", data: lista });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message || "Error interno del servidor." });
    }
};
exports.getUsuarios = getUsuarios;
const getUsuarioPorId = async (req, res) => {
    try {
        const id = req.params.id;
        const authUser = req.usuario;
        // Permitir ver detalle a la propia persona o a cualquier staff
        const esPropio = authUser?.id === id;
        const esStaff = (authUser?.roles?.nivel_jerarquia ?? 0) >= 40 || authUser?.roles?.es_admin;
        if (!esPropio && !esStaff) {
            res.status(403).json({ success: false, message: "Acceso denegado al perfil de otro usuario." });
            return;
        }
        const obj = new UsuarioModels_1.UserUsuario();
        const usuario = await obj.obtenerPorId(id);
        if (!usuario) {
            res.status(404).json({ success: false, message: "Usuario no encontrado." });
            return;
        }
        res.status(200).json({ success: true, data: usuario });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message || "Error interno del servidor." });
    }
};
exports.getUsuarioPorId = getUsuarioPorId;
const postUsuario = async (req, res) => {
    try {
        const validated = exports.usuarioSchema.parse(req.body);
        const passwordHash = await bcryptjs_1.default.hash(validated.password, 10);
        const obj = new UsuarioModels_1.UserUsuario({
            email: validated.email,
            password_hash: passwordHash,
            nombres: validated.nombres,
            apellidos: validated.apellidos,
            telefono: validated.telefono ?? undefined,
        });
        const result = await obj.insertarUsuario();
        if (result.success) {
            res.status(201).json({ success: true, message: result.message, data: result.usuario });
        }
        else {
            res.status(400).json({ success: false, message: result.message });
        }
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            res.status(400).json({ success: false, message: "Datos inválidos.", errors: error.format() });
        }
        else {
            res.status(500).json({ success: false, message: error.message || "Error interno del servidor." });
        }
    }
};
exports.postUsuario = postUsuario;
const putUsuario = async (req, res) => {
    try {
        const id = req.params.id;
        const authUser = req.usuario;
        const esPropio = authUser?.id === id;
        const rolEjecutor = authUser?.roles?.rol_principal || "comprador";
        if (!esPropio) {
            // Verificar rol del usuario objetivo
            const target = await Conexion_1.pool.query(`SELECT u.id,
                COALESCE(
                  (SELECT ra.rol::text FROM roles_administrativos ra WHERE ra.usuario_id = u.id ORDER BY CASE ra.rol WHEN 'superadmin' THEN 1 WHEN 'admin' THEN 2 ELSE 3 END LIMIT 1),
                  CASE WHEN pv.id IS NOT NULL THEN 'vendedor' ELSE 'comprador' END
                ) as rol_principal
         FROM usuarios u
         LEFT JOIN perfiles_vendedor pv ON pv.usuario_id = u.id
         WHERE u.id = $1`, [id]);
            if (target.rows.length === 0) {
                res.status(404).json({ success: false, message: "Usuario no encontrado." });
                return;
            }
            const targetRol = target.rows[0].rol_principal;
            const nivelEjecutor = AuthMiddleware_1.JERARQUIA_ROLES[rolEjecutor] || 0;
            const nivelTarget = AuthMiddleware_1.JERARQUIA_ROLES[targetRol] || 0;
            if (rolEjecutor !== "superadmin" && nivelEjecutor <= nivelTarget) {
                res.status(403).json({
                    success: false,
                    message: `Acceso denegado: No tienes permisos jerárquicos para modificar a un '${targetRol}'.`,
                });
                return;
            }
        }
        const validated = exports.editarUsuarioSchema.parse(req.body);
        const obj = new UsuarioModels_1.UserUsuario({ id, ...validated, telefono: validated.telefono ?? undefined });
        const result = await obj.editarUsuario();
        if (result.success) {
            res.status(200).json({ success: true, message: result.message, data: result.usuario });
        }
        else {
            res.status(400).json({ success: false, message: result.message });
        }
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            res.status(400).json({ success: false, message: "Datos inválidos.", errors: error.format() });
        }
        else {
            res.status(500).json({ success: false, message: error.message || "Error interno del servidor." });
        }
    }
};
exports.putUsuario = putUsuario;
const deleteUsuario = async (req, res) => {
    try {
        const id = req.params.id;
        const authUser = req.usuario;
        const rolEjecutor = authUser?.roles?.rol_principal || "admin";
        if (authUser?.id === id) {
            res.status(400).json({ success: false, message: "No puedes eliminar tu propia cuenta desde este panel." });
            return;
        }
        // Verificar rol del usuario objetivo
        const target = await Conexion_1.pool.query(`SELECT u.id,
              COALESCE(
                (SELECT ra.rol::text FROM roles_administrativos ra WHERE ra.usuario_id = u.id ORDER BY CASE ra.rol WHEN 'superadmin' THEN 1 WHEN 'admin' THEN 2 ELSE 3 END LIMIT 1),
                CASE WHEN pv.id IS NOT NULL THEN 'vendedor' ELSE 'comprador' END
              ) as rol_principal
       FROM usuarios u
       LEFT JOIN perfiles_vendedor pv ON pv.usuario_id = u.id
       WHERE u.id = $1`, [id]);
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
        const obj = new UsuarioModels_1.UserUsuario();
        const result = await obj.eliminarUsuario(id);
        if (result.success) {
            res.status(200).json({ success: true, message: result.message });
        }
        else {
            res.status(400).json({ success: false, message: result.message });
        }
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message || "Error interno del servidor." });
    }
};
exports.deleteUsuario = deleteUsuario;
