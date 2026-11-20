# INDIGO TECH — Sistema Industrial de Registro de Despacho y Recibos A4 (Next.js + Tailwind CSS)

Aplicación web Full-Stack en **Next.js (App Router)** con **Tailwind CSS** diseñada para plantas de lavandería industrial de mezclilla (denim) y textiles.

## Módulos Incluidos

1. **Dashboard / Formulario de Registro de Despacho (`src/app/page.tsx`)**
   - **Selección o Creación Rápida de Cliente**: Buscador instantáneo en directorio o formulario rápido (`+ Crear Cliente Rápido`) con Nombre/Razón Social, RUC/Cédula, Teléfono y Dirección.
   - **Datos del Despacho**: Número de orden consecutivo (`ORD-2026-XXXX`), Fecha de recepción/emisión, Fecha estimada de entrega y Observaciones técnicas.
   - **Detalle Dinámico de Ítems / Prendas**: Múltiples lotes por despacho con Tipo de prenda, Color/Tono base, Cantidad de unidades y N° de lote.
   - **Selección Múltiple de Procesos Industriales**: Chips interactivos (Lavado Enzimático, Deslavado/Stone Wash, Neutralizado, Teñido, Desengomado, Blanqueo, Lavado Ácido, Suavizado Siliconado, Fijado de Índigo, Ozono) + adición de procesos personalizados.
   - **Selección Múltiple de Manualidades / Acabados Artesanales**: Chips interactivos (Bigotes/Whiskers, Roturas/Grinding, Lijado Localizado, Raspado/Chevrons, Focalizado PP, Arrugado 3D, Destroyer/Láser, Salpicado, Tie-Dye) + adición de acabados personalizados.

2. **Vista de Recibo en Formato A4 Doble Sección (`src/components/ReceiptA4View.tsx` & `src/app/globals.css`)**
   - Hoja vertical A4 (`210mm × 297mm`) dividida exactamente en dos mitades simétricas de `148.5mm` cada una:
     - **Mitad Superior (`148.5mm`)**: `ORIGINAL - CLIENTE`
     - **Mitad Inferior (`148.5mm`)**: `COPIA - ARCHIVO PLANTA`
   - Configuración estricta `@media print` y `@page { size: A4 portrait; margin: 0mm; }` sin desbordamientos y ocultando la interfaz operativa (`print:hidden`).

## Ejecución Local

```bash
npm install
npm run dev
```

