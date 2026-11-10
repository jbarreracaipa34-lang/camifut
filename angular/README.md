# Frontend de Camifut - Aplicación Web Angular

Esta aplicación web Single Page Application (SPA) ha sido desarrollada con **Angular 18** para la plataforma **Camifut**, un marketplace de comercio electrónico de camisetas de fútbol coleccionables, retro y oficiales.

Ofrece una interfaz atlética de lujo en modo oscuro (*Luxury Athletic Design System*), navegación fluida sin recargas, gestión de estado reactivo mediante Signals y RxJS, control de acceso por roles en el enrutador con *Guards*, carrito de compras dinámico y dashboards especializados para compradores, vendedores y administradores.

---

## Características principales

- **Arquitectura Standalone:** Implementación nativa de Angular 18 sin `NgModule`, optimizando los tiempos de compilación, empaquetado y carga inicial.
- **Gestión de Estado Reactivo:** Integración de Angular Signals (`signal`, `computed`, `effect`) junto con observables RxJS para sincronización instantánea entre catálogo, carrito y autenticación.
- **Protección de Rutas con Guards:** Control de acceso estricto a través de `authGuard`, `vendedorGuard` y `adminGuard`.
- **Catálogo Deportivo Multicriterio:** Filtros reactivos en tiempo real por término de búsqueda, país/liga, condición de la prenda (BNWT, Mint, Buen estado), tipo de indumentaria, ordenamiento y rango de precios.
- **Experiencia de Detalle de Prenda:** Visualización enriquecida con verificación de autenticidad, insignias de versión (Jugador Pro, Aficionado), selector de tallas con control de stock y detalles de defectos declarados.
- **Flujo de Publicación para Vendedores:** Formulario integral para que vendedores registren camisetas con variantes de tallas, precios independientes, imágenes y políticas de entrega.
- **Carrito de Compras y Checkout:** Panel interactivo de compra que agrupa artículos, calcula totales en pesos colombianos (COP) y procesa órdenes divididas por vendedor.
- **Dashboards Dedicados:**
  - **Panel de Vendedor:** Métricas de inventario, publicaciones activas y gestión de subpedidos y despachos.
  - **Panel de Administrador:** Supervisión de métricas financieras globales, gestión de usuarios y resolución de disputas.
- **Diseño Responsivo Deportivo:** Sistema visual inspirado en la cultura futbolera contemporánea (*Pitch Green #00F59B*, *Trophy Gold #FFC72C*, superficies *Athletic Dark #08090C*).

---

## Arquitectura y Tecnologías

- **Framework:** Angular 18 (Standalone Components)
- **Lenguaje:** TypeScript 5.5+
- **Estilos:** CSS3 nativo con Variables CSS / Design Tokens, Google Material Symbols y Fuentes Deportivas
- **Manejo de Formularios:** Reactive Forms y Template-driven Forms con validaciones estrictas
- **Comunicación HTTP:** `HttpClient` con interceptores para inyección automática de tokens de autenticación
- **Enrutamiento:** Angular Router con `runGuardsAndResolvers: 'always'` y rutas protegidas

---

## Estructura del Proyecto

```
src/app/
├── core/                       # Núcleo de la aplicación
│   ├── guards/                 # Guards de enrutamiento (role.guard.ts)
│   ├── interceptors/           # Interceptores HTTP (token auth)
│   ├── models/                 # Interfaces y modelos TypeScript (publicacion, usuario, pedido, etc.)
│   └── services/               # Servicios de datos (AuthService, PublicacionService, CartService, etc.)
├── features/                   # Módulos y vistas principales
│   ├── admin/                  # Dashboard administrativo (métricas, pedidos, disputas)
│   ├── carrito/                # Vista del carrito de compras y checkout
│   ├── catalogo/               # Catálogo principal con filtros reactivos y buscador
│   ├── detalle-camiseta/       # Vista de detalle de camiseta, tallas y reputación
│   ├── pedidos/                # Historial y seguimiento de pedidos del usuario
│   ├── publicar/               # Formulario de creación y edición de camisetas
│   └── vendedor/               # Dashboard de ventas, stock y pedidos para vendedores
├── shared/                     # Componentes y elementos compartidos
│   └── components/
│       ├── auth-modal/         # Modal flotante de Login y Registro
│       ├── footer/             # Pie de página institucional
│       └── navbar/             # Barra de navegación principal con buscador y contador de carrito
├── app.config.ts               # Configuración global de providers (routing, HTTP)
└── app.routes.ts               # Definición y protección de rutas
```

---

## Enrutamiento y Control de Acceso

| Ruta | Componente | Guardia / Acceso | Descripción |
|---|---|---|---|
| `/catalogo` | `CatalogoComponent` | Público | Catálogo principal con filtros, tarjetas de prendas y búsqueda |
| `/camiseta/:id` | `DetalleCamisetaComponent` | Público | Detalle completo de la prenda, fotos, tallas y políticas |
| `/carrito` | `CarritoComponent` | Público / Usuario | Resumen de compra, edición de cantidades y checkout |
| `/publicar` | `PublicarCamisetaComponent` | `vendedorGuard` | Publicación de nuevas camisetas con variantes y fotos |
| `/publicar/:id` | `PublicarCamisetaComponent` | `vendedorGuard` | Edición de publicaciones existentes |
| `/pedidos` | `PedidosComponent` | `authGuard` | Historial de compras del usuario autenticado |
| `/vendedor` | `VendedorDashboardComponent` | `vendedorGuard` | Gestión de ventas, inventario y despachos del vendedor |
| `/admin` | `AdminDashboardComponent` | `adminGuard` | Supervisión general de métricas, disputas y pedidos |

---

## Instalación y Puesta en Marcha

### Prerrequisitos
- Node.js (versión 18 o superior)
- Angular CLI instalado globalmente (`npm install -g @angular/cli`)

### Pasos de instalación

1. **Navegar a la carpeta del frontend:**
   ```bash
   cd angular
   ```

2. **Instalar dependencias del proyecto:**
   ```bash
   npm install
   ```

3. **Iniciar el servidor de desarrollo:**
   ```bash
   npm start
   # o alternativamente:
   ng serve --port 4200
   ```

4. **Compilar para producción:**
   ```bash
   npm run build
   ```

La aplicación estará disponible en tu navegador en: `http://localhost:4200`

---

## Autor

**Juan Pablo Barrera Caipa**
Desarrollador Full Stack
