"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserUsuario = void 0;
// @ts-nocheck
const Conexion_1 = require("./Conexion");
class UserUsuario {
    _ObjUsuario;
    constructor(_ObjUsuario = null) {
        this._ObjUsuario = _ObjUsuario;
    }
    async listarUsuarios() {
        try {
            const result = await Conexion_1.pool.query(`
        SELECT u.id, u.email, u.nombres, u.apellidos, u.telefono, u.esta_activo,
               u.esta_activo AS activo, u.email_verificado_en, u.creado_en,
               pv.id AS perfil_vendedor_id, pv.nombre_tienda, pv.esta_verificado, pv.promedio_calificacion,
               COALESCE(
                 (SELECT ra.rol::text FROM roles_administrativos ra WHERE ra.usuario_id = u.id ORDER BY CASE ra.rol WHEN 'superadmin' THEN 1 WHEN 'admin' THEN 2 WHEN 'moderador' THEN 3 ELSE 4 END LIMIT 1),
                 CASE WHEN pv.id IS NOT NULL THEN 'vendedor' ELSE 'comprador' END
               ) AS rol_principal
        FROM usuarios u
        LEFT JOIN perfiles_vendedor pv ON pv.usuario_id = u.id
        WHERE u.eliminado_en IS NULL
        ORDER BY u.creado_en DESC;
      `);
            return result.rows || [];
        }
        catch (error) {
            console.error("Error al listar usuarios:", error);
            throw new Error("No se pudieron obtener los usuarios.");
        }
    }
    async obtenerPorId(id) {
        try {
            const result = await Conexion_1.pool.query(`
        SELECT u.id, u.email, u.nombres, u.apellidos, u.telefono, u.esta_activo,
               u.esta_activo AS activo, u.email_verificado_en, u.creado_en,
               pv.id AS perfil_vendedor_id, pv.nombre_tienda, pv.slug AS tienda_slug, pv.promedio_calificacion,
               COALESCE(
                 (SELECT ra.rol::text FROM roles_administrativos ra WHERE ra.usuario_id = u.id ORDER BY CASE ra.rol WHEN 'superadmin' THEN 1 WHEN 'admin' THEN 2 WHEN 'moderador' THEN 3 ELSE 4 END LIMIT 1),
                 CASE WHEN pv.id IS NOT NULL THEN 'vendedor' ELSE 'comprador' END
               ) AS rol_principal
        FROM usuarios u
        LEFT JOIN perfiles_vendedor pv ON pv.usuario_id = u.id
        WHERE u.id = $1 AND u.eliminado_en IS NULL;
      `, [id]);
            return result.rows[0] || null;
        }
        catch (error) {
            console.error("Error al obtener usuario:", error);
            throw new Error("No se pudo obtener el usuario.");
        }
    }
    async insertarUsuario() {
        try {
            if (!this._ObjUsuario) {
                throw new Error("No se proporcionó información de usuario.");
            }
            const { email, password_hash, nombres, apellidos, telefono } = this._ObjUsuario;
            if (!email || !password_hash || !nombres || !apellidos) {
                throw new Error("Faltan campos obligatorios (email, password_hash, nombres, apellidos).");
            }
            const result = await Conexion_1.pool.query(`INSERT INTO usuarios (email, password_hash, nombres, apellidos, telefono, esta_activo, email_verificado_en)
         VALUES ($1, $2, $3, $4, $5, true, CURRENT_TIMESTAMP)
         RETURNING id, email, nombres, apellidos, telefono, esta_activo, creado_en`, [email.toLowerCase(), password_hash, nombres, apellidos, telefono || null]);
            return {
                success: true,
                message: "Usuario creado exitosamente.",
                usuario: result.rows[0],
            };
        }
        catch (error) {
            return {
                success: false,
                message: error.message || "Error al crear usuario.",
            };
        }
    }
    async editarUsuario() {
        try {
            if (!this._ObjUsuario || !this._ObjUsuario.id) {
                throw new Error("ID de usuario requerido.");
            }
            const { id, nombres, apellidos, telefono } = this._ObjUsuario;
            const result = await Conexion_1.pool.query(`UPDATE usuarios
         SET nombres = COALESCE($1, nombres),
             apellidos = COALESCE($2, apellidos),
             telefono = COALESCE($3, telefono),
             actualizado_en = CURRENT_TIMESTAMP
         WHERE id = $4 AND eliminado_en IS NULL
         RETURNING id, email, nombres, apellidos, telefono, esta_activo, actualizado_en`, [nombres, apellidos, telefono, id]);
            if (result.rowCount === 0) {
                throw new Error("Usuario no encontrado o dado de baja.");
            }
            return {
                success: true,
                message: "Usuario actualizado exitosamente.",
                usuario: result.rows[0],
            };
        }
        catch (error) {
            return {
                success: false,
                message: error.message || "Error al actualizar usuario.",
            };
        }
    }
    async eliminarUsuario(id) {
        try {
            if (!id)
                throw new Error("ID de usuario requerido.");
            const result = await Conexion_1.pool.query(`UPDATE usuarios SET eliminado_en = CURRENT_TIMESTAMP, esta_activo = false, actualizado_en = CURRENT_TIMESTAMP WHERE id = $1 RETURNING id`, [id]);
            if (result.rowCount === 0) {
                throw new Error("Usuario no encontrado.");
            }
            return {
                success: true,
                message: "Usuario eliminado correctamente.",
            };
        }
        catch (error) {
            return {
                success: false,
                message: error.message || "Error al eliminar usuario.",
            };
        }
    }
}
exports.UserUsuario = UserUsuario;
