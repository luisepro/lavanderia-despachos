"use client";

import React from "react";
import { CompanyInfo, DispatchOrder } from "@/types/dispatch";
import { Scissors } from "lucide-react";

interface ReceiptA4ViewProps {
  order: DispatchOrder;
  company: CompanyInfo;
  watermark?: string;
}

interface ReceiptHalfProps {
  order: DispatchOrder;
  company: CompanyInfo;
  copyType: "ORIGINAL - CLIENTE" | "COPIA - ARCHIVO PLANTA";
  badgeStyle: string;
  watermark?: string;
}

function formatDateReadable(dateStr: string): string {
  if (!dateStr) return "—";
  const parts = dateStr.split("-");
  if (parts.length !== 3) return dateStr;
  const [year, month, day] = parts;
  const months = [
    "Ene",
    "Feb",
    "Mar",
    "Abr",
    "May",
    "Jun",
    "Jul",
    "Ago",
    "Sep",
    "Oct",
    "Nov",
    "Dic",
  ];
  const mIdx = parseInt(month, 10) - 1;
  return `${day}/${months[mIdx] || month}/${year}`;
}

function ReceiptHalfSection({
  order,
  company,
  copyType,
  badgeStyle,
  watermark,
}: ReceiptHalfProps) {
  const totalPrendas = order.items.reduce(
    (acc, item) => acc + (Number(item.cantidad) || 0),
    0
  );
  const totalLotes = order.items.length;

  return (
    <div className="relative w-full h-[148.5mm] px-[10mm] py-[5.5mm] flex flex-col justify-between bg-white text-slate-900 box-border overflow-hidden select-text">
      {watermark && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-10 overflow-hidden">
          <span className="text-slate-900/[0.045] text-7xl font-black tracking-[0.25em] uppercase rotate-[-24deg] select-none">
            {watermark}
          </span>
        </div>
      )}
      {/* TOP ZONE: HEADER + CLIENT + TABLE */}
      <div className="flex flex-col gap-1.5">
        {/* 1. CABECERA CORPORATIVA INDUSTRIAL */}
        <div className="flex items-start justify-between border-b-[1.5px] border-slate-900 pb-1.5">
          <div className="flex items-start gap-2.5">
            {/* Monograma Industrial Minimalista Prolavtex */}
            <div className="w-9 h-9 border-[1.5px] border-slate-900 bg-slate-900 text-white flex flex-col items-center justify-center shrink-0 font-mono rounded-sm">
              <span className="text-[10.5px] font-bold tracking-tighter leading-none">
                PLX
              </span>
              <span className="text-[6.5px] tracking-widest leading-none mt-0.5 text-slate-300">
                DENIM
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-[12px] font-extrabold tracking-tight uppercase text-slate-950 leading-tight">
                  {company.nombre}
                </h1>
                <span className="text-[8px] font-mono font-semibold px-1.5 py-0.2 border border-slate-400 text-slate-700 uppercase">
                  RUC: {company.ruc}
                </span>
              </div>
              <p className="text-[8.5px] text-slate-600 font-medium leading-tight mt-0.5">
                {company.subtitulo}
              </p>
              <p className="text-[8px] text-slate-500 leading-tight mt-0.5">
                {company.direccion} &bull; Tel: {company.telefono} &bull;{" "}
                <span className="font-mono font-semibold text-slate-700">
                  {company.planta}
                </span>
              </p>
            </div>
          </div>

          {/* CAJA DE ORDEN Y TIPO DE COPIA */}
          <div className="text-right shrink-0 border border-slate-900 px-2.5 py-1 bg-slate-50/70 min-w-[168px]">
            <div className="flex items-center justify-between gap-2 border-b border-slate-300 pb-0.5 mb-0.5">
              <span className="text-[7.5px] font-bold uppercase tracking-wider text-slate-500">
                GUÍA / RECIBO DE DESPACHO
              </span>
              <span
                className={`text-[7.5px] font-mono font-bold px-1.5 py-0.2 uppercase border ${badgeStyle}`}
              >
                {copyType}
              </span>
            </div>
            <div className="font-mono text-[13px] font-black tracking-tight text-slate-950 leading-none py-0.5">
              N° {order.numeroOrden || "ORD-0000"}
            </div>
            <div className="flex items-center justify-end text-[8.5px] text-slate-800 font-mono font-bold mt-0.5">
              <span>Fecha de Emisión: {formatDateReadable(order.fecha)}</span>
            </div>
          </div>
        </div>

        {/* 2. FICHA DE DATOS DEL CLIENTE Y DESPACHO */}
        <div className="grid grid-cols-12 border border-slate-800 text-[8.5px] bg-white">
          <div className="col-span-5 border-r border-slate-300 px-2 py-1">
            <span className="text-[7px] font-bold uppercase tracking-wider text-slate-400 block leading-none">
              CLIENTE / RAZÓN SOCIAL
            </span>
            <span className="font-bold text-slate-900 uppercase truncate block mt-0.5">
              {order.cliente.nombre || "CONSUMIDOR / CLIENTE NO ESPECIFICADO"}
            </span>
          </div>
          <div className="col-span-2 border-r border-slate-300 px-2 py-1">
            <span className="text-[7px] font-bold uppercase tracking-wider text-slate-400 block leading-none">
              RUC / CÉDULA
            </span>
            <span className="font-mono font-semibold text-slate-900 block mt-0.5">
              {order.cliente.rucCedula || "—"}
            </span>
          </div>
          <div className="col-span-2 border-r border-slate-300 px-2 py-1">
            <span className="text-[7px] font-bold uppercase tracking-wider text-slate-400 block leading-none">
              TELÉFONO CONTACTO
            </span>
            <span className="font-mono text-slate-800 truncate block mt-0.5">
              {order.cliente.telefono || "—"}
            </span>
          </div>
          <div className="col-span-3 px-2 py-1">
            <span className="text-[7px] font-bold uppercase tracking-wider text-slate-400 block leading-none">
              DIRECCIÓN / DESTINO
            </span>
            <span className="text-slate-800 truncate block mt-0.5">
              {order.cliente.direccion || "—"}
            </span>
          </div>
        </div>

        {/* 3. TABLA DETALLADA DE PRENDAS, PROCESOS INDUSTRIALES Y MANUALIDADES */}
        <div className="border border-slate-900">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-slate-900 text-white text-[7.5px] uppercase tracking-wider font-bold">
                <th className="py-1 px-1.5 border-r border-slate-700 w-[22px] text-center">
                  #
                </th>
                <th className="py-1 px-1.5 border-r border-slate-700 w-[62px]">
                  Lote
                </th>
                <th className="py-1 px-2 border-r border-slate-700 w-[145px]">
                  Tipo de Prenda
                </th>
                <th className="py-1 px-2 border-r border-slate-700">
                  Proceso Hecho (Despacho / Lavandería)
                </th>
                <th className="py-1 px-2 border-r border-slate-700">
                  Manualidades / Acabados
                </th>
                <th className="py-1 px-2 w-[54px] text-right">Cant.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-300 text-[8.5px]">
              {order.items.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="py-4 text-center text-slate-400 italic"
                  >
                    Sin ítems registrados en esta orden de despacho.
                  </td>
                </tr>
              ) : (
                order.items.map((item, idx) => (
                  <tr
                    key={item.id || idx}
                    className="align-top even:bg-slate-50/60"
                  >
                    <td className="py-1 px-1.5 border-r border-slate-300 text-center font-mono text-[8px] text-slate-500">
                      {String(idx + 1).padStart(2, "0")}
                    </td>
                    <td className="py-1 px-1.5 border-r border-slate-300 font-mono font-bold text-slate-900 text-[8px]">
                      {item.lote || "S/L"}
                    </td>
                    <td className="py-1 px-2 border-r border-slate-300">
                      <div className="font-bold text-slate-900 uppercase leading-tight">
                        {item.tipoPrenda || "Prenda Textil"}
                      </div>
                    </td>
                    <td className="py-1 px-2 border-r border-slate-300">
                      {item.procesos && item.procesos.length > 0 ? (
                        <div className="flex flex-wrap gap-0.5">
                          {item.procesos.map((proc, pIdx) => (
                            <span
                              key={pIdx}
                              className="inline-block text-[7.5px] leading-tight px-1 py-0.2 border border-slate-400 bg-slate-100 text-slate-900 font-medium rounded-[1px]"
                            >
                              {proc}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-[7.5px] text-slate-400 italic">
                          Ninguno especificado
                        </span>
                      )}
                    </td>
                    <td className="py-1 px-2 border-r border-slate-300">
                      {item.manualidades && item.manualidades.length > 0 ? (
                        <div className="flex flex-wrap gap-0.5">
                          {item.manualidades.map((man, mIdx) => (
                            <span
                              key={mIdx}
                              className="inline-block text-[7.5px] leading-tight px-1 py-0.2 border border-slate-700 bg-white text-slate-900 font-semibold rounded-[1px]"
                            >
                              {man}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-[7.5px] text-slate-400 italic">
                          Sin manualidades
                        </span>
                      )}
                    </td>
                    <td className="py-1 px-2 text-right font-mono font-bold text-slate-950 text-[9.5px]">
                      {Number(item.cantidad || 0).toLocaleString("es-EC")}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            <tfoot>
              <tr className="border-t-[1.5px] border-slate-900 bg-slate-100 text-[8.5px] font-bold">
                <td
                  colSpan={3}
                  className="py-1 px-2 border-r border-slate-300 text-slate-700 uppercase"
                >
                  Resumen de Lotes Procesados: {totalLotes}{" "}
                  {totalLotes === 1 ? "Lote" : "Lotes"}
                </td>
                <td
                  colSpan={2}
                  className="py-1 px-2 border-r border-slate-300 text-right uppercase tracking-wider text-slate-800"
                >
                  Total General de Prendas (Unidades):
                </td>
                <td className="py-1 px-2 text-right font-mono text-[10.5px] font-black text-slate-950">
                  {totalPrendas.toLocaleString("es-EC")}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* BOTTOM ZONE: OBSERVATIONS + FORMAL SIGNATURES */}
      <div className="flex flex-col gap-1.5 pt-1">
        {/* 4. OBSERVACIONES Y CONTROL DE CALIDAD */}
        <div className="grid grid-cols-12 gap-2 items-stretch">
          <div className="col-span-7 border border-slate-400 px-2 py-1 bg-slate-50/40 flex flex-col justify-between">
            <div>
              <span className="text-[7px] font-bold uppercase tracking-wider text-slate-500 block leading-none mb-0.5">
                OBSERVACIONES TÉCNICAS / INSTRUCCIONES DE DESPACHO:
              </span>
              <p className="text-[8px] text-slate-800 leading-snug line-clamp-2">
                {order.observaciones
                  ? order.observaciones
                  : "Mercadería revisada en control de calidad de planta. Sin observaciones adicionales."}
              </p>
            </div>
            <p className="text-[6.8px] text-slate-500 leading-none pt-1 border-t border-slate-200 mt-1">
              NOTA: Todo reclamo sobre conteo o acabados debe notificarse dentro de las 24h posteriores a la recepción del lote.
            </p>
          </div>

          {/* 5. CASILLAS DE FIRMAS (ENTREGA Y RECEPCIÓN) */}
          <div className="col-span-5 grid grid-cols-2 gap-1.5">
            <div className="border border-slate-800 px-2 pt-5 pb-1 flex flex-col justify-end text-center bg-white">
              <div className="border-t border-slate-800 pt-0.5">
                <span className="text-[7.5px] font-bold uppercase text-slate-900 block leading-tight">
                  DESPACHADO POR (PLANTA)
                </span>
                <span className="text-[6.8px] text-slate-600 font-mono block leading-tight truncate">
                  {order.despachadoPor || "Jefe de Despacho / Control"}
                </span>
              </div>
            </div>
            <div className="border border-slate-800 px-2 pt-5 pb-1 flex flex-col justify-end text-center bg-white">
              <div className="border-t border-slate-800 pt-0.5">
                <span className="text-[7.5px] font-bold uppercase text-slate-900 block leading-tight">
                  RECIBIDO CONFORME (CLIENTE)
                </span>
                <span className="text-[6.8px] text-slate-600 font-mono block leading-tight truncate">
                  {order.cliente.nombre || "Firma / Nombre / C.I."}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ReceiptA4View({
  order,
  company,
  watermark,
}: ReceiptA4ViewProps) {
  return (
    <div
      id="a4-receipt-sheet"
      className="a4-sheet mx-auto bg-white shadow-xl print:shadow-none border border-slate-200 print:border-0 relative flex flex-col justify-between"
    >
      {/* MITAD SUPERIOR: ORIGINAL - CLIENTE (148.5mm) */}
      <ReceiptHalfSection
        order={order}
        company={company}
        copyType="ORIGINAL - CLIENTE"
        badgeStyle="border-slate-900 bg-slate-900 text-white"
        watermark={watermark}
      />

      {/* LÍNEA SIMÉTRICA DE CORTE A MITAD EXACTA DE HOJA A4 (148.5mm) */}
      <div className="relative w-full h-0 border-t border-dashed border-slate-400 flex items-center justify-between px-[8mm] z-10">
        <span className="bg-white px-1.5 text-[7px] font-mono uppercase tracking-widest text-slate-400 flex items-center gap-1 -translate-y-1/2">
          <Scissors className="w-2.5 h-2.5" /> Línea de corte simétrica A4 (148.5 mm)
        </span>
        <span className="bg-white px-1.5 text-[7px] font-mono uppercase tracking-widest text-slate-400 -translate-y-1/2">
          ORIGINAL ARRIBA / COPIA ARCHIVO ABAJO
        </span>
      </div>

      {/* MITAD INFERIOR: COPIA - ARCHIVO (148.5mm) */}
      <ReceiptHalfSection
        order={order}
        company={company}
        copyType="COPIA - ARCHIVO PLANTA"
        badgeStyle="border-slate-700 bg-white text-slate-900"
        watermark={watermark}
      />
    </div>
  );
}
