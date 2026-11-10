// @ts-nocheck
import { pool } from "./Conexion";

export interface Equipo {
  id?: number;
  nombre: string;
  nombre_corto?: string;
  slug: string;
  pais: string;
  tipo_equipo?: 'club' | 'seleccion_nacional';
  escudo_url?: string;
}

export class UserEquipo {
  public _ObjEquipo: Equipo | null;

  constructor(_ObjEquipo: Equipo | null = null) {
    this._ObjEquipo = _ObjEquipo;
  }

  public async listarEquipos(): Promise<any[]> {
    try {
      const result = await pool.query(`
        SELECT id, nombre, nombre_corto, slug, pais, tipo_equipo, escudo_url
        FROM equipos
        ORDER BY nombre ASC;
      `);
      return result.rows || [];
    } catch (error: any) {
      console.error("Error al listar equipos:", error);
      throw new Error("No se pudieron obtener los equipos.");
    }
  }

  public async obtenerPorId(id: number): Promise<any | null> {
    try {
      const result = await pool.query(`
        SELECT id, nombre, nombre_corto, slug, pais, tipo_equipo, escudo_url
        FROM equipos
        WHERE id = $1;
      `, [id]);
      return result.rows[0] || null;
    } catch (error: any) {
      console.error("Error al obtener equipo:", error);
      throw new Error("No se pudo obtener el equipo.");
    }
  }

  public async insertarEquipo(): Promise<{ success: boolean; message: string; equipo?: any }> {
    try {
      if (!this._ObjEquipo) throw new Error("Datos de equipo no proporcionados.");

      const { nombre, nombre_corto, slug, pais, tipo_equipo, escudo_url } = this._ObjEquipo;

      if (!nombre || !slug || !pais) {
        throw new Error("Nombre, slug y país son obligatorios.");
      }

      const result = await pool.query(
        `INSERT INTO equipos (nombre, nombre_corto, slug, pais, tipo_equipo, escudo_url)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [nombre, nombre_corto || null, slug, pais, tipo_equipo || 'club', escudo_url || null]
      );

      return {
        success: true,
        message: "Equipo creado exitosamente.",
        equipo: result.rows[0],
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || "Error al crear equipo.",
      };
    }
  }

  public async editarEquipo(): Promise<{ success: boolean; message: string; equipo?: any }> {
    try {
      if (!this._ObjEquipo || !this._ObjEquipo.id) throw new Error("ID de equipo requerido.");

      const { id, nombre, nombre_corto, slug, pais, tipo_equipo, escudo_url } = this._ObjEquipo;

      const result = await pool.query(
        `UPDATE equipos
         SET nombre = COALESCE($1, nombre),
             nombre_corto = COALESCE($2, nombre_corto),
             slug = COALESCE($3, slug),
             pais = COALESCE($4, pais),
             tipo_equipo = COALESCE($5, tipo_equipo),
             escudo_url = COALESCE($6, escudo_url)
         WHERE id = $7
         RETURNING *`,
        [nombre, nombre_corto, slug, pais, tipo_equipo, escudo_url, id]
      );

      if (result.rowCount === 0) throw new Error("Equipo no encontrado.");

      return {
        success: true,
        message: "Equipo actualizado correctamente.",
        equipo: result.rows[0],
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || "Error al actualizar equipo.",
      };
    }
  }

  public async eliminarEquipo(id: number): Promise<{ success: boolean; message: string }> {
    try {
      if (!id) throw new Error("ID de equipo requerido.");

      const result = await pool.query("DELETE FROM equipos WHERE id = $1 RETURNING id", [id]);
      if (result.rowCount === 0) throw new Error("Equipo no encontrado.");

      return {
        success: true,
        message: "Equipo eliminado exitosamente.",
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || "Error al eliminar equipo.",
      };
    }
  }
}
