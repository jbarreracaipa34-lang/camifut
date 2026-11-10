"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.postCambiarEstadoUsuario = exports.getUsuarios = exports.postCrearAdmin = exports.getPerfil = exports.postAsignarRolAdmin = exports.postConvertirEnVendedor = exports.postRegistro = exports.postLogin = exports.cambiarEstadoUsuarioSchema = exports.crearAdminSchema = exports.asignarRolAdminSchema = exports.convertirVendedorSchema = exports.registroSchema = exports.loginSchema = void 0;
const AuthModels_1 = require("../Models/AuthModels");
const zod_1 = require("zod");
const sanitizer_1 = require("../Utils/sanitizer");
exports.loginSchema = zod_1.z.object({
    email: zod_1.z.string().trim().email("Correo electrónico no válido"),
    password: zod_1.z.string().min(1, "La contraseña es requerida"),
});
exports.registroSchema = zod_1.z.object({
    email: zod_1.z.string().trim().email("Correo electrónico no válido"),
    password: zod_1.z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
    nombres: (0, sanitizer_1.zCleanString)(2, 100),
    apellidos: (0, sanitizer_1.zCleanString)(2, 100),
    telefono: (0, sanitizer_1.zCleanOptionalString)(50),
    nombre_tienda: (0, sanitizer_1.zCleanOptionalString)(150),
});
exports.convertirVendedorSchema = zod_1.z.object({
    usuario_id: zod_1.z.string().min(1, "ID de usuario no válido"),
    nombre_tienda: (0, sanitizer_1.zCleanString)(3, 150),
});
exports.asignarRolAdminSchema = zod_1.z.object({
    usuario_id: zod_1.z.string().min(1, "ID de usuario no válido"),
    rol: zod_1.z.enum(["admin", "superadmin", "moderador", "soporte"]),
});
exports.crearAdminSchema = zod_1.z.object({
    email: zod_1.z.string().trim().email("Correo electrónico no válido"),
    password: zod_1.z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
    nombres: (0, sanitizer_1.zCleanString)(2, 100),
    apellidos: (0, sanitizer_1.zCleanString)(2, 100),
    telefono: (0, sanitizer_1.zCleanOptionalString)(50),
    rol: zod_1.z.enum(["admin", "superadmin", "moderador", "soporte"]).optional(),
});
exports.cambiarEstadoUsuarioSchema = zod_1.z.object({
    usuario_id: zod_1.z.string().uuid("ID de usuario no válido"),
    activo: zod_1.z.boolean(),
});
const postLogin = async (req, res) => {
    try {
        const credenciales = exports.loginSchema.parse(req.body);
        const auth = new AuthModels_1.AuthModel();
        const result = await auth.login(credenciales);
        if (result.success) {
            res.status(200).json(result);
        }
        else {
            res.status(401).json(result);
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
exports.postLogin = postLogin;
const postRegistro = async (req, res) => {
    try {
        const datos = exports.registroSchema.parse(req.body);
        const auth = new AuthModels_1.AuthModel();
        const result = await auth.registro(datos);
        if (result.success) {
            res.status(201).json(result);
        }
        else {
            res.status(400).json(result);
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
exports.postRegistro = postRegistro;
const postConvertirEnVendedor = async (req, res) => {
    try {
        const { usuario_id, nombre_tienda } = exports.convertirVendedorSchema.parse(req.body);
        const auth = new AuthModels_1.AuthModel();
        const result = await auth.convertirEnVendedor(usuario_id, nombre_tienda);
        if (result.success) {
            res.status(200).json(result);
        }
        else {
            res.status(400).json(result);
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
exports.postConvertirEnVendedor = postConvertirEnVendedor;
const postAsignarRolAdmin = async (req, res) => {
    try {
        const usuarioAutenticado = req.usuario;
        const rolEjecutor = usuarioAutenticado?.roles?.rol_principal || "admin";
        if (rolEjecutor !== "superadmin") {
            res.status(403).json({
                success: false,
                message: "Acceso denegado: Solo un Superadmin puede asignar o ascender roles administrativos.",
            });
            return;
        }
        const { usuario_id, rol } = exports.asignarRolAdminSchema.parse(req.body);
        const auth = new AuthModels_1.AuthModel();
        const result = await auth.asignarRolAdmin(usuario_id, rol, rolEjecutor);
        if (result.success) {
            res.status(200).json(result);
        }
        else {
            res.status(400).json(result);
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
exports.postAsignarRolAdmin = postAsignarRolAdmin;
const getPerfil = async (req, res) => {
    try {
        const usuario = req.usuario;
        if (!usuario) {
            res.status(401).json({ success: false, message: "No autenticado." });
            return;
        }
        res.status(200).json({ success: true, data: usuario });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message || "Error interno del servidor." });
    }
};
exports.getPerfil = getPerfil;
const postCrearAdmin = async (req, res) => {
    try {
        const usuarioAutenticado = req.usuario;
        const rolEjecutor = usuarioAutenticado?.roles?.rol_principal ||
            (usuarioAutenticado?.roles?.es_superadmin ? "superadmin" : "admin");
        const datos = exports.crearAdminSchema.parse(req.body);
        // Validación jerárquica explícita
        const rolDeseado = datos.rol || "moderador";
        if (rolEjecutor !== "superadmin" && (rolDeseado === "superadmin" || rolDeseado === "admin")) {
            res.status(403).json({
                success: false,
                message: `Acceso denegado: Los administradores solo pueden crear roles subordinados (moderador, soporte). No puedes crear un usuario '${rolDeseado}'.`,
            });
            return;
        }
        const auth = new AuthModels_1.AuthModel();
        const result = await auth.crearUsuarioStaff({ ...datos, rol: rolDeseado, telefono: datos.telefono ?? undefined }, rolEjecutor);
        if (result.success) {
            res.status(201).json(result);
        }
        else {
            res.status(400).json(result);
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
exports.postCrearAdmin = postCrearAdmin;
const getUsuarios = async (req, res) => {
    try {
        const busqueda = req.query.busqueda;
        const rol = req.query.rol;
        const auth = new AuthModels_1.AuthModel();
        const lista = await auth.listarUsuarios({ busqueda, rol });
        res.status(200).json({ success: true, data: lista });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message || "Error interno del servidor." });
    }
};
exports.getUsuarios = getUsuarios;
const postCambiarEstadoUsuario = async (req, res) => {
    try {
        const usuarioAutenticado = req.usuario;
        const rolEjecutor = usuarioAutenticado?.roles?.rol_principal ||
            (usuarioAutenticado?.roles?.es_superadmin ? "superadmin" : "admin");
        const { usuario_id, activo } = exports.cambiarEstadoUsuarioSchema.parse(req.body);
        if (usuarioAutenticado?.id === usuario_id && !activo) {
            res.status(400).json({ success: false, message: "No puedes desactivar tu propia cuenta." });
            return;
        }
        const auth = new AuthModels_1.AuthModel();
        const result = await auth.cambiarEstadoUsuario(usuario_id, activo, rolEjecutor);
        if (result.success) {
            res.status(200).json(result);
        }
        else {
            res.status(403).json(result);
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
exports.postCambiarEstadoUsuario = postCambiarEstadoUsuario;
