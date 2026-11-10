import { pool } from "./Conexion";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { JERARQUIA_ROLES } from "../Middlewares/AuthMiddleware";

export interface LoginDTO {
  email: string;
  password: string;
}

export interface RegistroDTO {
  email: string;
  password: string;
  nombres: string;
  apellidos: string;
  telefono?: string | null;
  nombre_tienda?: string | null;
}

export interface RolesUsuario {
  es_comprador: boolean;
  es_vendedor: boolean;
  es_admin: boolean;
  es_superadmin: boolean;
  es_moderador: boolean;
  es_soporte: boolean;
  roles_administrativos: string[];
  rol_principal: "superadmin" | "admin" | "moderador" | "soporte" | "vendedor" | "comprador";
  nivel_jerarquia: number;
  tienda: {
    id: string;
    nombre_tienda: string;
    slug: string;
    esta_verificado: boolean;
  } | null;
}

export class AuthModel {
  /**
   * Hashear contraseñas usando bcrypt con factor de costo 10
   */
  public async hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, 10);
  }

  /**
   * Verificar contraseña con bcrypt, permitiendo migración transparente desde SHA-256
   */
  public async verifyAndMigratePassword(password: string, storedHash: string, usuarioId: string): Promise<boolean> {
    if (storedHash.startsWith("$2a$") || storedHash.startsWith("$2b$")) {
      return await bcrypt.compare(password, storedHash);
    }

    const sha256Hash = crypto.createHash("sha256").update(password).digest("hex");
    const esValido = storedHash === sha256Hash || storedHash === password;

    if (esValido) {
      try {
        const nuevoBcryptHash = await this.hashPassword(password);
        await pool.query("UPDATE usuarios SET password_hash = $1 WHERE id = $2", [nuevoBcryptHash, usuarioId]);
      } catch (e) {
        console.error("Error al automigrar hash de contraseña a bcrypt:", e);
      }
      return true;
    }

    return false;
  }

  /**
   * Generar token firmado JWT seguro con expiración de 7 días
   */
  public generarToken(usuario: { id: string; email: string; roles: RolesUsuario }): string {
    const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
    const payload = Buffer.from(
      JSON.stringify({
        id: usuario.id,
        email: usuario.email,
        roles: usuario.roles,
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7, // 7 días
      })
    ).toString("base64url");

    const secret = process.env.JWT_SECRET || "camifut_secret_key_2026";
    const signature = crypto
      .createHmac("sha256", secret)
      .update(`${header}.${payload}`)
      .digest("base64url");

    return `${header}.${payload}.${signature}`;
  }

  public async login(credenciales: LoginDTO): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      const { email, password } = credenciales;

      if (!email || !password) {
        throw new Error("Email y contraseña requeridos.");
      }

      const result = await pool.query(
        `
        SELECT 
          u.id, 
          u.email, 
          u.password_hash, 
          u.nombres, 
          u.apellidos, 
          u.telefono, 
          u.esta_activo,
          u.email_verificado_en,
          pv.id AS perfil_vendedor_id,
          pv.nombre_tienda,
          pv.slug AS tienda_slug,
          pv.esta_verificado AS vendedor_verificado,
          COALESCE(
            (SELECT json_agg(ra.rol) FROM roles_administrativos ra WHERE ra.usuario_id = u.id),
            '[]'::json
          ) AS roles_administrativos
        FROM usuarios u
        LEFT JOIN perfiles_vendedor pv ON pv.usuario_id = u.id
        WHERE LOWER(u.email) = LOWER($1) AND u.eliminado_en IS NULL;
        `,
        [email.trim()]
      );

      if (result.rows.length === 0) {
        return { success: false, message: "Credenciales inválidas. Usuario no encontrado." };
      }

      const usuario = result.rows[0];

      if (!usuario.esta_activo) {
        return { success: false, message: "Esta cuenta se encuentra inactiva. Contacte a soporte." };
      }

      const coincide = await this.verifyAndMigratePassword(password, usuario.password_hash, usuario.id);

      if (!coincide) {
        return { success: false, message: "Credenciales inválidas. Contraseña incorrecta." };
      }

      // Estructurar roles jerárquicos del usuario
      const esVendedor = !!usuario.perfil_vendedor_id;
      const rolesAdmin: string[] = usuario.roles_administrativos || [];
      const esSuperadmin = rolesAdmin.includes("superadmin");
      const esAdmin = esSuperadmin || rolesAdmin.includes("admin");
      const esModerador = rolesAdmin.includes("moderador");
      const esSoporte = rolesAdmin.includes("soporte");

      let rolPrincipal: "superadmin" | "admin" | "moderador" | "soporte" | "vendedor" | "comprador" = "comprador";
      if (esSuperadmin) {
        rolPrincipal = "superadmin";
      } else if (esAdmin) {
        rolPrincipal = "admin";
      } else if (esModerador) {
        rolPrincipal = "moderador";
      } else if (esSoporte) {
        rolPrincipal = "soporte";
      } else if (esVendedor) {
        rolPrincipal = "vendedor";
      }

      const nivelJerarquia = JERARQUIA_ROLES[rolPrincipal] || 10;

      const rolesInfo: RolesUsuario = {
        es_comprador: true,
        es_vendedor: esVendedor,
        es_admin: esAdmin,
        es_superadmin: esSuperadmin,
        es_moderador: esModerador,
        es_soporte: esSoporte,
        roles_administrativos: rolesAdmin,
        rol_principal: rolPrincipal,
        nivel_jerarquia: nivelJerarquia,
        tienda: esVendedor
          ? {
              id: usuario.perfil_vendedor_id,
              nombre_tienda: usuario.nombre_tienda,
              slug: usuario.tienda_slug,
              esta_verificado: usuario.vendedor_verificado,
            }
          : null,
      };

      const token = this.generarToken({
        id: usuario.id,
        email: usuario.email,
        roles: rolesInfo,
      });

      await pool.query("UPDATE usuarios SET ultimo_acceso_en = CURRENT_TIMESTAMP WHERE id = $1", [usuario.id]);

      return {
        success: true,
        message: `¡Bienvenido, ${usuario.nombres}! Inicio de sesión exitoso.`,
        data: {
          token,
          usuario: {
            id: usuario.id,
            email: usuario.email,
            nombres: usuario.nombres,
            apellidos: usuario.apellidos,
            telefono: usuario.telefono,
            email_verificado: !!usuario.email_verificado_en,
          },
          roles: rolesInfo,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || "Error al procesar el inicio de sesión.",
      };
    }
  }

  public async registro(datos: RegistroDTO): Promise<{ success: boolean; message: string; data?: any }> {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const { email, password, nombres, apellidos, telefono, nombre_tienda } = datos;

      if (!email || !password || !nombres || !apellidos) {
        throw new Error("Email, contraseña, nombres y apellidos son requeridos.");
      }

      const existente = await client.query("SELECT id FROM usuarios WHERE LOWER(email) = LOWER($1)", [email.trim()]);
      if (existente.rows.length > 0) {
        throw new Error("El correo electrónico ya se encuentra registrado.");
      }

      const passwordHash = await this.hashPassword(password);

      // Normalizar nombre de tienda y limpiar tildes para el slug
      let tienda = null;
      let slug = null;
      if (nombre_tienda && nombre_tienda.trim()) {
        slug = nombre_tienda
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .toLowerCase()
          .replace(/[^a-z0-9]/g, "-")
          .replace(/-+/g, "-")
          .replace(/^-|-$/g, "");
      }

      const usuarioRes = await client.query(
        `
        INSERT INTO usuarios (email, password_hash, nombres, apellidos, telefono, esta_activo, email_verificado_en)
        VALUES ($1, $2, $3, $4, $5, true, CURRENT_TIMESTAMP)
        RETURNING id, email, nombres, apellidos, telefono, esta_activo, creado_en;
        `,
        [email.trim().toLowerCase(), passwordHash, nombres.trim(), apellidos.trim(), telefono || null]
      );
      const nuevoUsuario = usuarioRes.rows[0];

      if (nombre_tienda && nombre_tienda.trim()) {
        const tiendaRes = await client.query(
          `
          INSERT INTO perfiles_vendedor (usuario_id, nombre_tienda, slug)
          VALUES ($1, $2, $3)
          RETURNING id, nombre_tienda, slug, esta_verificado;
          `,
          [nuevoUsuario.id, nombre_tienda.trim(), slug]
        );
        tienda = tiendaRes.rows[0];
      }

      await client.query("INSERT INTO carritos (usuario_id) VALUES ($1) ON CONFLICT DO NOTHING", [nuevoUsuario.id]);

      await client.query("COMMIT");

      return {
        success: true,
        message: "Usuario registrado exitosamente.",
        data: {
          usuario: nuevoUsuario,
          tienda,
          es_vendedor: !!tienda,
        },
      };
    } catch (error: any) {
      await client.query("ROLLBACK");
      return {
        success: false,
        message: error.message || "Error al registrar usuario.",
      };
    } finally {
      client.release();
    }
  }

  public async convertirEnVendedor(
    usuarioId: string,
    nombreTienda: string
  ): Promise<{ success: boolean; message: string; tienda?: any }> {
    try {
      if (!usuarioId || !nombreTienda) throw new Error("ID de usuario y nombre de tienda requeridos.");

      const slug = nombreTienda
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");

      const result = await pool.query(
        `
        INSERT INTO perfiles_vendedor (usuario_id, nombre_tienda, slug)
        VALUES ($1, $2, $3)
        ON CONFLICT (usuario_id) DO UPDATE SET nombre_tienda = EXCLUDED.nombre_tienda, actualizado_en = CURRENT_TIMESTAMP
        RETURNING *;
        `,
        [usuarioId, nombreTienda.trim(), slug]
      );

      return {
        success: true,
        message: "Perfil de vendedor activado con éxito.",
        tienda: result.rows[0],
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || "Error al activar perfil de vendedor.",
      };
    }
  }

  public async asignarRolAdmin(
    usuarioId: string,
    rol: string,
    rolEjecutor: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const rolesValidos = ["admin", "superadmin", "moderador", "soporte"];
      if (!rolesValidos.includes(rol)) {
        throw new Error(`Rol no válido. Permitidos: ${rolesValidos.join(", ")}`);
      }

      if (rolEjecutor !== "superadmin") {
        throw new Error("Acceso denegado. Solo un Superadmin puede asignar o promover roles administrativos.");
      }

      await pool.query(
        `
        INSERT INTO roles_administrativos (usuario_id, rol)
        VALUES ($1, $2)
        ON CONFLICT (usuario_id, rol) DO NOTHING;
        `,
        [usuarioId, rol]
      );

      return {
        success: true,
        message: `Rol '${rol}' asignado exitosamente al usuario.`,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || "Error al asignar rol.",
      };
    }
  }

  public async crearUsuarioStaff(
    datos: {
      email: string;
      password: string;
      nombres: string;
      apellidos: string;
      telefono?: string;
      rol?: string;
    },
    rolEjecutor: string
  ): Promise<{ success: boolean; message: string; data?: any }> {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const { email, password, nombres, apellidos, telefono, rol = "moderador" } = datos;

      const rolesValidos = ["admin", "superadmin", "moderador", "soporte"];
      if (!rolesValidos.includes(rol)) {
        throw new Error(`Rol administrativo no válido. Opciones: ${rolesValidos.join(", ")}`);
      }

      // Validar jerarquía estricta:
      // Superadmin puede crear cualquier rol (superadmin, admin, moderador, soporte).
      // Admin solo puede crear roles estrictamente inferiores: moderador o soporte. No puede crear superadmin ni admin.
      if (rolEjecutor !== "superadmin") {
        if (rol === "superadmin" || rol === "admin") {
          throw new Error(
            `Acceso denegado: Un usuario con rol '${rolEjecutor}' solo tiene permisos para crear roles subordinados (moderador, soporte). No puede crear un '${rol}'.`
          );
        }
      }

      const existente = await client.query("SELECT id FROM usuarios WHERE LOWER(email) = LOWER($1)", [email.trim()]);
      if (existente.rows.length > 0) {
        throw new Error("El correo electrónico ya se encuentra registrado en el sistema.");
      }

      const passwordHash = await this.hashPassword(password);

      const usuarioRes = await client.query(
        `INSERT INTO usuarios (email, password_hash, nombres, apellidos, telefono, esta_activo, email_verificado_en)
         VALUES ($1, $2, $3, $4, $5, true, CURRENT_TIMESTAMP)
         RETURNING id, email, nombres, apellidos, telefono, esta_activo, creado_en`,
        [email.trim().toLowerCase(), passwordHash, nombres.trim(), apellidos.trim(), telefono || null]
      );
      const nuevoUsuario = usuarioRes.rows[0];

      await client.query(
        `INSERT INTO roles_administrativos (usuario_id, rol) VALUES ($1, $2)`,
        [nuevoUsuario.id, rol]
      );

      await client.query("COMMIT");

      return {
        success: true,
        message: `Usuario administrativo creado exitosamente con rol '${rol}'.`,
        data: {
          usuario: nuevoUsuario,
          rol,
        },
      };
    } catch (error: any) {
      await client.query("ROLLBACK");
      return {
        success: false,
        message: error.message || "Error al crear usuario administrativo.",
      };
    } finally {
      client.release();
    }
  }

  // Alias compatible hacia atrás
  public async crearAdmin(
    datos: {
      email: string;
      password: string;
      nombres: string;
      apellidos: string;
      telefono?: string;
      rol?: string;
    },
    rolEjecutor: string = "superadmin"
  ) {
    return this.crearUsuarioStaff(datos, rolEjecutor);
  }

  public async listarUsuarios(filtro?: { busqueda?: string; rol?: string }): Promise<any[]> {
    try {
      let query = `
        SELECT 
          u.id, 
          u.email, 
          u.nombres, 
          u.apellidos, 
          u.telefono, 
          u.esta_activo,
          u.esta_activo AS activo,
          u.email_verificado_en,
          (u.email_verificado_en IS NOT NULL) AS email_verificado,
          u.creado_en, 
          u.ultimo_acceso_en,
          pv.id AS perfil_vendedor_id, 
          pv.nombre_tienda, 
          pv.esta_verificado AS tienda_verificada,
          COALESCE(
            (SELECT json_agg(ra.rol) FROM roles_administrativos ra WHERE ra.usuario_id = u.id),
            '[]'::json
          ) AS roles_admin,
          CASE
            WHEN EXISTS (SELECT 1 FROM roles_administrativos ra WHERE ra.usuario_id = u.id AND ra.rol = 'superadmin') THEN 'superadmin'
            WHEN EXISTS (SELECT 1 FROM roles_administrativos ra WHERE ra.usuario_id = u.id AND ra.rol = 'admin') THEN 'admin'
            WHEN EXISTS (SELECT 1 FROM roles_administrativos ra WHERE ra.usuario_id = u.id AND ra.rol = 'moderador') THEN 'moderador'
            WHEN EXISTS (SELECT 1 FROM roles_administrativos ra WHERE ra.usuario_id = u.id AND ra.rol = 'soporte') THEN 'soporte'
            WHEN pv.id IS NOT NULL THEN 'vendedor'
            ELSE 'comprador'
          END AS rol_principal
        FROM usuarios u
        LEFT JOIN perfiles_vendedor pv ON pv.usuario_id = u.id
        WHERE u.eliminado_en IS NULL
      `;
      const params: any[] = [];

      if (filtro?.busqueda && filtro.busqueda.trim()) {
        params.push(`%${filtro.busqueda.trim()}%`);
        query += ` AND (
          unaccent(u.nombres) ILIKE unaccent($${params.length}) OR 
          unaccent(u.apellidos) ILIKE unaccent($${params.length}) OR 
          u.email ILIKE $${params.length} OR 
          unaccent(COALESCE(pv.nombre_tienda, '')) ILIKE unaccent($${params.length})
        )`;
      }

      if (filtro?.rol && filtro.rol !== "todos") {
        if (filtro.rol === "vendedor") {
          query += ` AND pv.id IS NOT NULL`;
        } else if (filtro.rol === "comprador") {
          query += ` AND pv.id IS NULL AND NOT EXISTS (SELECT 1 FROM roles_administrativos ra WHERE ra.usuario_id = u.id)`;
        } else if (["superadmin", "admin", "moderador", "soporte"].includes(filtro.rol)) {
          params.push(filtro.rol);
          query += ` AND EXISTS (SELECT 1 FROM roles_administrativos ra WHERE ra.usuario_id = u.id AND ra.rol = $${params.length})`;
        }
      }

      query += ` ORDER BY u.creado_en DESC;`;
      const result = await pool.query(query, params);
      return result.rows || [];
    } catch (error: any) {
      console.error("Error al listar usuarios:", error);
      throw new Error("No se pudieron listar los usuarios.");
    }
  }

  public async cambiarEstadoUsuario(
    usuarioId: string,
    nuevoEstado: boolean,
    rolEjecutor: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Obtener el rol del usuario objetivo
      const targetRes = await pool.query(
        `SELECT u.id, u.esta_activo,
                COALESCE(
                  (SELECT ra.rol::text FROM roles_administrativos ra WHERE ra.usuario_id = u.id ORDER BY CASE ra.rol WHEN 'superadmin' THEN 1 WHEN 'admin' THEN 2 WHEN 'moderador' THEN 3 ELSE 4 END LIMIT 1),
                  CASE WHEN pv.id IS NOT NULL THEN 'vendedor' ELSE 'comprador' END
                ) AS rol_principal
         FROM usuarios u
         LEFT JOIN perfiles_vendedor pv ON pv.usuario_id = u.id
         WHERE u.id = $1 AND u.eliminado_en IS NULL;`,
        [usuarioId]
      );

      if (targetRes.rows.length === 0) {
        throw new Error("Usuario no encontrado.");
      }

      const target = targetRes.rows[0];

      if (target.rol_principal === "superadmin" && rolEjecutor !== "superadmin") {
        throw new Error("Acceso denegado: No puedes modificar el estado de un Superadministrador.");
      }

      if (target.rol_principal === "admin" && rolEjecutor !== "superadmin") {
        throw new Error("Acceso denegado: Un administrador no puede modificar el estado de otro administrador.");
      }

      await pool.query(
        "UPDATE usuarios SET esta_activo = $1, actualizado_en = CURRENT_TIMESTAMP WHERE id = $2",
        [nuevoEstado, usuarioId]
      );

      return {
        success: true,
        message: `Usuario ${nuevoEstado ? "activado" : "desactivado"} correctamente.`,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || "Error al actualizar estado del usuario.",
      };
    }
  }
}
