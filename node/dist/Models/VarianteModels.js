"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserVariante = void 0;
const Conexion_1 = require("./Conexion");
class UserVariante {
    _ObjVariante;
    constructor(_ObjVariante = null) {
        this._ObjVariante = _ObjVariante;
    }
    async listarPorPublicacion(publicacionId) {
        try {
            const result = await Conexion_1.pool.query(`
        SELECT vp.*, c.nombre AS color_nombre, c.codigo_hex
        FROM variantes_publicacion vp
        LEFT JOIN colores c ON c.id = vp.color_id
        WHERE vp.publicacion_id = $1
        ORDER BY vp.precio ASC;
      `, [publicacionId]);
            return result.rows || [];
        }
        catch (error) {
            console.error("Error al listar variantes:", error);
            throw new Error("No se pudieron obtener las variantes.");
        }
    }
    async insertarVariante(tiendaIdExigida, esAdmin = false) {
        try {
            if (!this._ObjVariante)
                throw new Error("Datos de variante no proporcionados.");
            const { publicacion_id, sku, talla, color_id, nombre_estampado, numero_estampado, precio, stock } = this._ObjVariante;
            if (!publicacion_id || !talla || precio === undefined || stock === undefined) {
                throw new Error("Publicación, talla, precio y stock son requeridos.");
            }
            // Verificación de pertenencia de la publicación
            const checkPub = await Conexion_1.pool.query("SELECT vendedor_id FROM publicaciones WHERE id = $1 AND eliminado_en IS NULL", [publicacion_id]);
            if (checkPub.rows.length === 0)
                throw new Error("Publicación no encontrada.");
            if (!esAdmin && tiendaIdExigida && checkPub.rows[0].vendedor_id !== tiendaIdExigida) {
                throw new Error("Acceso denegado. No puede agregar variantes a publicaciones de otro vendedor.");
            }
            const result = await Conexion_1.pool.query(`INSERT INTO variantes_publicacion (
          publicacion_id, sku, talla, color_id, nombre_estampado, numero_estampado, precio, stock
        ) VALUES ($1, $2, $3::talla_enum, $4, $5, $6, $7, $8)
        RETURNING *`, [
                publicacion_id,
                sku || null,
                talla,
                color_id || null,
                nombre_estampado || null,
                numero_estampado || null,
                precio,
                stock,
            ]);
            return {
                success: true,
                message: "Variante de camiseta creada exitosamente.",
                variante: result.rows[0],
            };
        }
        catch (error) {
            return {
                success: false,
                message: error.message || "Error al crear la variante.",
            };
        }
    }
    async editarVariante(tiendaIdExigida, esAdmin = false) {
        try {
            if (!this._ObjVariante || !this._ObjVariante.id)
                throw new Error("ID de variante requerido.");
            const { id, precio, stock } = this._ObjVariante;
            // Verificación de pertenencia
            const checkVar = await Conexion_1.pool.query(`
        SELECT p.vendedor_id 
        FROM variantes_publicacion vp
        JOIN publicaciones p ON p.id = vp.publicacion_id
        WHERE vp.id = $1 AND p.eliminado_en IS NULL
      `, [id]);
            if (checkVar.rows.length === 0)
                throw new Error("Variante no encontrada.");
            if (!esAdmin && tiendaIdExigida && checkVar.rows[0].vendedor_id !== tiendaIdExigida) {
                throw new Error("Acceso denegado. No puede modificar variantes de otro vendedor.");
            }
            const result = await Conexion_1.pool.query(`UPDATE variantes_publicacion
         SET precio = COALESCE($1, precio),
             stock = COALESCE($2, stock),
             actualizado_en = CURRENT_TIMESTAMP
         WHERE id = $3
         RETURNING *`, [precio, stock, id]);
            return {
                success: true,
                message: "Variante actualizada correctamente.",
                variante: result.rows[0],
            };
        }
        catch (error) {
            return {
                success: false,
                message: error.message || "Error al actualizar la variante.",
            };
        }
    }
    async eliminarVariante(id, tiendaIdExigida, esAdmin = false) {
        try {
            if (!id)
                throw new Error("ID de variante requerido.");
            const checkVar = await Conexion_1.pool.query(`
        SELECT p.vendedor_id 
        FROM variantes_publicacion vp
        JOIN publicaciones p ON p.id = vp.publicacion_id
        WHERE vp.id = $1
      `, [id]);
            if (checkVar.rows.length === 0)
                throw new Error("Variante no encontrada.");
            if (!esAdmin && tiendaIdExigida && checkVar.rows[0].vendedor_id !== tiendaIdExigida) {
                throw new Error("Acceso denegado. No puede eliminar variantes de otro vendedor.");
            }
            await Conexion_1.pool.query("DELETE FROM variantes_publicacion WHERE id = $1", [id]);
            return {
                success: true,
                message: "Variante eliminada exitosamente.",
            };
        }
        catch (error) {
            return {
                success: false,
                message: error.message || "Error al eliminar la variante.",
            };
        }
    }
}
exports.UserVariante = UserVariante;
