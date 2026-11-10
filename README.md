# Camifut - Plataforma Marketplace de Camisetas de Fútbol

**Camifut** es un ecosistema de comercio electrónico completo (Full Stack) diseñado especialmente para la compraventa, subasta y coleccionismo de camisetas de fútbol oficiales, vintage, retro y de edición especial.

El proyecto está estructurado como un monorepo que integra un frontend moderno en **Angular 18** y una robusta API RESTful en **Node.js con Express, TypeScript y PostgreSQL**.

---

## Estructura del Repositorio

```
camifut/
├── angular/                    # Frontend SPA (Angular 18, Standalone, Signals, CSS Tokens)
│   ├── src/                    # Código fuente de la aplicación web
│   ├── package.json            # Dependencias y scripts de Angular
│   └── README.md               # Documentación detallada del cliente frontend
│
├── node/                       # Backend API REST (Node.js, Express 5, TypeScript, PostgreSQL)
│   ├── src/                    # Controladores, Modelos, Rutas, Middlewares
│   ├── package.json            # Dependencias y scripts del servidor backend
│   └── README.md               # Documentación completa de la API y Endpoints
│
└── README.md                   # Documentación general del proyecto Camifut
```

---

## Módulos y Documentación

Para consultar la documentación específica de cada módulo, revisa los siguientes archivos:

- **[Documentación del Backend (API REST)](file:///C:/Users/Usuario/Desktop/camifut/node/README.md):** Arquitectura MVC, tablas completas de endpoints organizadas por rol (Públicos, Comprador, Vendedor, Admin y Superadmin), configuración de PostgreSQL y autenticación.
- **[Documentación del Frontend (Angular 18)](file:///C:/Users/Usuario/Desktop/camifut/angular/README.md):** Sistema de componentes Standalone, gestión reactiva con Signals, guards de rutas, sistema de diseño deportivo en modo oscuro e instrucciones de compilación.

---

## Características Principales de la Plataforma

- **Ecosistema Multi-Vendedor:** Vendedores independientes pueden publicar y gestionar sus inventarios, mientras que los compradores pueden realizar pedidos combinados en un único checkout.
- **Catálogo Centralizado y Verificación:** Publicaciones organizadas por equipos, ligas, países y temporadas, con sellos de autenticidad garantizada (*BNWT, Mint, Original Oficial, Versión Jugador Pro*).
- **Variantes de Talla y Precios:** Cada camiseta cuenta con gestión individualizada de stock y precios según su talla (S, M, L, XL, etc.).
- **Carrito y Pedidos Transaccionales:** Manejo de carrito persistente y generación de subpedidos con estados de despacho independientes para cada vendedor.
- **Seguridad y Control de Acceso (RBAC):** Jerarquía estricta de roles:
  - `Comprador`
  - `Vendedor`
  - `Admin`
  - `Superadmin`
- **Experiencia de Usuario Deportiva (Luxury Athletic):** Interfaz fluida y reactiva en modo oscuro con acentos esmeralda eléctrico (*Pitch Green*) y dorado trofeo (*Trophy Gold*).

---

## Puesta en Marcha Rápida

### 1. Clonar el repositorio
```bash
git clone https://github.com/jbarreracaipa34-lang/camifut.git
cd camifut
```

### 2. Iniciar el Backend (Node.js + PostgreSQL)
```bash
cd node
npm install
# Configura tu archivo .env con las credenciales de PostgreSQL
npm run dev
```
El servidor backend se ejecutará en: `http://localhost:3000`

### 3. Iniciar el Frontend (Angular 18)
En una nueva terminal:
```bash
cd angular
npm install
npm start
```
La aplicación web estará disponible en: `http://localhost:4200`

---

## Autor

**Juan Pablo Barrera Caipa**
Desarrollador Full Stack

