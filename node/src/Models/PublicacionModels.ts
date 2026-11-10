import { pool } from "./Conexion";

export interface PublicacionFiltros {
  estado?: string;
  vendedor_id?: string;
  search?: string;
  pais?: string;
  tipo_indumentaria?: string;
  estado_prenda?: string;
  min_precio?: number;
  max_precio?: number;
  sort?: "precio_asc" | "precio_desc" | "recientes" | "popularidad" | string;
}

export interface PublicacionDTO {
  id?: string;
  vendedor_id?: string;
  modelo_camiseta_id?: string;
  equipo_nombre?: string;
  pais?: string;
  marca?: string;
  anio_temporada?: number | string;
  tipo_indumentaria?: string;
  modelo_nombre?: string;
  titulo: string;
  descripcion: string;
  tipo_edicion: string;
  autenticidad: string;
  estado_prenda: string;
  cantidad_usos?: number;
  detalles_defectos?: string;
  genero?: string;
  permite_envio_transportadora?: boolean;
  permite_entrega_en_persona?: boolean;
  ciudad_entrega_persona?: string;
  zona_entrega_persona?: string;
  estado?: string;
  imagen_portada?: string;
  imagen_url?: string;
  talla?: string;
  precio?: number | string;
  stock?: number | string;
  nombre_estampado?: string;
  numero_estampado?: number | string;
}

export class UserPublicacion {
  private _ObjPublicacion: PublicacionDTO | undefined;

  constructor(obj?: PublicacionDTO) {
    this._ObjPublicacion = obj;
  }

  public async listarPublicaciones(filtro?: PublicacionFiltros): Promise<any[]> {
    try {
      const whereClauses: string[] = ["p.eliminado_en IS NULL"];
      const params: any[] = [];

      const estadoFiltro = filtro?.estado || "activa";
      if (estadoFiltro !== "todas") {
        params.push(estadoFiltro);
        whereClauses.push(`p.estado = $${params.length}`);
      }

      if (filtro?.vendedor_id && filtro.vendedor_id.trim()) {
        params.push(filtro.vendedor_id.trim());
        whereClauses.push(`(p.vendedor_id = $${params.length} OR pv.usuario_id = $${params.length})`);
      }

      if (filtro?.search && filtro.search.trim()) {
        params.push(`%${filtro.search.trim()}%`);
        const pIdx = params.length;
        whereClauses.push(`(
          unaccent(p.titulo) ILIKE unaccent($${pIdx}) OR 
          unaccent(e.nombre) ILIKE unaccent($${pIdx}) OR 
          unaccent(COALESCE(e.nombre_corto, '')) ILIKE unaccent($${pIdx}) OR 
          unaccent(COALESCE(m.nombre, '')) ILIKE unaccent($${pIdx}) OR 
          unaccent(mc.nombre_canonico) ILIKE unaccent($${pIdx}) OR 
          mc.anio_inicio_temporada::text ILIKE $${pIdx}
        )`);
      }

      if (filtro?.pais && filtro.pais.trim() && filtro.pais !== "todos") {
        params.push(`%${filtro.pais.trim()}%`);
        whereClauses.push(`unaccent(e.pais) ILIKE unaccent($${params.length})`);
      }

      if (filtro?.tipo_indumentaria && filtro.tipo_indumentaria !== "todos") {
        const t = filtro.tipo_indumentaria.toLowerCase().trim();
        if (t === "retro" || t === "retro_edicion_especial") {
          whereClauses.push(`(mc.es_retro = true OR p.tipo_edicion = 'reedicion_retro')`);
        } else {
          params.push(t);
          whereClauses.push(`(mc.tipo_indumentaria::text = $${params.length} OR p.tipo_edicion::text = $${params.length})`);
        }
      }

      if (filtro?.estado_prenda && filtro.estado_prenda !== "todos") {
        params.push(filtro.estado_prenda.trim());
        whereClauses.push(`p.estado_prenda = $${params.length}`);
      }

      if (filtro?.min_precio !== undefined && !isNaN(Number(filtro.min_precio))) {
        params.push(Number(filtro.min_precio));
        whereClauses.push(`EXISTS (
          SELECT 1 FROM variantes_publicacion vp_min 
          WHERE vp_min.publicacion_id = p.id AND vp_min.precio >= $${params.length}
        )`);
      }

      if (filtro?.max_precio !== undefined && !isNaN(Number(filtro.max_precio))) {
        params.push(Number(filtro.max_precio));
        whereClauses.push(`EXISTS (
          SELECT 1 FROM variantes_publicacion vp_max 
          WHERE vp_max.publicacion_id = p.id AND vp_max.precio <= $${params.length}
        )`);
      }

      let orderByClause = "ORDER BY p.creado_en DESC";
      if (filtro?.sort) {
        switch (filtro.sort) {
          case "precio_asc":
            orderByClause = `ORDER BY (SELECT MIN(vp_sort.precio) FROM variantes_publicacion vp_sort WHERE vp_sort.publicacion_id = p.id) ASC`;
            break;
          case "precio_desc":
            orderByClause = `ORDER BY (SELECT MAX(vp_sort.precio) FROM variantes_publicacion vp_sort WHERE vp_sort.publicacion_id = p.id) DESC`;
            break;
          case "popularidad":
            orderByClause = `ORDER BY COALESCE(pe.total_visitas, 0) DESC, p.creado_en DESC`;
            break;
          case "recientes":
          default:
            orderByClause = "ORDER BY p.creado_en DESC";
            break;
        }
      }

      const query = `
        SELECT p.*,
               mc.nombre_canonico AS camiseta_nombre, mc.tipo_indumentaria, mc.anio_inicio_temporada, mc.es_retro,
               e.nombre AS equipo_nombre, e.pais AS equipo_pais, e.escudo_url,
               m.nombre AS marca_nombre,
               pv.nombre_tienda, pv.promedio_calificacion AS vendedor_reputacion,
               COALESCE(pe.total_visitas, 0) AS total_visitas,
               (
                 SELECT json_agg(json_build_object(
                   'id', vp.id, 'talla', vp.talla, 'precio', vp.precio, 'stock', vp.stock,
                   'nombre_estampado', vp.nombre_estampado, 'numero_estampado', vp.numero_estampado
                 ) ORDER BY vp.precio ASC)
                 FROM variantes_publicacion vp
                 WHERE vp.publicacion_id = p.id
               ) AS variantes,
               (
                 SELECT imagen_url
                 FROM imagenes_publicacion ip
                 WHERE ip.publicacion_id = p.id
                 ORDER BY ip.es_portada DESC, ip.orden_visualizacion ASC
                 LIMIT 1
               ) AS imagen_portada
        FROM publicaciones p
        JOIN modelos_camiseta mc ON mc.id = p.modelo_camiseta_id
        JOIN equipos e ON e.id = mc.equipo_id
        LEFT JOIN marcas m ON m.id = mc.marca_id
        JOIN perfiles_vendedor pv ON pv.id = p.vendedor_id
        LEFT JOIN publicaciones_estadisticas pe ON pe.publicacion_id = p.id
        WHERE ${whereClauses.join(" AND ")}
        ${orderByClause};
      `;

      const result = await pool.query(query, params);
      return result.rows || [];
    } catch (error: any) {
      console.error("Error al listar publicaciones con filtros:", error);
      throw new Error("No se pudieron obtener las publicaciones.");
    }
  }

  public async obtenerPorId(id: string): Promise<any | null> {
    try {
      await pool.query(`
        INSERT INTO publicaciones_estadisticas (publicacion_id, total_visitas, total_favoritos, actualizado_en)
        VALUES ($1, 1, 0, CURRENT_TIMESTAMP)
        ON CONFLICT (publicacion_id) 
        DO UPDATE SET total_visitas = publicaciones_estadisticas.total_visitas + 1, actualizado_en = CURRENT_TIMESTAMP;
      `, [id]).catch(() => {});

      const result = await pool.query(`
        SELECT p.*,
               mc.nombre_canonico AS camiseta_nombre, mc.tipo_indumentaria, mc.anio_inicio_temporada, mc.es_retro,
               e.nombre AS equipo_nombre, e.pais AS equipo_pais, e.escudo_url,
               m.nombre AS marca_nombre,
               pv.nombre_tienda, pv.promedio_calificacion AS vendedor_reputacion,
               (
                 SELECT json_agg(json_build_object(
                   'id', vp.id, 'talla', vp.talla, 'precio', vp.precio, 'stock', vp.stock,
                   'nombre_estampado', vp.nombre_estampado, 'numero_estampado', vp.numero_estampado
                 ) ORDER BY vp.precio ASC)
                 FROM variantes_publicacion vp
                 WHERE vp.publicacion_id = p.id
               ) AS variantes,
               (
                 SELECT json_agg(json_build_object(
                   'id', ip.id, 'imagen_url', ip.imagen_url, 'es_portada', ip.es_portada
                 ) ORDER BY ip.es_portada DESC, ip.orden_visualizacion ASC)
                 FROM imagenes_publicacion ip
                 WHERE ip.publicacion_id = p.id
               ) AS imagenes,
               (
                 SELECT imagen_url
                 FROM imagenes_publicacion ip
                 WHERE ip.publicacion_id = p.id
                 ORDER BY ip.es_portada DESC, ip.orden_visualizacion ASC
                 LIMIT 1
               ) AS imagen_portada
        FROM publicaciones p
        JOIN modelos_camiseta mc ON mc.id = p.modelo_camiseta_id
        JOIN equipos e ON e.id = mc.equipo_id
        LEFT JOIN marcas m ON m.id = mc.marca_id
        JOIN perfiles_vendedor pv ON pv.id = p.vendedor_id
        WHERE p.id = $1 AND p.eliminado_en IS NULL;
      `, [id]);

      return result.rows[0] || null;
    } catch (error: any) {
      console.error("Error al obtener publicación por ID:", error);
      throw new Error("No se pudo obtener el detalle de la camiseta.");
    }
  }

  public async insertarPublicacion(): Promise<{ success: boolean; message: string; publicacion?: any }> {
    try {
      if (!this._ObjPublicacion) throw new Error("Datos de publicación requeridos.");

      const {
        vendedor_id,
        modelo_camiseta_id,
        equipo_nombre,
        pais,
        marca,
        anio_temporada,
        tipo_indumentaria,
        modelo_nombre,
        titulo,
        descripcion,
        tipo_edicion,
        autenticidad,
        estado_prenda,
        cantidad_usos,
        detalles_defectos,
        genero,
        permite_envio_transportadora,
        permite_entrega_en_persona,
        ciudad_entrega_persona,
        zona_entrega_persona,
        imagen_portada,
        imagen_url,
      } = this._ObjPublicacion;

      if (!vendedor_id || !titulo || !descripcion || !tipo_edicion || !autenticidad || !estado_prenda) {
        throw new Error("Faltan campos obligatorios para crear la publicación.");
      }

      let finalModeloId = modelo_camiseta_id;

      if (!finalModeloId || (equipo_nombre && equipo_nombre.trim().length > 0)) {
        const eqNombre = (equipo_nombre || titulo || "Equipo General").trim();
        const paisEq = (pais || "Internacional").trim();
        const slugEq = eqNombre.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-") || "club";

        let eqRes = await pool.query("SELECT id FROM equipos WHERE LOWER(nombre) = LOWER($1)", [eqNombre]);
        let eqId: number;
        if (eqRes.rows.length > 0) {
          eqId = eqRes.rows[0].id;
        } else {
          const newEq = await pool.query(
            "INSERT INTO equipos (nombre, nombre_corto, slug, pais, tipo_equipo) VALUES ($1, $2, $3, $4, 'club') RETURNING id",
            [eqNombre, eqNombre.slice(0, 50), `${slugEq}-${Date.now().toString().slice(-4)}`, paisEq]
          );
          eqId = newEq.rows[0].id;
        }

        const marcaNombre = (marca || "Adidas").trim();
        const slugMarca = marcaNombre.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-") || "marca";
        let marcaRes = await pool.query("SELECT id FROM marcas WHERE LOWER(nombre) = LOWER($1)", [marcaNombre]);
        let marcaId: number;
        if (marcaRes.rows.length > 0) {
          marcaId = marcaRes.rows[0].id;
        } else {
          const newMarca = await pool.query(
            "INSERT INTO marcas (nombre, slug) VALUES ($1, $2) RETURNING id",
            [marcaNombre, `${slugMarca}-${Date.now().toString().slice(-4)}`]
          );
          marcaId = newMarca.rows[0].id;
        }

        const tipoInd: string = (tipo_indumentaria && ["local", "visitante", "tercera", "cuarta", "arquero", "edicion_especial", "entrenamiento"].includes(tipo_indumentaria))
          ? tipo_indumentaria
          : "local";
        const anio = Number(anio_temporada) || new Date().getFullYear();
        const nomCanonico = (modelo_nombre || `${eqNombre} ${anio} ${tipoInd.charAt(0).toUpperCase() + tipoInd.slice(1)}`).trim();

        let modRes = await pool.query("SELECT id FROM modelos_camiseta WHERE LOWER(nombre_canonico) = LOWER($1) AND equipo_id = $2", [nomCanonico, eqId]);
        if (modRes.rows.length > 0) {
          finalModeloId = modRes.rows[0].id;
        } else {
          const newMod = await pool.query(
            `INSERT INTO modelos_camiseta (id, equipo_id, marca_id, anio_inicio_temporada, tipo_indumentaria, es_retro, nombre_canonico, descripcion)
             VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7)
             RETURNING id`,
            [eqId, marcaId, anio, tipoInd, anio < 2010, nomCanonico, descripcion]
          );
          finalModeloId = newMod.rows[0].id;
        }
      }

      const result = await pool.query(
        `INSERT INTO publicaciones (
          vendedor_id, modelo_camiseta_id, titulo, descripcion, tipo_edicion, autenticidad, estado_prenda,
          cantidad_usos, detalles_defectos, genero, permite_envio_transportadora, permite_entrega_en_persona,
          ciudad_entrega_persona, zona_entrega_persona
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        RETURNING *`,
        [
          vendedor_id,
          finalModeloId,
          titulo,
          descripcion,
          tipo_edicion,
          autenticidad,
          estado_prenda,
          cantidad_usos || 0,
          detalles_defectos || null,
          genero || "unisex",
          permite_envio_transportadora !== false,
          permite_entrega_en_persona || false,
          ciudad_entrega_persona || null,
          zona_entrega_persona || null,
        ]
      );

      const pubCreada = result.rows[0];
      const fotoUrl = imagen_portada || imagen_url || "https://images.unsplash.com/photo-1577223625816-7546f13df25d?auto=format&fit=crop&w=900&q=80";
      if (pubCreada?.id && fotoUrl) {
        await pool.query(
          `INSERT INTO imagenes_publicacion (publicacion_id, imagen_url, es_portada, orden_visualizacion)
           VALUES ($1, $2, true, 1)`,
          [pubCreada.id, fotoUrl]
        );
      }

      return {
        success: true,
        message: "Publicación creada exitosamente.",
        publicacion: pubCreada,
      };
    } catch (error: any) {
      console.error("Error al insertar publicacion:", error);
      return {
        success: false,
        message: error.message || "Error al crear publicación.",
      };
    }
  }

  public async editarPublicacion(tiendaIdExigida?: string, esAdmin: boolean = false): Promise<{ success: boolean; message: string; publicacion?: any }> {
    try {
      if (!this._ObjPublicacion || !this._ObjPublicacion.id) throw new Error("ID de publicación requerido.");

      const {
        id,
        equipo_nombre,
        pais,
        marca,
        anio_temporada,
        tipo_indumentaria,
        modelo_nombre,
        titulo,
        descripcion,
        tipo_edicion,
        autenticidad,
        estado_prenda,
        cantidad_usos,
        detalles_defectos,
        genero,
        permite_envio_transportadora,
        permite_entrega_en_persona,
        ciudad_entrega_persona,
        zona_entrega_persona,
        imagen_portada,
        imagen_url,
        estado,
        talla,
        precio,
        stock,
        nombre_estampado,
        numero_estampado,
      } = this._ObjPublicacion as any;

      const checkRes = await pool.query("SELECT vendedor_id, modelo_camiseta_id FROM publicaciones WHERE id = $1 AND eliminado_en IS NULL", [id]);
      if (checkRes.rows.length === 0) {
        return { success: false, message: "Publicación no encontrada." };
      }

      const { vendedor_id: vendedorDuenio } = checkRes.rows[0];
      if (!esAdmin && tiendaIdExigida && vendedorDuenio !== tiendaIdExigida) {
        return { success: false, message: "Acceso denegado. No tiene permisos para modificar una publicación de otro vendedor." };
      }

      if (equipo_nombre && equipo_nombre.trim()) {
        const eqNombre = equipo_nombre.trim();
        const paisEq = (pais || "Internacional").trim();
        const slugEq = eqNombre.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-") || "club";

        let eqRes = await pool.query("SELECT id FROM equipos WHERE LOWER(nombre) = LOWER($1)", [eqNombre]);
        let eqId: number;
        if (eqRes.rows.length > 0) {
          eqId = eqRes.rows[0].id;
        } else {
          const newEq = await pool.query(
            "INSERT INTO equipos (nombre, nombre_corto, slug, pais, tipo_equipo) VALUES ($1, $2, $3, $4, 'club') RETURNING id",
            [eqNombre, eqNombre.slice(0, 50), `${slugEq}-${Date.now().toString().slice(-4)}`, paisEq]
          );
          eqId = newEq.rows[0].id;
        }

        const marcaNombre = (marca || "Adidas").trim();
        const slugMarca = marcaNombre.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-") || "marca";
        let marcaRes = await pool.query("SELECT id FROM marcas WHERE LOWER(nombre) = LOWER($1)", [marcaNombre]);
        let marcaId: number;
        if (marcaRes.rows.length > 0) {
          marcaId = marcaRes.rows[0].id;
        } else {
          const newMarca = await pool.query(
            "INSERT INTO marcas (nombre, slug) VALUES ($1, $2) RETURNING id",
            [marcaNombre, `${slugMarca}-${Date.now().toString().slice(-4)}`]
          );
          marcaId = newMarca.rows[0].id;
        }

        const tipoInd = (tipo_indumentaria && ["local", "visitante", "tercera", "cuarta", "arquero", "edicion_especial", "entrenamiento"].includes(tipo_indumentaria))
          ? tipo_indumentaria
          : "local";
        const anio = Number(anio_temporada) || new Date().getFullYear();
        const nomCanonico = (modelo_nombre || `${eqNombre} ${anio} ${tipoInd.charAt(0).toUpperCase() + tipoInd.slice(1)}`).trim();

        let modRes = await pool.query("SELECT id FROM modelos_camiseta WHERE LOWER(nombre_canonico) = LOWER($1) AND equipo_id = $2", [nomCanonico, eqId]);
        let finalModeloId: string;
        if (modRes.rows.length > 0) {
          finalModeloId = modRes.rows[0].id;
        } else {
          const newMod = await pool.query(
            `INSERT INTO modelos_camiseta (id, equipo_id, marca_id, anio_inicio_temporada, tipo_indumentaria, es_retro, nombre_canonico, descripcion)
             VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7)
             RETURNING id`,
            [eqId, marcaId, anio, tipoInd, anio < 2010, nomCanonico, descripcion || nomCanonico]
          );
          finalModeloId = newMod.rows[0].id;
        }

        await pool.query("UPDATE publicaciones SET modelo_camiseta_id = $1 WHERE id = $2", [finalModeloId, id]);
      }

      const result = await pool.query(
        `UPDATE publicaciones
         SET titulo = COALESCE($1, titulo),
             descripcion = COALESCE($2, descripcion),
             estado = COALESCE($3, estado),
             tipo_edicion = COALESCE($4, tipo_edicion),
             autenticidad = COALESCE($5, autenticidad),
             estado_prenda = COALESCE($6, estado_prenda),
             genero = COALESCE($7, genero),
             cantidad_usos = COALESCE($8, cantidad_usos),
             detalles_defectos = COALESCE($9, detalles_defectos),
             permite_envio_transportadora = COALESCE($10, permite_envio_transportadora),
             permite_entrega_en_persona = COALESCE($11, permite_entrega_en_persona),
             ciudad_entrega_persona = COALESCE($12, ciudad_entrega_persona),
             zona_entrega_persona = COALESCE($13, zona_entrega_persona),
             actualizado_en = CURRENT_TIMESTAMP
         WHERE id = $14 AND eliminado_en IS NULL
         RETURNING *`,
        [
          titulo || null,
          descripcion || null,
          estado || null,
          tipo_edicion || null,
          autenticidad || null,
          estado_prenda || null,
          genero || null,
          cantidad_usos !== undefined && cantidad_usos !== null ? Number(cantidad_usos) : null,
          detalles_defectos || null,
          permite_envio_transportadora !== undefined ? permite_envio_transportadora : null,
          permite_entrega_en_persona !== undefined ? permite_entrega_en_persona : null,
          ciudad_entrega_persona || null,
          zona_entrega_persona || null,
          id,
        ]
      );

      const fotoUrl = imagen_portada || imagen_url;
      if (fotoUrl && fotoUrl.trim()) {
        const imgCheck = await pool.query("SELECT id FROM imagenes_publicacion WHERE publicacion_id = $1 AND es_portada = true", [id]);
        if (imgCheck.rows.length > 0) {
          await pool.query("UPDATE imagenes_publicacion SET imagen_url = $1 WHERE id = $2", [fotoUrl.trim(), imgCheck.rows[0].id]);
        } else {
          await pool.query("INSERT INTO imagenes_publicacion (publicacion_id, imagen_url, es_portada, orden_visualizacion) VALUES ($1, $2, true, 1)", [id, fotoUrl.trim()]);
        }
      }

      if (precio !== undefined || stock !== undefined || talla) {
        let normTalla = talla ? String(talla).trim().toUpperCase() : undefined;
        if (normTalla === "XXL") normTalla = "2XL";
        if (normTalla === "XXXL") normTalla = "3XL";

        const varCheck = await pool.query(
          "SELECT id, talla FROM variantes_publicacion WHERE publicacion_id = $1 ORDER BY creado_en ASC",
          [id]
        );

        if (varCheck.rows.length > 0) {
          let targetVar = varCheck.rows[0];
          if (normTalla) {
            const match = varCheck.rows.find((v: any) => v.talla === normTalla);
            if (match) targetVar = match;
          }

          await pool.query(
            `UPDATE variantes_publicacion
             SET precio = COALESCE($1, precio),
                 stock = COALESCE($2, stock),
                 talla = COALESCE($3::talla_enum, talla),
                 nombre_estampado = COALESCE($4, nombre_estampado),
                 numero_estampado = COALESCE($5, numero_estampado),
                 actualizado_en = CURRENT_TIMESTAMP
             WHERE id = $6`,
            [
              precio !== undefined && precio !== null ? Number(precio) : null,
              stock !== undefined && stock !== null ? Number(stock) : null,
              normTalla || null,
              nombre_estampado !== undefined ? nombre_estampado : null,
              numero_estampado !== undefined && numero_estampado !== null ? Number(numero_estampado) : null,
              targetVar.id,
            ]
          );

          // Limpiar variantes adicionales huérfanas de esta publicación para asegurar consistencia de prenda única
          await pool.query(
            "DELETE FROM items_carrito WHERE variante_id IN (SELECT id FROM variantes_publicacion WHERE publicacion_id = $1 AND id != $2)",
            [id, targetVar.id]
          ).catch(() => {});
          await pool.query(
            "DELETE FROM variantes_publicacion WHERE publicacion_id = $1 AND id != $2 AND id NOT IN (SELECT variante_id FROM items_pedido WHERE variante_id IS NOT NULL)",
            [id, targetVar.id]
          ).catch(() => {});
          await pool.query(
            "UPDATE variantes_publicacion SET stock = 0 WHERE publicacion_id = $1 AND id != $2",
            [id, targetVar.id]
          ).catch(() => {});
        } else if (precio && stock) {
          await pool.query(
            `INSERT INTO variantes_publicacion (publicacion_id, talla, precio, stock, nombre_estampado, numero_estampado)
             VALUES ($1, $2::talla_enum, $3, $4, $5, $6)`,
            [
              id,
              normTalla || "M",
              Number(precio),
              Number(stock),
              nombre_estampado || null,
              numero_estampado ? Number(numero_estampado) : null,
            ]
          );
        }
      }

      return {
        success: true,
        message: "Publicación actualizada exitosamente con todos sus detalles.",
        publicacion: result.rows[0],
      };
    } catch (error: any) {
      console.error("Error al actualizar publicacion:", error);
      return {
        success: false,
        message: error.message || "Error al actualizar publicación.",
      };
    }
  }

  public async eliminarPublicacion(id: string, tiendaIdExigida?: string, esAdmin: boolean = false): Promise<{ success: boolean; message: string }> {
    try {
      if (!id) throw new Error("ID de publicación requerido.");

      const checkRes = await pool.query("SELECT vendedor_id FROM publicaciones WHERE id = $1 AND eliminado_en IS NULL", [id]);
      if (checkRes.rows.length === 0) {
        return { success: false, message: "Publicación no encontrada." };
      }

      const vendedorDuenio = checkRes.rows[0].vendedor_id;
      if (!esAdmin && tiendaIdExigida && vendedorDuenio !== tiendaIdExigida) {
        return { success: false, message: "Acceso denegado. No tiene permisos para eliminar una publicación de otro vendedor." };
      }

      await pool.query(
        `UPDATE publicaciones SET eliminado_en = CURRENT_TIMESTAMP, estado = 'archivada' WHERE id = $1`,
        [id]
      );

      return {
        success: true,
        message: "Publicación eliminada correctamente.",
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || "Error al eliminar publicación.",
      };
    }
  }
}
