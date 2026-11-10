// @ts-nocheck
import { pool } from "./Conexion";

export interface ItemCarrito {
  carrito_id?: string;
  usuario_id: string;
  variante_id: string;
  cantidad: number;
  solicitud_nombre_personalizado?: string;
  solicitud_numero_personalizado?: number;
}

export class UserCarrito {
  public _ObjCarrito: ItemCarrito | null;

  constructor(_ObjCarrito: ItemCarrito | null = null) {
    this._ObjCarrito = _ObjCarrito;
  }

  public async obtenerCarritoPorUsuario(usuarioId: string): Promise<any> {
    try {
      if (!usuarioId) {
        return { carrito_id: null, usuario_id: null, items: [], total_items: 0, subtotal_estimado: 0 };
      }

      // Validar si el usuario existe en la base de datos
      const usuarioExiste = await pool.query("SELECT id FROM usuarios WHERE id = $1 AND eliminado_en IS NULL", [usuarioId]);
      if (usuarioExiste.rows.length === 0) {
        return {
          carrito_id: null,
          usuario_id: usuarioId,
          items: [],
          total_items: 0,
          subtotal_estimado: 0,
          mensaje: "Usuario no encontrado",
        };
      }

      // Asegurar que el usuario tenga un carrito creado
      let carritoRes = await pool.query("SELECT id FROM carritos WHERE usuario_id = $1", [usuarioId]);
      if (carritoRes.rows.length === 0) {
        carritoRes = await pool.query(
          "INSERT INTO carritos (usuario_id) VALUES ($1) ON CONFLICT (usuario_id) DO NOTHING RETURNING id",
          [usuarioId]
        );
        if (carritoRes.rows.length === 0) {
          carritoRes = await pool.query("SELECT id FROM carritos WHERE usuario_id = $1", [usuarioId]);
        }
      }
      const carritoId = carritoRes.rows[0]?.id;

      if (!carritoId) {
        return { carrito_id: null, usuario_id: usuarioId, items: [], total_items: 0, subtotal_estimado: 0 };
      }

      const itemsRes = await pool.query(`
        SELECT ic.id AS item_id, ic.variante_id, ic.cantidad,
               ic.solicitud_nombre_personalizado, ic.solicitud_numero_personalizado,
               vp.talla, vp.precio, vp.stock, vp.stock_reservado,
               p.id AS publicacion_id, p.titulo AS publicacion_titulo,
               pv.id AS vendedor_id, pv.nombre_tienda,
               (vp.precio * ic.cantidad) AS subtotal_item
        FROM items_carrito ic
        JOIN variantes_publicacion vp ON vp.id = ic.variante_id
        JOIN publicaciones p ON p.id = vp.publicacion_id
        JOIN perfiles_vendedor pv ON pv.id = p.vendedor_id
        WHERE ic.carrito_id = $1
        ORDER BY ic.creado_en DESC;
      `, [carritoId]);

      const items = itemsRes.rows || [];
      const subtotalTotal = items.reduce((acc, item) => acc + Number(item.subtotal_item || 0), 0);

      return {
        carrito_id: carritoId,
        usuario_id: usuarioId,
        items,
        total_items: items.reduce((acc, item) => acc + Number(item.cantidad || 1), 0),
        subtotal_estimado: subtotalTotal,
      };
    } catch (error: any) {
      console.error("Error al obtener carrito:", error);
      throw new Error("No se pudo obtener el carrito del usuario.");
    }
  }

  public async agregarItem(): Promise<{ success: boolean; message: string; item?: any }> {
    try {
      if (!this._ObjCarrito) throw new Error("Datos de ítem de carrito requeridos.");

      const { usuario_id, variante_id, cantidad, solicitud_nombre_personalizado, solicitud_numero_personalizado } =
        this._ObjCarrito;

      if (!usuario_id || !variante_id || !cantidad) {
        throw new Error("Usuario, variante y cantidad son requeridos.");
      }

      // 1. Validar que el usuario exista
      const userCheck = await pool.query("SELECT id FROM usuarios WHERE id = $1 AND eliminado_en IS NULL", [usuario_id]);
      if (userCheck.rows.length === 0) {
        throw new Error("El usuario especificado no existe o la sesión ha expirado.");
      }

      // 2. Validar que la variante exista y tenga stock
      const varCheck = await pool.query("SELECT id, stock, stock_reservado, precio FROM variantes_publicacion WHERE id = $1", [variante_id]);
      if (varCheck.rows.length === 0) {
        throw new Error("La talla o variante seleccionada no existe en el catálogo.");
      }

      const variante = varCheck.rows[0];
      const disponible = variante.stock - variante.stock_reservado;
      if (disponible < cantidad) {
        throw new Error(`Stock insuficiente. Solo quedan ${Math.max(0, disponible)} unidades disponibles.`);
      }

      // 3. Obtener o crear carrito del usuario
      let carritoRes = await pool.query("SELECT id FROM carritos WHERE usuario_id = $1", [usuario_id]);
      let carritoId = carritoRes.rows[0]?.id;
      if (!carritoId) {
        const nuevoCarrito = await pool.query(
          "INSERT INTO carritos (usuario_id) VALUES ($1) ON CONFLICT (usuario_id) DO UPDATE SET actualizado_en = CURRENT_TIMESTAMP RETURNING id",
          [usuario_id]
        );
        carritoId = nuevoCarrito.rows[0]?.id;
      }

      // 4. Upsert en items_carrito
      const result = await pool.query(
        `INSERT INTO items_carrito (carrito_id, variante_id, cantidad, solicitud_nombre_personalizado, solicitud_numero_personalizado)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (carrito_id, variante_id)
         DO UPDATE SET cantidad = items_carrito.cantidad + EXCLUDED.cantidad,
                       actualizado_en = CURRENT_TIMESTAMP
         RETURNING *`,
        [carritoId, variante_id, cantidad, solicitud_nombre_personalizado || null, solicitud_numero_personalizado || null]
      );

      return {
        success: true,
        message: "Camiseta agregada al carrito exitosamente.",
        item: result.rows[0],
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || "Error al agregar ítem al carrito.",
      };
    }
  }

  public async eliminarItem(itemId: string): Promise<{ success: boolean; message: string }> {
    try {
      if (!itemId) throw new Error("ID de ítem requerido.");

      const result = await pool.query("DELETE FROM items_carrito WHERE id = $1 RETURNING id", [itemId]);
      if (result.rowCount === 0) throw new Error("Ítem no encontrado en el carrito.");

      return {
        success: true,
        message: "Ítem eliminado del carrito.",
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || "Error al eliminar ítem.",
      };
    }
  }

  public async vaciarCarrito(usuarioId: string): Promise<{ success: boolean; message: string }> {
    try {
      if (!usuarioId) throw new Error("ID de usuario requerido.");

      await pool.query(
        `DELETE FROM items_carrito
         WHERE carrito_id IN (SELECT id FROM carritos WHERE usuario_id = $1)`,
        [usuarioId]
      );

      return {
        success: true,
        message: "Carrito vaciado exitosamente.",
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || "Error al vaciar carrito.",
      };
    }
  }
}
