-- =============================================================================
-- ESQUEMA DE BASE DE DATOS: MARKETPLACE DE CAMISETAS DE FÚTBOL
-- Motor: PostgreSQL 13+
-- Idioma: Español
-- =============================================================================

-- 0. EXTENSIONES
CREATE EXTENSION IF NOT EXISTS "citext";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- =============================================================================
-- 1. TIPOS ENUMERADOS (ENUMS)
-- =============================================================================
CREATE TYPE rol_administrativo_enum AS ENUM ('admin', 'superadmin', 'moderador', 'soporte');
CREATE TYPE tipo_equipo_enum AS ENUM ('club', 'seleccion_nacional');
CREATE TYPE tipo_indumentaria_enum AS ENUM ('local', 'visitante', 'tercera', 'cuarta', 'arquero', 'edicion_especial', 'entrenamiento');
CREATE TYPE genero_enum AS ENUM ('hombre', 'mujer', 'unisex');
CREATE TYPE talla_enum AS ENUM (
    '2XS', 'XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL',
    'NINO_2', 'NINO_4', 'NINO_6', 'NINO_8', 'NINO_10', 'NINO_12', 'NINO_14', 'NINO_16'
);
CREATE TYPE tipo_edicion_enum AS ENUM ('aficionado_estadio', 'jugador_version_profesional', 'reedicion_retro');
CREATE TYPE autenticidad_enum AS ENUM ('original_oficial', 'replica_autorizada', 'reedicion_retro', 'replica_no_oficial');
CREATE TYPE estado_prenda_enum AS ENUM ('nueva_con_etiqueta', 'nueva_sin_etiqueta', 'usada_como_nueva', 'usada_buen_estado', 'usada_estado_aceptable', 'reliquia_coleccion');
CREATE TYPE estado_publicacion_enum AS ENUM ('borrador', 'en_revision', 'activa', 'pausada', 'agotada', 'bloqueada_admin', 'archivada');
CREATE TYPE estado_pedido_enum AS ENUM ('pendiente_pago', 'pago_fallido', 'pagado', 'en_proceso', 'parcialmente_despachado', 'completado', 'cancelado', 'reembolsado', 'en_disputa');
CREATE TYPE estado_pedido_vendedor_enum AS ENUM (
    'pendiente_despacho', 
    'por_coordinar_entrega', 
    'guia_generada', 
    'en_camino', 
    'listo_para_entrega_en_persona', 
    'entregado', 
    'cancelado', 
    'devuelto'
);
CREATE TYPE metodo_entrega_enum AS ENUM ('envio_transportadora', 'entrega_en_persona');
CREATE TYPE estado_pago_enum AS ENUM ('pendiente', 'aprobado', 'rechazado', 'en_mediacion', 'reembolsado', 'contracargo');
CREATE TYPE estado_liquidacion_enum AS ENUM ('pendiente', 'en_proceso', 'pagado', 'fallido', 'cancelado');
CREATE TYPE estado_disputa_enum AS ENUM ('abierta', 'en_revision', 'esperando_vendedor', 'resuelta_reembolso', 'resuelta_rechazada', 'cerrada');

-- =============================================================================
-- 2. USUARIOS, ROLES, PERFILES Y DIRECCIONES
-- =============================================================================
CREATE TABLE usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email CITEXT NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    nombres VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    telefono VARCHAR(30),
    esta_activo BOOLEAN NOT NULL DEFAULT true,
    email_verificado_en TIMESTAMPTZ,
    ultimo_acceso_en TIMESTAMPTZ,
    anonimizado_en TIMESTAMPTZ,              -- Ley 1581 Habeas Data
    eliminado_en TIMESTAMPTZ,                 -- Soft delete
    creado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Solo para administradores/moderadores del sistema
CREATE TABLE roles_administrativos (
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    rol rol_administrativo_enum NOT NULL,
    otorgado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (usuario_id, rol)
);

-- Perfil de vendedor (la existencia del registro otorga la capacidad de vender)
CREATE TABLE perfiles_vendedor (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL UNIQUE REFERENCES usuarios(id) ON DELETE RESTRICT,
    nombre_tienda VARCHAR(120) NOT NULL UNIQUE,
    slug VARCHAR(140) NOT NULL UNIQUE,
    biografia TEXT,
    logo_url TEXT,
    banner_url TEXT,
    datos_cuenta_bancaria JSONB,             -- Cifrar a nivel de aplicación (ej. AES-256 GCM)
    esta_verificado BOOLEAN NOT NULL DEFAULT false,
    url_documentos_verificacion TEXT,        -- Almacenar en bucket privado con acceso restringido
    promedio_calificacion NUMERIC(3, 2) NOT NULL DEFAULT 0.00 CHECK (promedio_calificacion >= 0 AND promedio_calificacion <= 5),
    total_calificaciones INT NOT NULL DEFAULT 0 CHECK (total_calificaciones >= 0),
    tasa_comision NUMERIC(5, 2) NOT NULL DEFAULT 10.00 CHECK (tasa_comision >= 0), -- % comisión
    creado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE direcciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    nombre_destinatario VARCHAR(150) NOT NULL,
    telefono_contacto VARCHAR(30) NOT NULL,
    departamento VARCHAR(100) NOT NULL,       -- ej: Antioquia, Cundinamarca, Valle
    ciudad VARCHAR(100) NOT NULL,             -- ej: Medellín, Bogotá, Cali
    barrio VARCHAR(100),
    direccion_detallada TEXT NOT NULL,        -- Calle, Carrera, Edificio, Apto
    codigo_postal VARCHAR(20),
    codigo_dane VARCHAR(10),                  -- Código DANE de municipio
    instrucciones_entrega TEXT,
    es_predeterminada BOOLEAN NOT NULL DEFAULT false,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX idx_direcciones_usuario_defecto ON direcciones (usuario_id) WHERE es_predeterminada = true;

-- =============================================================================
-- 3. CATÁLOGO CANÓNICO (DATOS MAESTROS DEL FÚTBOL)
-- =============================================================================
CREATE TABLE categorias (
    id SERIAL PRIMARY KEY,
    categoria_padre_id INT REFERENCES categorias(id) ON DELETE SET NULL,
    nombre VARCHAR(100) NOT NULL,
    slug VARCHAR(120) NOT NULL UNIQUE,
    descripcion TEXT,
    imagen_url TEXT
);

CREATE TABLE marcas (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(120) NOT NULL UNIQUE,
    logo_url TEXT
);

CREATE TABLE colores (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE,       -- ej: 'Blanco Real', 'Azulgrana', 'Vinotinto'
    codigo_hex VARCHAR(7)                     -- ej: '#FFFFFF'
);

CREATE TABLE ligas (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,             -- ej: 'LaLiga', 'Liga BetPlay', 'UEFA Champions League'
    slug VARCHAR(160) NOT NULL UNIQUE,
    pais VARCHAR(100),                        -- null para torneos continentales / mundiales
    confederacion VARCHAR(50),                -- UEFA, CONMEBOL, CONCACAF, FIFA
    logo_url TEXT
);

CREATE TABLE equipos (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,             -- ej: 'Real Madrid CF', 'Atlético Nacional', 'Selección Colombia'
    nombre_corto VARCHAR(50),
    slug VARCHAR(160) NOT NULL UNIQUE,
    pais VARCHAR(100) NOT NULL,
    tipo_equipo tipo_equipo_enum NOT NULL DEFAULT 'club',
    escudo_url TEXT
);

CREATE TABLE equipos_competiciones (
    equipo_id INT NOT NULL REFERENCES equipos(id) ON DELETE CASCADE,
    liga_id INT NOT NULL REFERENCES ligas(id) ON DELETE CASCADE,
    anio_temporada INT NOT NULL,
    PRIMARY KEY (equipo_id, liga_id, anio_temporada)
);

CREATE TABLE jugadores (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,             -- ej: 'Radamel Falcao', 'Lionel Messi'
    equipo_actual_id INT REFERENCES equipos(id) ON DELETE SET NULL,
    slug VARCHAR(160) NOT NULL UNIQUE,
    foto_url TEXT
);

CREATE TABLE parches (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL UNIQUE,      -- ej: 'Champions League 14 Copas', 'Campeón Copa América'
    liga_id INT REFERENCES ligas(id) ON DELETE SET NULL,
    imagen_url TEXT
);

-- Modelo Canónico de Camiseta
CREATE TABLE modelos_camiseta (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    equipo_id INT NOT NULL REFERENCES equipos(id) ON DELETE RESTRICT,
    marca_id INT NOT NULL REFERENCES marcas(id) ON DELETE RESTRICT,
    anio_inicio_temporada INT NOT NULL CHECK (anio_inicio_temporada BETWEEN 1900 AND 2100),
    anio_fin_temporada INT CHECK (anio_fin_temporada >= anio_inicio_temporada),
    tipo_indumentaria tipo_indumentaria_enum NOT NULL,
    etiqueta_edicion VARCHAR(100),            -- ej: 'Final Cardiff', 'Edición 120 Años'
    es_retro BOOLEAN NOT NULL DEFAULT false,
    color_primario_id INT REFERENCES colores(id) ON DELETE SET NULL,
    color_secundario_id INT REFERENCES colores(id) ON DELETE SET NULL,
    nombre_canonico VARCHAR(255) NOT NULL,    -- ej: 'Real Madrid 2017/2018 Local'
    descripcion TEXT,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX uq_modelo_camiseta_canonico ON modelos_camiseta 
    (equipo_id, anio_inicio_temporada, tipo_indumentaria, marca_id, COALESCE(etiqueta_edicion, ''));

-- =============================================================================
-- 4. MARKETPLACE: PUBLICACIONES, VARIANTES E IMÁGENES
-- =============================================================================
CREATE TABLE publicaciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendedor_id UUID NOT NULL REFERENCES perfiles_vendedor(id) ON DELETE RESTRICT,
    modelo_camiseta_id UUID NOT NULL REFERENCES modelos_camiseta(id) ON DELETE RESTRICT,
    titulo VARCHAR(255) NOT NULL,
    descripcion TEXT NOT NULL,
    tipo_edicion tipo_edicion_enum NOT NULL,
    autenticidad autenticidad_enum NOT NULL,
    estado_prenda estado_prenda_enum NOT NULL,
    cantidad_usos INT CHECK (cantidad_usos >= 0),
    detalles_defectos TEXT,
    genero genero_enum NOT NULL DEFAULT 'unisex',
    permite_estampado_personalizado BOOLEAN NOT NULL DEFAULT false,
    
    -- Opciones de Entrega y Ubicación
    permite_envio_transportadora BOOLEAN NOT NULL DEFAULT true,
    permite_entrega_en_persona BOOLEAN NOT NULL DEFAULT false,
    ciudad_entrega_persona VARCHAR(100),      -- ej: 'Medellín'
    zona_entrega_persona TEXT,                -- ej: 'Estación Metro Poblado / CC Mayorca'
    
    estado estado_publicacion_enum NOT NULL DEFAULT 'activa',
    nota_moderacion TEXT,
    moneda VARCHAR(3) NOT NULL DEFAULT 'COP',
    eliminado_en TIMESTAMPTZ,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_al_menos_un_metodo_entrega CHECK (permite_envio_transportadora = true OR permite_entrega_en_persona = true),
    CONSTRAINT chk_ciudad_requerida_si_entrega_persona CHECK (NOT permite_entrega_en_persona OR ciudad_entrega_persona IS NOT NULL)
);

CREATE TABLE publicaciones_estadisticas (
    publicacion_id UUID PRIMARY KEY REFERENCES publicaciones(id) ON DELETE CASCADE,
    total_visitas INT NOT NULL DEFAULT 0,
    total_favoritos INT NOT NULL DEFAULT 0,
    actualizado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE variantes_publicacion (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    publicacion_id UUID NOT NULL REFERENCES publicaciones(id) ON DELETE CASCADE,
    sku VARCHAR(60),
    talla talla_enum NOT NULL,
    color_id INT REFERENCES colores(id) ON DELETE SET NULL,
    nombre_estampado VARCHAR(100),
    numero_estampado INT CHECK (numero_estampado BETWEEN 0 AND 99),
    jugador_id INT REFERENCES jugadores(id) ON DELETE SET NULL,
    precio NUMERIC(12, 2) NOT NULL CHECK (precio >= 0),
    stock INT NOT NULL DEFAULT 1 CHECK (stock >= 0),
    stock_reservado INT NOT NULL DEFAULT 0 CHECK (stock_reservado >= 0),
    creado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_stock_reservado_menor_o_igual CHECK (stock_reservado <= stock)
);
CREATE UNIQUE INDEX uq_variante_publicacion ON variantes_publicacion (
    publicacion_id, 
    talla, 
    COALESCE(color_id, 0), 
    COALESCE(nombre_estampado, ''), 
    COALESCE(numero_estampado, -1)
);

CREATE TABLE imagenes_publicacion (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    publicacion_id UUID NOT NULL REFERENCES publicaciones(id) ON DELETE CASCADE,
    imagen_url TEXT NOT NULL,
    es_portada BOOLEAN NOT NULL DEFAULT false,
    orden_visualizacion INT NOT NULL DEFAULT 0,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE publicaciones_parches (
    publicacion_id UUID NOT NULL REFERENCES publicaciones(id) ON DELETE CASCADE,
    parche_id INT NOT NULL REFERENCES parches(id) ON DELETE CASCADE,
    PRIMARY KEY (publicacion_id, parche_id)
);

CREATE TABLE publicaciones_categorias (
    publicacion_id UUID NOT NULL REFERENCES publicaciones(id) ON DELETE CASCADE,
    categoria_id INT NOT NULL REFERENCES categorias(id) ON DELETE CASCADE,
    PRIMARY KEY (publicacion_id, categoria_id)
);

-- =============================================================================
-- 5. CARRITO DE COMPRAS
-- =============================================================================
CREATE TABLE carritos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL UNIQUE REFERENCES usuarios(id) ON DELETE CASCADE,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE items_carrito (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    carrito_id UUID NOT NULL REFERENCES carritos(id) ON DELETE CASCADE,
    variante_id UUID NOT NULL REFERENCES variantes_publicacion(id) ON DELETE CASCADE,
    cantidad INT NOT NULL DEFAULT 1 CHECK (cantidad > 0),
    solicitud_nombre_personalizado VARCHAR(100),
    solicitud_numero_personalizado INT CHECK (solicitud_numero_personalizado BETWEEN 0 AND 99),
    creado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_carrito_variante UNIQUE (carrito_id, variante_id)
);

-- =============================================================================
-- 6. PEDIDOS, SUB-PEDIDOS MULTI-VENDEDOR, PAGOS Y ENTREGAS
-- =============================================================================
CREATE TABLE pedidos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    numero_pedido VARCHAR(32) NOT NULL UNIQUE, -- ej: 'PED-2026-0001'
    comprador_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
    estado estado_pedido_enum NOT NULL DEFAULT 'pendiente_pago',
    moneda VARCHAR(3) NOT NULL DEFAULT 'COP',
    subtotal NUMERIC(12, 2) NOT NULL CHECK (subtotal >= 0),
    total_envios NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (total_envios >= 0),
    total_descuentos NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (total_descuentos >= 0),
    total_impuestos NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (total_impuestos >= 0),
    monto_total NUMERIC(12, 2) NOT NULL CHECK (monto_total >= 0),
    
    -- Snapshots inmutables de compra
    datos_comprador_snapshot JSONB NOT NULL,
    direccion_envio_snapshot JSONB,            -- Puede ser null si toda la orden fue entrega en persona
    
    expira_en TIMESTAMPTZ,                     -- Plazo para pagar antes de liberar el stock reservado
    creado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_matematica_pedido CHECK (monto_total = subtotal + total_envios + total_impuestos - total_descuentos)
);

-- Sub-pedidos divididos por cada vendedor
CREATE TABLE pedidos_vendedor (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pedido_id UUID NOT NULL REFERENCES pedidos(id) ON DELETE RESTRICT,
    vendedor_id UUID NOT NULL REFERENCES perfiles_vendedor(id) ON DELETE RESTRICT,
    numero_subpedido VARCHAR(40) NOT NULL UNIQUE, -- ej: 'PED-2026-0001-V1'
    estado estado_pedido_vendedor_enum NOT NULL DEFAULT 'pendiente_despacho',
    metodo_entrega metodo_entrega_enum NOT NULL,  -- 'envio_transportadora' o 'entrega_en_persona'
    
    subtotal NUMERIC(12, 2) NOT NULL CHECK (subtotal >= 0),
    costo_envio NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (costo_envio >= 0),
    tasa_comision_snapshot NUMERIC(5, 2) NOT NULL CHECK (tasa_comision_snapshot >= 0),
    monto_comision_plataforma NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (monto_comision_plataforma >= 0),
    pago_neto_vendedor NUMERIC(12, 2) NOT NULL CHECK (pago_neto_vendedor >= 0),
    
    liquidacion_id UUID,                      -- FK a liquidaciones cuando se transfiera el dinero
    creado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_pedido_vendedor UNIQUE (pedido_id, vendedor_id),
    CONSTRAINT uq_pedido_vendedor_metodo UNIQUE (id, metodo_entrega),
    CONSTRAINT chk_entrega_en_persona_costo_cero CHECK (metodo_entrega <> 'entrega_en_persona' OR costo_envio = 0),
    CONSTRAINT chk_pago_neto_vendedor CHECK (pago_neto_vendedor = (subtotal - monto_comision_plataforma) + costo_envio)
);

CREATE TABLE items_pedido (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pedido_vendedor_id UUID NOT NULL REFERENCES pedidos_vendedor(id) ON DELETE RESTRICT,
    variante_id UUID NOT NULL REFERENCES variantes_publicacion(id) ON DELETE RESTRICT,
    
    -- Snapshots inmutables de la camiseta adquirida
    titulo_snapshot VARCHAR(255) NOT NULL,
    sku_snapshot VARCHAR(60),
    talla_snapshot talla_enum NOT NULL,
    estado_prenda_snapshot estado_prenda_enum NOT NULL,
    autenticidad_snapshot autenticidad_enum NOT NULL,
    estampado_snapshot VARCHAR(150),
    
    precio_unitario NUMERIC(12, 2) NOT NULL CHECK (precio_unitario >= 0),
    cantidad INT NOT NULL CHECK (cantidad > 0),
    subtotal NUMERIC(12, 2) NOT NULL CHECK (subtotal >= 0),
    creado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_subtotal_item CHECK (subtotal = precio_unitario * cantidad)
);

CREATE TABLE pagos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pedido_id UUID NOT NULL REFERENCES pedidos(id) ON DELETE RESTRICT,
    pasarela VARCHAR(50) NOT NULL,            -- 'wompi', 'mercadopago', 'stripe', 'pse'
    id_transaccion_pasarela VARCHAR(150) NOT NULL,
    metodo_pago VARCHAR(50) NOT NULL,         -- 'tarjeta_credito', 'pse', 'nequi', 'bancolombia'
    monto NUMERIC(12, 2) NOT NULL CHECK (monto >= 0),
    moneda VARCHAR(3) NOT NULL DEFAULT 'COP',
    estado estado_pago_enum NOT NULL DEFAULT 'pendiente',
    respuesta_pasarela JSONB,
    pagado_en TIMESTAMPTZ,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_pago_pasarela_tx UNIQUE (pasarela, id_transaccion_pasarela)
);
CREATE UNIQUE INDEX uq_pago_aprobado_por_pedido ON pagos (pedido_id) WHERE estado = 'aprobado';

-- Manejo de envíos por transportadora O entregas coordinadas en persona
CREATE TABLE entregas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pedido_vendedor_id UUID NOT NULL UNIQUE,
    metodo_entrega metodo_entrega_enum NOT NULL,
    
    -- Campos para Envío por Transportadora
    transportadora VARCHAR(100),
    numero_guia VARCHAR(120),
    url_seguimiento TEXT,
    url_rotulo_guia TEXT,
    fecha_estimada_entrega DATE,
    
    -- Campos para Coordinación y Seguridad de Entrega en Persona
    lugar_encuentro_acordado TEXT,            -- ej: 'CC Unicentro Bogotá, Entrada 2'
    fecha_hora_encuentro TIMESTAMPTZ,
    propuesto_por_usuario_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
    confirmado_comprador_en TIMESTAMPTZ,
    confirmado_vendedor_en TIMESTAMPTZ,
    
    -- OTP de liberación de fondos (Hash seguro en lugar de texto plano)
    otp_hash VARCHAR(255),
    otp_expira_en TIMESTAMPTZ,
    intentos_otp INT NOT NULL DEFAULT 0 CHECK (intentos_otp >= 0),
    codigo_otp_validado_en TIMESTAMPTZ,
    
    despachado_en TIMESTAMPTZ,
    entregado_en TIMESTAMPTZ,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Amarra el método de entrega de la entrega al del pedido del vendedor
    CONSTRAINT fk_entregas_pedido_vendedor_metodo 
        FOREIGN KEY (pedido_vendedor_id, metodo_entrega) 
        REFERENCES pedidos_vendedor(id, metodo_entrega) ON DELETE RESTRICT,
        
    -- Validación de integridad de transportadora
    CONSTRAINT chk_datos_transportadora_completos 
        CHECK (metodo_entrega <> 'envio_transportadora' OR despachado_en IS NULL 
               OR (transportadora IS NOT NULL AND numero_guia IS NOT NULL))
);

CREATE TABLE historial_estados_pedido (
    id BIGSERIAL PRIMARY KEY,
    pedido_id UUID NOT NULL REFERENCES pedidos(id) ON DELETE RESTRICT,
    estado_anterior estado_pedido_enum,
    estado_nuevo estado_pedido_enum NOT NULL,
    comentario TEXT,
    cambiado_por_usuario_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE historial_estados_subpedido (
    id BIGSERIAL PRIMARY KEY,
    pedido_vendedor_id UUID NOT NULL REFERENCES pedidos_vendedor(id) ON DELETE RESTRICT,
    estado_anterior estado_pedido_vendedor_enum,
    estado_nuevo estado_pedido_vendedor_enum NOT NULL,
    comentario TEXT,
    cambiado_por_usuario_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- 7. LIQUIDACIONES (PAYOUTS) Y DISPUTAS (REEMBOLSOS)
-- =============================================================================
CREATE TABLE liquidaciones_vendedor (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendedor_id UUID NOT NULL REFERENCES perfiles_vendedor(id) ON DELETE RESTRICT,
    monto NUMERIC(12, 2) NOT NULL CHECK (monto > 0),
    moneda VARCHAR(3) NOT NULL DEFAULT 'COP',
    estado estado_liquidacion_enum NOT NULL DEFAULT 'pendiente',
    datos_cuenta_snapshot JSONB NOT NULL,
    referencia_transferencia VARCHAR(150) UNIQUE,
    procesado_en TIMESTAMPTZ,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE pedidos_vendedor 
    ADD CONSTRAINT fk_pedidos_vendedor_liquidacion 
    FOREIGN KEY (liquidacion_id) REFERENCES liquidaciones_vendedor(id) ON DELETE RESTRICT;

CREATE TABLE disputas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pedido_vendedor_id UUID NOT NULL REFERENCES pedidos_vendedor(id) ON DELETE RESTRICT,
    comprador_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
    motivo TEXT NOT NULL,
    urls_imagenes_evidencia JSONB,
    estado estado_disputa_enum NOT NULL DEFAULT 'abierta',
    monto_reembolso NUMERIC(12, 2) CHECK (monto_reembolso >= 0),
    notas_resolucion TEXT,
    resuelto_por_admin_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
    resuelto_en TIMESTAMPTZ,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- 8. RESEÑAS, FAVORITOS Y CUPONES
-- =============================================================================
CREATE TABLE resenas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_pedido_id UUID NOT NULL UNIQUE REFERENCES items_pedido(id) ON DELETE RESTRICT,
    calificacion INT NOT NULL CHECK (calificacion BETWEEN 1 AND 5),
    comentario TEXT,
    respuesta_vendedor TEXT,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE favoritos (
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    publicacion_id UUID NOT NULL REFERENCES publicaciones(id) ON DELETE CASCADE,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (usuario_id, publicacion_id)
);

CREATE TABLE cupones (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(50) NOT NULL UNIQUE,
    porcentaje_descuento NUMERIC(5, 2) CHECK (porcentaje_descuento > 0 AND porcentaje_descuento <= 100),
    monto_fijo_descuento NUMERIC(12, 2) CHECK (monto_fijo_descuento > 0),
    monto_minimo_pedido NUMERIC(12, 2) DEFAULT 0.00,
    valido_desde TIMESTAMPTZ NOT NULL,
    valido_hasta TIMESTAMPTZ NOT NULL,
    usos_maximos INT,
    total_usos INT NOT NULL DEFAULT 0,
    esta_activo BOOLEAN NOT NULL DEFAULT true,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_cupon_descuento_exclusivo CHECK (
        (porcentaje_descuento IS NOT NULL AND monto_fijo_descuento IS NULL) OR
        (porcentaje_descuento IS NULL AND monto_fijo_descuento IS NOT NULL)
    )
);

CREATE TABLE redenciones_cupones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cupon_id INT NOT NULL REFERENCES cupones(id) ON DELETE RESTRICT,
    pedido_id UUID NOT NULL REFERENCES pedidos(id) ON DELETE RESTRICT,
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
    descuento_aplicado NUMERIC(12, 2) NOT NULL CHECK (descuento_aplicado >= 0),
    redimido_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_cupon_por_pedido UNIQUE (cupon_id, pedido_id)
);

-- =============================================================================
-- 9. ÍNDICES DE CLAVES FORÁNEAS, BÚSQUEDA Y RENDIMIENTO
-- =============================================================================
-- Claves Foráneas
CREATE INDEX idx_direcciones_usuario_id ON direcciones (usuario_id);
CREATE INDEX idx_items_carrito_variante_id ON items_carrito (variante_id);
CREATE INDEX idx_categorias_padre_id ON categorias (categoria_padre_id);
CREATE INDEX idx_redenciones_usuario_id ON redenciones_cupones (usuario_id);
CREATE INDEX idx_redenciones_pedido_id ON redenciones_cupones (pedido_id);
CREATE INDEX idx_disputas_pedido_vendedor_id ON disputas (pedido_vendedor_id);
CREATE INDEX idx_disputas_comprador_id ON disputas (comprador_id);
CREATE INDEX idx_favoritos_publicacion_id ON favoritos (publicacion_id);
CREATE INDEX idx_modelos_marca_id ON modelos_camiseta (marca_id);
CREATE INDEX idx_modelos_equipo_id ON modelos_camiseta (equipo_id);
CREATE INDEX idx_pub_categorias_cat_id ON publicaciones_categorias (categoria_id);
CREATE INDEX idx_imagenes_publicacion_id ON imagenes_publicacion (publicacion_id);
CREATE INDEX idx_pub_parches_parche_id ON publicaciones_parches (parche_id);
CREATE INDEX idx_variantes_publicacion_id ON variantes_publicacion (publicacion_id);
CREATE INDEX idx_variantes_color_id ON variantes_publicacion (color_id);
CREATE INDEX idx_variantes_jugador_id ON variantes_publicacion (jugador_id);
CREATE INDEX idx_parches_liga_id ON parches (liga_id);
CREATE INDEX idx_publicaciones_modelo_id ON publicaciones (modelo_camiseta_id);
CREATE INDEX idx_publicaciones_vendedor_id ON publicaciones (vendedor_id);
CREATE INDEX idx_items_pedido_subpedido_id ON items_pedido (pedido_vendedor_id);
CREATE INDEX idx_items_pedido_variante_id ON items_pedido (variante_id);
CREATE INDEX idx_historial_pedidos_pedido_id ON historial_estados_pedido (pedido_id, creado_en);
CREATE INDEX idx_historial_subpedidos_id ON historial_estados_subpedido (pedido_vendedor_id, creado_en);
CREATE INDEX idx_pagos_pedido_id ON pagos (pedido_id);
CREATE INDEX idx_liquidaciones_vendedor_id ON liquidaciones_vendedor (vendedor_id);
CREATE INDEX idx_jugadores_equipo_id ON jugadores (equipo_actual_id);
CREATE INDEX idx_pedidos_vendedor_vendedor_id ON pedidos_vendedor (vendedor_id);
CREATE INDEX idx_pedidos_vendedor_liquidacion_id ON pedidos_vendedor (liquidacion_id);
CREATE INDEX idx_equipos_competiciones_liga_id ON equipos_competiciones (liga_id);

-- Panel del vendedor y filtros de catálogo
CREATE INDEX idx_pedidos_vendedor_panel ON pedidos_vendedor (vendedor_id, creado_en DESC);
CREATE INDEX idx_publicaciones_activas_feed ON publicaciones (creado_en DESC) WHERE estado = 'activa' AND eliminado_en IS NULL;
CREATE INDEX idx_publicaciones_modelo_estado ON publicaciones (modelo_camiseta_id, estado) WHERE eliminado_en IS NULL;
CREATE INDEX idx_variantes_filtro_catalogo ON variantes_publicacion (talla, precio) WHERE stock > 0;
CREATE INDEX idx_pedidos_comprador_fecha ON pedidos (comprador_id, creado_en DESC);

-- Búsqueda de Texto Completo y Trigramas (Autocompletado)
CREATE INDEX idx_publicaciones_fts ON publicaciones USING gin (
    to_tsvector('spanish', COALESCE(titulo, '') || ' ' || COALESCE(descripcion, ''))
);
CREATE INDEX idx_modelos_fts ON modelos_camiseta USING gin (
    to_tsvector('spanish', COALESCE(nombre_canonico, '') || ' ' || COALESCE(descripcion, ''))
);
CREATE INDEX idx_equipos_nombre_trgm ON equipos USING gin (nombre gin_trgm_ops);
CREATE INDEX idx_jugadores_nombre_trgm ON jugadores USING gin (nombre gin_trgm_ops);

-- =============================================================================
-- 10. TRIGGERS Y FUNCIONES AUTOMÁTICAS
-- =============================================================================
CREATE OR REPLACE FUNCTION actualizar_marca_tiempo_modificacion()
RETURNS TRIGGER AS $$
BEGIN
    NEW.actualizado_en = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_usuarios_actualizado BEFORE UPDATE ON usuarios FOR EACH ROW EXECUTE FUNCTION actualizar_marca_tiempo_modificacion();
CREATE TRIGGER trg_perfiles_vendedor_actualizado BEFORE UPDATE ON perfiles_vendedor FOR EACH ROW EXECUTE FUNCTION actualizar_marca_tiempo_modificacion();
CREATE TRIGGER trg_direcciones_actualizado BEFORE UPDATE ON direcciones FOR EACH ROW EXECUTE FUNCTION actualizar_marca_tiempo_modificacion();
CREATE TRIGGER trg_publicaciones_actualizado BEFORE UPDATE ON publicaciones FOR EACH ROW EXECUTE FUNCTION actualizar_marca_tiempo_modificacion();
CREATE TRIGGER trg_publicaciones_estadisticas_actualizado BEFORE UPDATE ON publicaciones_estadisticas FOR EACH ROW EXECUTE FUNCTION actualizar_marca_tiempo_modificacion();
CREATE TRIGGER trg_variantes_publicacion_actualizado BEFORE UPDATE ON variantes_publicacion FOR EACH ROW EXECUTE FUNCTION actualizar_marca_tiempo_modificacion();
CREATE TRIGGER trg_carritos_actualizado BEFORE UPDATE ON carritos FOR EACH ROW EXECUTE FUNCTION actualizar_marca_tiempo_modificacion();
CREATE TRIGGER trg_items_carrito_actualizado BEFORE UPDATE ON items_carrito FOR EACH ROW EXECUTE FUNCTION actualizar_marca_tiempo_modificacion();
CREATE TRIGGER trg_pedidos_actualizado BEFORE UPDATE ON pedidos FOR EACH ROW EXECUTE FUNCTION actualizar_marca_tiempo_modificacion();
CREATE TRIGGER trg_pedidos_vendedor_actualizado BEFORE UPDATE ON pedidos_vendedor FOR EACH ROW EXECUTE FUNCTION actualizar_marca_tiempo_modificacion();
CREATE TRIGGER trg_pagos_actualizado BEFORE UPDATE ON pagos FOR EACH ROW EXECUTE FUNCTION actualizar_marca_tiempo_modificacion();
CREATE TRIGGER trg_entregas_actualizado BEFORE UPDATE ON entregas FOR EACH ROW EXECUTE FUNCTION actualizar_marca_tiempo_modificacion();
CREATE TRIGGER trg_liquidaciones_actualizado BEFORE UPDATE ON liquidaciones_vendedor FOR EACH ROW EXECUTE FUNCTION actualizar_marca_tiempo_modificacion();
CREATE TRIGGER trg_disputas_actualizado BEFORE UPDATE ON disputas FOR EACH ROW EXECUTE FUNCTION actualizar_marca_tiempo_modificacion();
CREATE TRIGGER trg_cupones_actualizado BEFORE UPDATE ON cupones FOR EACH ROW EXECUTE FUNCTION actualizar_marca_tiempo_modificacion();
CREATE TRIGGER trg_resenas_actualizado BEFORE UPDATE ON resenas FOR EACH ROW EXECUTE FUNCTION actualizar_marca_tiempo_modificacion();

-- Trigger para validar pertenencia de vendedor y compatibilidad de entrega del ítem
CREATE OR REPLACE FUNCTION validar_metodo_entrega_item_pedido()
RETURNS TRIGGER AS $$
DECLARE
    v_metodo_entrega metodo_entrega_enum;
    v_vendedor_subpedido UUID;
    v_vendedor_publicacion UUID;
    v_permite_transportadora BOOLEAN;
    v_permite_persona BOOLEAN;
BEGIN
    SELECT pv.metodo_entrega, pv.vendedor_id
      INTO v_metodo_entrega, v_vendedor_subpedido
    FROM pedidos_vendedor pv 
    WHERE pv.id = NEW.pedido_vendedor_id;

    SELECT p.permite_envio_transportadora, p.permite_entrega_en_persona, p.vendedor_id
      INTO v_permite_transportadora, v_permite_persona, v_vendedor_publicacion
    FROM variantes_publicacion vp
    JOIN publicaciones p ON p.id = vp.publicacion_id
    WHERE vp.id = NEW.variante_id;

    -- Validar que el ítem pertenezca al mismo vendedor del sub-pedido
    IF v_vendedor_publicacion IS DISTINCT FROM v_vendedor_subpedido THEN
        RAISE EXCEPTION 'El ítem % pertenece al vendedor %, no al vendedor % del subpedido.', 
            NEW.variante_id, v_vendedor_publicacion, v_vendedor_subpedido;
    END IF;

    -- Validar método de entrega seleccionado
    IF v_metodo_entrega = 'envio_transportadora' AND NOT v_permite_transportadora THEN
        RAISE EXCEPTION 'La publicación del ítem % no admite envío por transportadora.', NEW.variante_id;
    END IF;

    IF v_metodo_entrega = 'entrega_en_persona' AND NOT v_permite_persona THEN
        RAISE EXCEPTION 'La publicación del ítem % no admite entrega en persona.', NEW.variante_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_validar_metodo_entrega_item
BEFORE INSERT OR UPDATE ON items_pedido
FOR EACH ROW EXECUTE FUNCTION validar_metodo_entrega_item_pedido();

-- Trigger para recalcular automáticamente la reputación del vendedor al recibir reseñas
CREATE OR REPLACE FUNCTION recalcular_reputacion_vendedor()
RETURNS TRIGGER AS $$
DECLARE
    v_vendedor_id UUID;
BEGIN
    SELECT pv.vendedor_id INTO v_vendedor_id
    FROM items_pedido ip
    JOIN pedidos_vendedor pv ON pv.id = ip.pedido_vendedor_id
    WHERE ip.id = COALESCE(NEW.item_pedido_id, OLD.item_pedido_id);

    IF v_vendedor_id IS NOT NULL THEN
        UPDATE perfiles_vendedor
        SET 
            total_calificaciones = (
                SELECT COUNT(*) 
                FROM resenas r
                JOIN items_pedido ip ON ip.id = r.item_pedido_id
                JOIN pedidos_vendedor pv ON pv.id = ip.pedido_vendedor_id
                WHERE pv.vendedor_id = v_vendedor_id
            ),
            promedio_calificacion = COALESCE((
                SELECT ROUND(AVG(r.calificacion)::numeric, 2)
                FROM resenas r
                JOIN items_pedido ip ON ip.id = r.item_pedido_id
                JOIN pedidos_vendedor pv ON pv.id = ip.pedido_vendedor_id
                WHERE pv.vendedor_id = v_vendedor_id
            ), 0.00)
        WHERE id = v_vendedor_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_recalcular_reputacion_vendedor
AFTER INSERT OR UPDATE OR DELETE ON resenas
FOR EACH ROW EXECUTE FUNCTION recalcular_reputacion_vendedor();
