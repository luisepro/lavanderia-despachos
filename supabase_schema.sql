-- =============================================================================
-- ESQUEMA COMPLETO DE SUPABASE - BASE DE DATOS EN BLANCO (SIN PRECARGADOS)
-- Copia y pega este script en el SQL Editor de tu proyecto en Supabase y ejecútalo.
-- =============================================================================

-- 1. Habilitar extensión para generación de UUIDs
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Limpieza de tablas previas (en caso de existir) para iniciar 100% en blanco
DROP TABLE IF EXISTS dispatch_items CASCADE;
DROP TABLE IF EXISTS dispatch_orders CASCADE;
DROP TABLE IF EXISTS clients CASCADE;
DROP TABLE IF EXISTS dispatchers CASCADE;
DROP TABLE IF EXISTS garment_types CASCADE;
DROP TABLE IF EXISTS industrial_processes CASCADE;
DROP TABLE IF EXISTS artisan_finishes CASCADE;
DROP TABLE IF EXISTS company_info CASCADE;

-- =============================================================================
-- 3. CREACIÓN DE TABLAS
-- =============================================================================

-- Tabla: Datos de la Empresa (Membrete / Encabezado)
CREATE TABLE company_info (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT NOT NULL DEFAULT 'PROLAVTEX',
    ruc TEXT DEFAULT '',
    direccion TEXT DEFAULT '',
    telefono TEXT DEFAULT '',
    email TEXT DEFAULT '',
    ciudad TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabla: Cartera de Clientes
CREATE TABLE clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT NOT NULL,
    ruc_cedula TEXT DEFAULT '',
    telefono TEXT DEFAULT '',
    direccion TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabla: Encargados / Responsables de Despacho
CREATE TABLE dispatchers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT NOT NULL,
    cargo TEXT DEFAULT 'BODEGUERO',
    telefono TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabla: Tipos de Prenda
CREATE TABLE garment_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    label TEXT NOT NULL,
    category TEXT DEFAULT 'DENIM',
    fabric TEXT DEFAULT '',
    description TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabla: Procesos Industriales
CREATE TABLE industrial_processes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    label TEXT NOT NULL,
    category TEXT DEFAULT 'LAVADO',
    tipo_prenda TEXT DEFAULT '',
    description TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabla: Manualidades y Acabados Artesanales
CREATE TABLE artisan_finishes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    label TEXT NOT NULL,
    category TEXT DEFAULT 'MANUALIDAD SECO',
    tipo_prenda TEXT DEFAULT '',
    technique TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabla: Órdenes de Despacho
CREATE TABLE dispatch_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    numero_orden TEXT NOT NULL UNIQUE,
    fecha DATE NOT NULL DEFAULT CURRENT_DATE,
    fecha_entrega DATE,
    despachado_por TEXT NOT NULL DEFAULT 'ENCARGADO',
    cliente_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    cliente_nombre TEXT NOT NULL,
    cliente_ruc TEXT DEFAULT '',
    cliente_telefono TEXT DEFAULT '',
    cliente_direccion TEXT DEFAULT '',
    observaciones TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabla: Lotes / Items de la Orden de Despacho
CREATE TABLE dispatch_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES dispatch_orders(id) ON DELETE CASCADE,
    tipo_prenda TEXT NOT NULL,
    cantidad INTEGER NOT NULL DEFAULT 0,
    lote TEXT DEFAULT '',
    procesos JSONB DEFAULT '[]'::jsonb,
    manualidades JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================================================
-- 4. ÍNDICES DE RENDIMIENTO
-- =============================================================================
CREATE INDEX idx_dispatch_orders_numero ON dispatch_orders(numero_orden);
CREATE INDEX idx_dispatch_orders_fecha ON dispatch_orders(fecha DESC);
CREATE INDEX idx_dispatch_items_order_id ON dispatch_items(order_id);
CREATE INDEX idx_clients_nombre ON clients(nombre);

-- =============================================================================
-- 5. HABILITAR ROW LEVEL SECURITY (RLS)
-- =============================================================================
ALTER TABLE company_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE dispatchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE garment_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE industrial_processes ENABLE ROW LEVEL SECURITY;
ALTER TABLE artisan_finishes ENABLE ROW LEVEL SECURITY;
ALTER TABLE dispatch_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE dispatch_items ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- 6. POLÍTICAS DE ACCESO TEMPORAL (anon y authenticated)
-- =============================================================================
CREATE POLICY "Acceso completo anon y authenticated - company_info"
    ON company_info FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Acceso completo anon y authenticated - clients"
    ON clients FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Acceso completo anon y authenticated - dispatchers"
    ON dispatchers FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Acceso completo anon y authenticated - garment_types"
    ON garment_types FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Acceso completo anon y authenticated - industrial_processes"
    ON industrial_processes FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Acceso completo anon y authenticated - artisan_finishes"
    ON artisan_finishes FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Acceso completo anon y authenticated - dispatch_orders"
    ON dispatch_orders FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Acceso completo anon y authenticated - dispatch_items"
    ON dispatch_items FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
