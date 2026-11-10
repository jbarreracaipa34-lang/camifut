"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserPedido = void 0;
const Conexion_1 = require("./Conexion");
class UserPedido {
    // 1. Pedidos para el Comprador
    async listarPedidosPorComprador(compradorId) {
        try {
            const result = await Conexion_1.pool.query(`
        SELECT p.*,
               (
                 SELECT json_agg(json_build_object(
                   'id', pv.id,
                   'numero_subpedido', pv.numero_subpedido,
                   'estado', pv.estado,
                   'metodo_entrega', pv.metodo_entrega,
                   'subtotal', pv.subtotal,
                   'costo_envio', pv.costo_envio,
                   'vendedor_id', pv.vendedor_id,
                   'nombre_tienda', perf.nombre_tienda,
                   'items', (
                     SELECT json_agg(json_build_object(
                       'id', ip.id,
                       'titulo', ip.titulo_snapshot,
                       'talla', ip.talla_snapshot,
                       'precio_unitario', ip.precio_unitario,
                       'cantidad', ip.cantidad,
                       'subtotal', ip.subtotal
                     ))
                     FROM items_pedido ip
                     WHERE ip.pedido_vendedor_id = pv.id
                   )
                 ))
                 FROM pedidos_vendedor pv
                 JOIN perfiles_vendedor perf ON perf.id = pv.vendedor_id
                 WHERE pv.pedido_id = p.id
               ) AS subpedidos
        FROM pedidos p
        WHERE p.comprador_id = $1
        ORDER BY p.creado_en DESC;
      `, [compradorId]);
            return result.rows || [];
        }
        catch (error) {
            console.error("Error al listar pedidos del comprador:", error);
            throw new Error("No se pudieron obtener los pedidos.");
        }
    }
    // 2. Pedidos y Ventas para el Vendedor (con comprobación de inquilino)
    async listarPedidosPorVendedor(vendedorId, tiendaIdSolicitante, esAdmin = false) {
        try {
            // Prevención de acceso cruzado entre vendedores
            if (!esAdmin && tiendaIdSolicitante && vendedorId !== tiendaIdSolicitante) {
                throw new Error("Acceso denegado. No puede ver las ventas de otra tienda.");
            }
            const result = await Conexion_1.pool.query(`
        SELECT pv.*,
               p.numero_pedido,
               p.creado_en AS fecha_pedido,
               p.estado AS estado_pedido_padre,
               u.nombres AS comprador_nombres,
               u.apellidos AS comprador_apellidos,
               u.email AS comprador_email,
               u.telefono AS comprador_telefono,
               p.direccion_envio_snapshot,
               (
                 SELECT json_agg(json_build_object(
                   'id', ip.id,
                   'variante_id', ip.variante_id,
                   'titulo', ip.titulo_snapshot,
                   'talla', ip.talla_snapshot,
                   'precio_unitario', ip.precio_unitario,
                   'cantidad', ip.cantidad,
                   'subtotal', ip.subtotal
                 ))
                 FROM items_pedido ip
                 WHERE ip.pedido_vendedor_id = pv.id
               ) AS items
        FROM pedidos_vendedor pv
        JOIN pedidos p ON p.id = pv.pedido_id
        JOIN usuarios u ON u.id = p.comprador_id
        WHERE (pv.vendedor_id = $1 OR pv.vendedor_id IN (SELECT id FROM perfiles_vendedor WHERE usuario_id = $1))
        ORDER BY pv.creado_en DESC;
      `, [vendedorId]);
            return result.rows || [];
        }
        catch (error) {
            console.error("Error al listar ventas del vendedor:", error);
            throw new Error(error.message || "No se pudieron obtener las ventas del vendedor.");
        }
    }
    // 3. Supervisión General para Administradores
    async listarTodosLosPedidosAdmin() {
        try {
            const result = await Conexion_1.pool.query(`
        SELECT p.*,
               u.nombres AS comprador_nombres,
               u.apellidos AS comprador_apellidos,
               u.email AS comprador_email,
               (
                 SELECT json_agg(json_build_object(
                   'id', pv.id,
                   'numero_subpedido', pv.numero_subpedido,
                   'estado', pv.estado,
                   'metodo_entrega', pv.metodo_entrega,
                   'subtotal', pv.subtotal,
                   'pago_neto_vendedor', pv.pago_neto_vendedor,
                   'monto_comision_plataforma', pv.monto_comision_plataforma,
                   'vendedor_id', pv.vendedor_id,
                   'nombre_tienda', perf.nombre_tienda
                 ))
                 FROM pedidos_vendedor pv
                 JOIN perfiles_vendedor perf ON perf.id = pv.vendedor_id
                 WHERE pv.pedido_id = p.id
               ) AS subpedidos
        FROM pedidos p
        JOIN usuarios u ON u.id = p.comprador_id
        ORDER BY p.creado_en DESC;
      `);
            return result.rows || [];
        }
        catch (error) {
            console.error("Error al listar todos los pedidos:", error);
            throw new Error("No se pudieron obtener los pedidos para administración.");
        }
    }
    // Métricas del Panel Administrador
    async obtenerMetricasPlataforma() {
        try {
            const pedidosStats = await Conexion_1.pool.query(`
        SELECT 
          COALESCE(COUNT(*), 0) AS total_pedidos,
          COALESCE(SUM(monto_total), 0) AS volumen_total_ventas
        FROM pedidos
        WHERE estado != 'cancelado';
      `);
            const comisionesStats = await Conexion_1.pool.query(`
        SELECT COALESCE(SUM(monto_comision_plataforma), 0) AS comisiones_totales
        FROM pedidos_vendedor
        WHERE estado != 'cancelado';
      `);
            const disputasStats = await Conexion_1.pool.query(`
        SELECT 
          COALESCE(COUNT(*), 0) AS total_disputas,
          COALESCE(COUNT(*) FILTER (WHERE estado IN ('abierta', 'en_revision', 'esperando_vendedor')), 0) AS disputas_activas
        FROM disputas;
      `);
            const usuariosStats = await Conexion_1.pool.query(`
        SELECT 
          COALESCE(COUNT(*), 0) AS total_usuarios,
          COALESCE(COUNT(*) FILTER (WHERE EXISTS (SELECT 1 FROM perfiles_vendedor pv WHERE pv.usuario_id = usuarios.id)), 0) AS total_vendedores
        FROM usuarios
        WHERE eliminado_en IS NULL;
      `);
            return {
                total_pedidos: Number(pedidosStats.rows[0].total_pedidos),
                volumen_total_ventas: Number(pedidosStats.rows[0].volumen_total_ventas),
                comisiones_totales: Number(comisionesStats.rows[0].comisiones_totales),
                total_disputas: Number(disputasStats.rows[0].total_disputas),
                disputas_activas: Number(disputasStats.rows[0].disputas_activas),
                total_usuarios: Number(usuariosStats.rows[0].total_usuarios),
                total_vendedores: Number(usuariosStats.rows[0].total_vendedores),
            };
        }
        catch (error) {
            console.error("Error al obtener métricas de plataforma:", error);
            throw new Error("No se pudieron obtener las métricas administrativas.");
        }
    }
    // Listar Disputas para Administrador
    async listarDisputasAdmin() {
        try {
            const result = await Conexion_1.pool.query(`
        SELECT d.*,
               u.nombres AS comprador_nombres, u.apellidos AS comprador_apellidos, u.email AS comprador_email,
               pv.numero_subpedido, pv.subtotal AS monto_subpedido,
               perf.nombre_tienda
        FROM disputas d
        JOIN usuarios u ON u.id = d.comprador_id
        JOIN pedidos_vendedor pv ON pv.id = d.pedido_vendedor_id
        JOIN perfiles_vendedor perf ON perf.id = pv.vendedor_id
        ORDER BY d.creado_en DESC;
      `);
            return result.rows || [];
        }
        catch (error) {
            console.error("Error al listar disputas:", error);
            throw new Error("No se pudieron obtener las disputas.");
        }
    }
    async obtenerPorId(pedidoId) {
        try {
            const pedidoRes = await Conexion_1.pool.query("SELECT * FROM pedidos WHERE id = $1", [pedidoId]);
            if (pedidoRes.rows.length === 0)
                return null;
            const subpedidosRes = await Conexion_1.pool.query(`
        SELECT pv.*, perf.nombre_tienda,
               (
                 SELECT json_agg(json_build_object(
                   'id', ip.id,
                   'variante_id', ip.variante_id,
                   'titulo', ip.titulo_snapshot,
                   'talla', ip.talla_snapshot,
                   'precio_unitario', ip.precio_unitario,
                   'cantidad', ip.cantidad,
                   'subtotal', ip.subtotal
                 ))
                 FROM items_pedido ip
                 WHERE ip.pedido_vendedor_id = pv.id
               ) AS items
        FROM pedidos_vendedor pv
        JOIN perfiles_vendedor perf ON perf.id = pv.vendedor_id
        WHERE pv.pedido_id = $1;
      `, [pedidoId]);
            return {
                ...pedidoRes.rows[0],
                subpedidos: subpedidosRes.rows || [],
            };
        }
        catch (error) {
            console.error("Error al obtener detalle del pedido:", error);
            throw new Error("No se pudo obtener el pedido.");
        }
    }
    /**
     * 4. Checkout seguro contra condiciones de carrera:
     * - Transacción SQL estricta (BEGIN ... COMMIT / ROLLBACK)
     * - Bloqueo a nivel de fila (SELECT ... FOR UPDATE) en variantes_publicacion
     * - Decremento atómico de inventario
     * - Aislamiento sin escrituras parciales
     */
    async checkout(compradorId, datosEnvio) {
        const client = await Conexion_1.pool.connect();
        try {
            await client.query("BEGIN");
            // 1. Obtener carrito del comprador
            const carritoRes = await client.query("SELECT id FROM carritos WHERE usuario_id = $1", [compradorId]);
            if (carritoRes.rows.length === 0) {
                throw new Error("El usuario no tiene un carrito activo.");
            }
            const carritoId = carritoRes.rows[0].id;
            // 2. Obtener y BLOQUEAR atómicamente a nivel de fila las variantes seleccionadas (FOR UPDATE)
            // Se ordenan por ID de variante para prevenir interbloqueos (deadlocks) en compras simultáneas
            const itemsRes = await client.query(`
        SELECT ic.id AS item_carrito_id, ic.variante_id, ic.cantidad,
               vp.precio, vp.stock, vp.stock_reservado, vp.talla,
               p.id AS publicacion_id, p.titulo, p.tipo_edicion, p.autenticidad, p.estado_prenda,
               p.permite_envio_transportadora, p.permite_entrega_en_persona,
               pv.id AS vendedor_id, pv.tasa_comision
        FROM items_carrito ic
        JOIN variantes_publicacion vp ON vp.id = ic.variante_id
        JOIN publicaciones p ON p.id = vp.publicacion_id
        JOIN perfiles_vendedor pv ON pv.id = p.vendedor_id
        WHERE ic.carrito_id = $1
        ORDER BY vp.id ASC
        FOR UPDATE OF vp;
      `, [carritoId]);
            if (itemsRes.rows.length === 0) {
                throw new Error("El carrito de compras está vacío.");
            }
            const items = itemsRes.rows;
            // 3. Validar stock atómicamente con los datos bloqueados más recientes
            for (const item of items) {
                const stockReal = Number(item.stock);
                const solicitado = Number(item.cantidad);
                if (stockReal < solicitado) {
                    throw new Error(`Stock insuficiente para "${item.titulo}" (Talla ${item.talla}). Disponible: ${stockReal}, Solicitado: ${solicitado}.`);
                }
            }
            // 4. Calcular totales monetarios
            const subtotalTotal = items.reduce((acc, it) => acc + (Number(it.precio) * it.cantidad), 0);
            const totalEnvios = datosEnvio?.metodo_entrega === "entrega_en_persona" ? 0.00 : (datosEnvio?.costo_envio || 0.00);
            const montoTotal = subtotalTotal + totalEnvios;
            // 5. Obtener datos del comprador para snapshot inmutable
            const userRes = await client.query("SELECT id, email, nombres, apellidos, telefono FROM usuarios WHERE id = $1", [compradorId]);
            const user = userRes.rows[0];
            const datosCompradorSnapshot = {
                id: user.id,
                email: user.email,
                nombre_completo: `${user.nombres} ${user.apellidos}`,
                telefono: user.telefono,
            };
            const numeroPedido = `PED-${Date.now().toString().slice(-6)}`;
            // 6. Insertar en tabla pedidos
            const pedidoInsert = await client.query(`
        INSERT INTO pedidos (
          numero_pedido, comprador_id, estado, moneda, subtotal, total_envios,
          total_descuentos, total_impuestos, monto_total, datos_comprador_snapshot,
          direccion_envio_snapshot, expira_en
        ) VALUES ($1, $2, 'pendiente_pago', 'COP', $3, $4, 0.00, 0.00, $5, $6, $7, CURRENT_TIMESTAMP + INTERVAL '24 hours')
        RETURNING *;
      `, [
                numeroPedido,
                compradorId,
                subtotalTotal,
                totalEnvios,
                montoTotal,
                JSON.stringify(datosCompradorSnapshot),
                JSON.stringify(datosEnvio || {
                    metodo_entrega: "envio_transportadora",
                    ciudad: "Medellín",
                    direccion: "Envío estándar nacional asegurado",
                })
            ]);
            const pedidoCreado = pedidoInsert.rows[0];
            // 7. Agrupar items por vendedor para generar subpedidos independientes
            const itemsPorVendedor = new Map();
            for (const it of items) {
                if (!itemsPorVendedor.has(it.vendedor_id)) {
                    itemsPorVendedor.set(it.vendedor_id, []);
                }
                itemsPorVendedor.get(it.vendedor_id).push(it);
            }
            let subpedidoIndex = 1;
            for (const [vendedorId, itemsVendedor] of itemsPorVendedor.entries()) {
                const subtotalVendedor = itemsVendedor.reduce((acc, it) => acc + (Number(it.precio) * it.cantidad), 0);
                const tasaComision = Number(itemsVendedor[0].tasa_comision || 10.00);
                const montoComision = Math.round((subtotalVendedor * (tasaComision / 100)) * 100) / 100;
                const pagoNeto = subtotalVendedor - montoComision;
                const numSubpedido = `${numeroPedido}-V${subpedidoIndex++}`;
                const metodoEntrega = datosEnvio?.metodo_entrega === "entrega_en_persona"
                    ? "entrega_en_persona"
                    : (itemsVendedor[0].permite_envio_transportadora ? "envio_transportadora" : "entrega_en_persona");
                const subpedidoRes = await client.query(`
          INSERT INTO pedidos_vendedor (
            pedido_id, vendedor_id, numero_subpedido, estado, metodo_entrega,
            subtotal, costo_envio, tasa_comision_snapshot, monto_comision_plataforma, pago_neto_vendedor
          ) VALUES ($1, $2, $3, 'pendiente_despacho', $4, $5, 0.00, $6, $7, $8)
          RETURNING id;
        `, [
                    pedidoCreado.id,
                    vendedorId,
                    numSubpedido,
                    metodoEntrega,
                    subtotalVendedor,
                    tasaComision,
                    montoComision,
                    pagoNeto
                ]);
                const subpedidoId = subpedidoRes.rows[0].id;
                // 8. Insertar items_pedido y decrementar el stock físicamente de forma atómica
                for (const it of itemsVendedor) {
                    const itemSubtotal = Number(it.precio) * it.cantidad;
                    await client.query(`
            INSERT INTO items_pedido (
              pedido_vendedor_id, variante_id, titulo_snapshot, sku_snapshot,
              talla_snapshot, estado_prenda_snapshot, autenticidad_snapshot,
              precio_unitario, cantidad, subtotal
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10);
          `, [
                        subpedidoId,
                        it.variante_id,
                        it.titulo,
                        `SKU-${it.talla}`,
                        it.talla,
                        it.estado_prenda,
                        it.autenticidad,
                        it.precio,
                        it.cantidad,
                        itemSubtotal
                    ]);
                    // Decremento atómico de stock
                    await client.query(`
            UPDATE variantes_publicacion
            SET stock = stock - $1,
                actualizado_en = CURRENT_TIMESTAMP
            WHERE id = $2;
          `, [it.cantidad, it.variante_id]);
                    // Si el stock total de la publicación llega a 0, marcar publicación como 'agotada'
                    await client.query(`
            UPDATE publicaciones
            SET estado = 'agotada', actualizado_en = CURRENT_TIMESTAMP
            WHERE id = $1 AND (SELECT COALESCE(SUM(stock), 0) FROM variantes_publicacion WHERE publicacion_id = $1) <= 0;
          `, [it.publicacion_id]);
                }
            }
            // 9. Vaciar el carrito del comprador tras la confirmación
            await client.query("DELETE FROM items_carrito WHERE carrito_id = $1", [carritoId]);
            // 10. Confirmar transacción
            await client.query("COMMIT");
            return {
                success: true,
                message: `¡Pedido ${numeroPedido} creado con éxito! Inventario asegurado mediante Escrow.`,
                pedido: pedidoCreado
            };
        }
        catch (error) {
            await client.query("ROLLBACK");
            return {
                success: false,
                message: error.message || "Error al procesar el pedido.",
            };
        }
        finally {
            client.release();
        }
    }
    /**
     * 5. Actualizar estado de subpedido con validación de propiedad de vendedor
     */
    async actualizarEstadoSubpedido(subpedidoId, nuevoEstado, comentario, tiendaIdExigida, esAdmin = false) {
        const client = await Conexion_1.pool.connect();
        try {
            await client.query("BEGIN");
            const actual = await client.query("SELECT estado, vendedor_id FROM pedidos_vendedor WHERE id = $1", [subpedidoId]);
            if (actual.rows.length === 0)
                throw new Error("Subpedido no encontrado.");
            const subpedido = actual.rows[0];
            // Verificación de pertenencia a nivel de recurso
            if (!esAdmin && tiendaIdExigida && subpedido.vendedor_id !== tiendaIdExigida) {
                throw new Error("Acceso denegado. No tiene permisos para modificar órdenes de otra tienda.");
            }
            await client.query("UPDATE pedidos_vendedor SET estado = $1, actualizado_en = CURRENT_TIMESTAMP WHERE id = $2", [nuevoEstado, subpedidoId]);
            await client.query(`INSERT INTO historial_estados_subpedido (pedido_vendedor_id, estado_anterior, estado_nuevo, comentario)
         VALUES ($1, $2, $3, $4)`, [subpedidoId, subpedido.estado, nuevoEstado, comentario || null]);
            await client.query("COMMIT");
            return {
                success: true,
                message: `Estado de subpedido actualizado a ${nuevoEstado}.`,
            };
        }
        catch (err) {
            await client.query("ROLLBACK");
            return {
                success: false,
                message: err.message || "Error al actualizar estado del subpedido.",
            };
        }
        finally {
            client.release();
        }
    }
}
exports.UserPedido = UserPedido;
