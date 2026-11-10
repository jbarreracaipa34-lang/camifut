# API de Camifut - Marketplace de Camisetas de Fútbol

Esta API RESTful ha sido desarrollada para respaldar la plataforma **Camifut**, un marketplace especializado en la compra, venta, verificación y gestión de camisetas de fútbol (vintage, retro, de colección y de temporada actual).

Permite gestionar el ciclo de vida completo de las publicaciones deportivas: catálogo centralizado de equipos y modelos oficiales, control de variantes de tallas y precios, autenticación y autorización por roles, carrito de compras persistente, checkout seguro con arquitectura de subpedidos por vendedor (multi-vendor) y supervisión administrativa de métricas y disputas.

---

## Características principales

- **Gestión Multi-Vendedor:** Los compradores pueden adquirir prendas de múltiples vendedores en un solo checkout, generando subpedidos individuales con control de despacho independiente.
- **Catálogo Oficial:** Gestión estructurada de equipos por países/ligas y modelos de camisetas con metadatos técnicos (temporada, marca, tipo de indumentaria, versión de prenda).
- **Control de Variantes y Stock:** Soporte para múltiples tallas (S, M, L, XL, etc.), stock en tiempo real y precios diferenciados por publicación.
- **Autenticación y Seguridad:** Hash criptográfico de contraseñas con `bcryptjs`, tokens de sesión y validación de esquemas de datos con `zod`.
- **Control de Acceso Basado en Roles (RBAC):** Middlewares jerárquicos para roles `comprador`, `vendedor`, `admin` y `superadmin`.
- **Carrito de Compras Persistente:** Almacenamiento seguro en base de datos para usuarios registrados.
- **Arquitectura MVC en TypeScript:** Separación modular en Controladores, Modelos con consultas parametrizadas a PostgreSQL, Rutas, Middlewares y Sanitizadores.
- **Motor de Base de Datos:** PostgreSQL 13+ con transacciones ACID para operaciones críticas de checkout e inventario.

---

## Arquitectura y Tecnologías

- **Entorno de Ejecución:** Node.js (v18+)
- **Lenguaje:** TypeScript
- **Framework Web:** Express.js (v5)
- **Base de Datos:** PostgreSQL
- **Driver de BD:** `pg` (node-postgres)
- **Seguridad y Criptografía:** `bcryptjs`, CORS
- **Validación de Datos:** `zod`
- **Ejecución en Desarrollo:** `tsx` con recarga en caliente

---

## Autenticación y Autorización

La API implementa un middleware de autenticación (`verificarAutenticacion`) que valida la identidad del usuario y middlewares de rol (`requerirVendedor`, `requerirAdmin`, `requerirSuperadmin`, `requerirStaff`) para proteger las operaciones según la jerarquía establecida.

### Roles del Sistema

| Rol | Alcance y Permisos |
|---|---|
| **Público** | Consulta de catálogo, publicaciones activas, modelos de camisetas, equipos y variantes disponibles. |
| **Comprador** | Gestión de su perfil, uso del carrito de compras, ejecución de checkout y consulta de su historial de compras. |
| **Vendedor** | Creación, actualización y eliminación de sus publicaciones y variantes; gestión del estado de despacho de sus ventas. |
| **Admin** | Control de catálogo oficial (equipos, modelos), supervisión de todos los pedidos, panel de métricas globales, resolución de disputas y gestión de usuarios. |
| **Superadmin** | Máxima jerarquía: asignación de privilegios de administrador y control total de la infraestructura. |

---

## Endpoints de la API

### 1. Autenticación y Perfil

| Método | Endpoint | Acceso | Descripción |
|---|---|---|---|
| `POST` | `/api/auth/registro` | Público | Registro de nuevo usuario (rol comprador por defecto) |
| `POST` | `/api/auth/login` | Público | Inicio de sesión y verificación de credenciales |
| `GET` | `/api/auth/perfil` | Autenticado | Obtiene los datos del perfil del usuario en sesión |
| `POST` | `/api/auth/convertir-en-vendedor` | Autenticado | Habilita el rol de vendedor para el usuario autenticado |

---

### 2. Catálogo y Publicaciones (Productos)

| Método | Endpoint | Acceso | Descripción |
|---|---|---|---|
| `GET` | `/api/publicaciones` | Público | Listar publicaciones activas con filtros (búsqueda, país, tipo, condición, orden, rango de precios) |
| `GET` | `/api/publicaciones/:id` | Público | Ver detalle exhaustivo de una publicación específica |
| `POST` | `/api/publicaciones` | Vendedor | Crear una nueva publicación de camiseta con sus características |
| `PUT` | `/api/publicaciones/:id` | Vendedor | Actualizar información de una publicación existente |
| `DELETE` | `/api/publicaciones/:id` | Vendedor | Eliminar o dar de baja una publicación |

---

### 3. Variantes de Talla y Stock

| Método | Endpoint | Acceso | Descripción |
|---|---|---|---|
| `GET` | `/api/variantes/publicacion/:publicacionId` | Público | Listar variantes de tallas, precios y stock de una publicación |
| `POST` | `/api/variantes` | Vendedor | Registrar una nueva variante de talla para una publicación |
| `PUT` | `/api/variantes/:id` | Vendedor | Modificar stock, precio o talla de una variante |
| `DELETE` | `/api/variantes/:id` | Vendedor | Eliminar una variante de talla |

---

### 4. Carrito de Compras

| Método | Endpoint | Acceso | Descripción |
|---|---|---|---|
| `GET` | `/api/carrito/:usuarioId` | Autenticado | Consultar los artículos activos en el carrito del usuario |
| `POST` | `/api/carrito/item` | Autenticado | Agregar un producto/variante al carrito |
| `DELETE` | `/api/carrito/item/:id` | Autenticado | Eliminar un producto específico del carrito |
| `DELETE` | `/api/carrito/vaciar/:usuarioId` | Autenticado | Vaciar completamente el carrito de compras |

---

### 5. Pedidos y Checkout (Comprador)

| Método | Endpoint | Acceso | Descripción |
|---|---|---|---|
| `POST` | `/api/pedidos/checkout` | Autenticado | Ejecutar compra del carrito generando pedido principal y subpedidos por vendedor |
| `GET` | `/api/pedidos/comprador/mis` | Autenticado | Consultar historial de pedidos del comprador en sesión |
| `GET` | `/api/pedidos/comprador/:compradorId` | Autenticado | Consultar pedidos por ID de comprador |
| `GET` | `/api/pedidos/:id` | Autenticado | Ver detalle de una orden de compra con sus ítems y estado |

---

### 6. Gestión de Ventas (Vendedor)

| Método | Endpoint | Acceso | Descripción |
|---|---|---|---|
| `GET` | `/api/pedidos/vendedor/:vendedorId` | Vendedor | Listar ventas y subpedidos asociados al vendedor |
| `PATCH` | `/api/pedidos/subpedido/:subpedidoId/estado` | Vendedor / Admin | Actualizar el estado de despacho de un subpedido (ej. enviado, entregado) |

---

### 7. Equipos de Fútbol

| Método | Endpoint | Acceso | Descripción |
|---|---|---|---|
| `GET` | `/api/equipos` | Público | Listar todos los clubes y selecciones registrados |
| `GET` | `/api/equipos/:id` | Público | Consultar información detallada de un equipo |
| `POST` | `/api/equipos` | Admin | Registrar un nuevo equipo (nombre, país, escudo URL) |
| `PUT` | `/api/equipos/:id` | Admin | Modificar datos de un equipo existente |
| `DELETE` | `/api/equipos/:id` | Admin | Eliminar un equipo del catálogo |

---

### 8. Modelos de Camisetas (Maestros)

| Método | Endpoint | Acceso | Descripción |
|---|---|---|---|
| `GET` | `/api/modelos-camiseta` | Público | Listar modelos de camisetas oficiales |
| `GET` | `/api/modelos-camiseta/:id` | Público | Ver detalle de un modelo de camiseta específico |
| `POST` | `/api/modelos-camiseta` | Admin | Crear nuevo modelo oficial vinculado a un equipo |
| `PUT` | `/api/modelos-camiseta/:id` | Admin | Editar modelo de camiseta |
| `DELETE` | `/api/modelos-camiseta/:id` | Admin | Eliminar modelo de camiseta |

---

### 9. Administración y Supervisión (Admin & Superadmin)

| Método | Endpoint | Acceso | Descripción |
|---|---|---|---|
| `GET` | `/api/pedidos/admin/metricas` | Admin | Métricas globales de la plataforma (volumen de ventas, órdenes, comisiones) |
| `GET` | `/api/pedidos/admin/disputas` | Admin | Listado de pedidos en disputa o con incidencias |
| `GET` | `/api/pedidos/admin/todos` | Admin | Auditoría y listado completo de todos los pedidos |
| `GET` | `/api/auth/usuarios` | Admin | Listar usuarios registrados en la plataforma |
| `POST` | `/api/auth/crear-admin` | Admin | Crear una cuenta con rol administrativo |
| `POST` | `/api/auth/cambiar-estado` | Admin | Activar, suspender o bloquear un usuario |
| `POST` | `/api/auth/asignar-rol-admin` | Superadmin | Asignación y elevación de privilegios de administrador |

---

## Instalación y Puesta en Marcha

### Prerrequisitos
- Node.js (versión 18 o superior)
- PostgreSQL (versión 13 o superior) activo con base de datos configurada

### Pasos de instalación

1. **Navegar a la carpeta del backend:**
   ```bash
   cd node
   ```

2. **Instalar dependencias:**
   ```bash
   npm install
   ```

3. **Configurar variables de entorno (`.env`):**
   ```env
   PORT=3000
   PGHOST=localhost
   PGPORT=5432
   PGDATABASE=camifut
   PGUSER=postgres
   PGPASSWORD=tu_contraseña
   JWT_SECRET=tu_clave_secreta_jwt
   ```

4. **Ejecutar en modo desarrollo:**
   ```bash
   npm run dev
   ```

5. **Compilar para producción:**
   ```bash
   npm run build
   npm start
   ```

El servidor estará accesible en: `http://localhost:3000`

---

## Autor

**Juan Pablo Barrera Caipa**
Desarrollador Full Stack
