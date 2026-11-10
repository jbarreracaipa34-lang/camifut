// @ts-nocheck
import { pool } from "./Conexion";

export interface ModeloCamiseta {
  id?: string;
  equipo_id: number;
  marca_id: number;
  anio_inicio_temporada: number;
  anio_fin_temporada?: number;
  tipo_indumentaria: string;
  etiqueta_edicion?: string;
  es_retro?: boolean;
  nombre_canonico: string;
  descripcion?: string;
}

export class UserModeloCamiseta {
  public _ObjModelo: ModeloCamiseta | null;

  constructor(_ObjModelo: ModeloCamiseta | null = null) {
    this._ObjModelo = _ObjModelo;
  }

  public async listarModelos(): Promise<any[]> {
    try {
      const result = await pool.query(`
        SELECT mc.*, 
               e.nombre AS equipo_nombre, e.escudo_url, e.pais AS equipo_pais,
               m.nombre AS marca_nombre, m.logo_url AS marca_logo
        FROM modelos_camiseta mc
        JOIN equipos e ON e.id = mc.equipo_id
        JOIN marcas m ON m.id = mc.marca_id
        ORDER BY mc.anio_inicio_temporada DESC;
      `);
      return result.rows || [];
    } catch (error: any) {
      console.error("Error al listar modelos de camiseta:", error);
      throw new Error("No se pudieron obtener los modelos de camisetas.");
    }
  }

  public async obtenerPorId(id: string): Promise<any | null> {
    try {
      const result = await pool.query(`
        SELECT mc.*, 
               e.nombre AS equipo_nombre, e.escudo_url,
               m.nombre AS marca_nombre
        FROM modelos_camiseta mc
        JOIN equipos e ON e.id = mc.equipo_id
        JOIN marcas m ON m.id = mc.marca_id
        WHERE mc.id = $1;
      `, [id]);
      return result.rows[0] || null;
    } catch (error: any) {
      console.error("Error al obtener modelo:", error);
      throw new Error("No se pudo obtener el modelo de camiseta.");
    }
  }

  public async insertarModelo(): Promise<{ success: boolean; message: string; modelo?: any }> {
    try {
      if (!this._ObjModelo) throw new Error("Datos de modelo no proporcionados.");

      const {
        equipo_id,
        marca_id,
        anio_inicio_temporada,
        anio_fin_temporada,
        tipo_indumentaria,
        etiqueta_edicion,
        es_retro,
        nombre_canonico,
        descripcion,
      } = this._ObjModelo;

      if (!equipo_id || !marca_id || !anio_inicio_temporada || !tipo_indumentaria || !nombre_canonico) {
        throw new Error("Faltan campos obligatorios para el modelo de camiseta.");
      }

      const result = await pool.query(
        `INSERT INTO modelos_camiseta 
         (equipo_id, marca_id, anio_inicio_temporada, anio_fin_temporada, tipo_indumentaria, etiqueta_edicion, es_retro, nombre_canonico, descripcion)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING *`,
        [
          equipo_id,
          marca_id,
          anio_inicio_temporada,
          anio_fin_temporada || null,
          tipo_indumentaria,
          etiqueta_edicion || null,
          es_retro || false,
          nombre_canonico,
          descripcion || null,
        ]
      );

      return {
        success: true,
        message: "Modelo de camiseta registrado exitosamente.",
        modelo: result.rows[0],
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || "Error al registrar modelo de camiseta.",
      };
    }
  }

  public async editarModelo(): Promise<{ success: boolean; message: string; modelo?: any }> {
    try {
      if (!this._ObjModelo || !this._ObjModelo.id) throw new Error("ID de modelo requerido.");

      const { id, nombre_canonico, descripcion, etiqueta_edicion, es_retro } = this._ObjModelo;

      const result = await pool.query(
        `UPDATE modelos_camiseta
         SET nombre_canonico = COALESCE($1, nombre_canonico),
             descripcion = COALESCE($2, descripcion),
             etiqueta_edicion = COALESCE($3, etiqueta_edicion),
             es_retro = COALESCE($4, es_retro)
         WHERE id = $5
         RETURNING *`,
        [nombre_canonico, descripcion, etiqueta_edicion, es_retro, id]
      );

      if (result.rowCount === 0) throw new Error("Modelo no encontrado.");

      return {
        success: true,
        message: "Modelo de camiseta actualizado correctamente.",
        modelo: result.rows[0],
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || "Error al actualizar modelo.",
      };
    }
  }

  public async eliminarModelo(id: string): Promise<{ success: boolean; message: string }> {
    try {
      if (!id) throw new Error("ID de modelo requerido.");

      const result = await pool.query("DELETE FROM modelos_camiseta WHERE id = $1 RETURNING id", [id]);
      if (result.rowCount === 0) throw new Error("Modelo no encontrado.");

      return {
        success: true,
        message: "Modelo de camiseta eliminado exitosamente.",
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || "Error al eliminar modelo.",
      };
    }
  }
}
