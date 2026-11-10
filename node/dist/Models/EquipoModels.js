"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserEquipo = void 0;
// @ts-nocheck
const Conexion_1 = require("./Conexion");
class UserEquipo {
    _ObjEquipo;
    constructor(_ObjEquipo = null) {
        this._ObjEquipo = _ObjEquipo;
    }
    async listarEquipos() {
        try {
            const result = await Conexion_1.pool.query(`
        SELECT id, nombre, nombre_corto, slug, pais, tipo_equipo, escudo_url
        FROM equipos
        ORDER BY nombre ASC;
      `);
            return result.rows || [];
        }
        catch (error) {
            console.error("Error al listar equipos:", error);
            throw new Error("No se pudieron obtener los equipos.");
        }
    }
    async obtenerPorId(id) {
        try {
            const result = await Conexion_1.pool.query(`
        SELECT id, nombre, nombre_corto, slug, pais, tipo_equipo, escudo_url
        FROM equipos
        WHERE id = $1;
      `, [id]);
            return result.rows[0] || null;
        }
        catch (error) {
            console.error("Error al obtener equipo:", error);
            throw new Error("No se pudo obtener el equipo.");
        }
    }
    async insertarEquipo() {
        try {
            if (!this._ObjEquipo)
                throw new Error("Datos de equipo no proporcionados.");
            const { nombre, nombre_corto, slug, pais, tipo_equipo, escudo_url } = this._ObjEquipo;
            if (!nombre || !slug || !pais) {
                throw new Error("Nombre, slug y país son obligatorios.");
            }
            const result = await Conexion_1.pool.query(`INSERT INTO equipos (nombre, nombre_corto, slug, pais, tipo_equipo, escudo_url)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`, [nombre, nombre_corto || null, slug, pais, tipo_equipo || 'club', escudo_url || null]);
            return {
                success: true,
                message: "Equipo creado exitosamente.",
                equipo: result.rows[0],
            };
        }
        catch (error) {
            return {
                success: false,
                message: error.message || "Error al crear equipo.",
            };
        }
    }
    async editarEquipo() {
        try {
            if (!this._ObjEquipo || !this._ObjEquipo.id)
                throw new Error("ID de equipo requerido.");
            const { id, nombre, nombre_corto, slug, pais, tipo_equipo, escudo_url } = this._ObjEquipo;
            const result = await Conexion_1.pool.query(`UPDATE equipos
         SET nombre = COALESCE($1, nombre),
             nombre_corto = COALESCE($2, nombre_corto),
             slug = COALESCE($3, slug),
             pais = COALESCE($4, pais),
             tipo_equipo = COALESCE($5, tipo_equipo),
             escudo_url = COALESCE($6, escudo_url)
         WHERE id = $7
         RETURNING *`, [nombre, nombre_corto, slug, pais, tipo_equipo, escudo_url, id]);
            if (result.rowCount === 0)
                throw new Error("Equipo no encontrado.");
            return {
                success: true,
                message: "Equipo actualizado correctamente.",
                equipo: result.rows[0],
            };
        }
        catch (error) {
            return {
                success: false,
                message: error.message || "Error al actualizar equipo.",
            };
        }
    }
    async eliminarEquipo(id) {
        try {
            if (!id)
                throw new Error("ID de equipo requerido.");
            const result = await Conexion_1.pool.query("DELETE FROM equipos WHERE id = $1 RETURNING id", [id]);
            if (result.rowCount === 0)
                throw new Error("Equipo no encontrado.");
            return {
                success: true,
                message: "Equipo eliminado exitosamente.",
            };
        }
        catch (error) {
            return {
                success: false,
                message: error.message || "Error al eliminar equipo.",
            };
        }
    }
}
exports.UserEquipo = UserEquipo;
