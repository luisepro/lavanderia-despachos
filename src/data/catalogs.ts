import {
  ArtisanFinishCatalogItem,
  Client,
  CompanyInfo,
  DispatcherCatalogItem,
  DispatchOrder,
  GarmentTypeCatalogItem,
  IndustrialProcessCatalogItem,
} from "@/types/dispatch";

export const INITIAL_DISPATCHERS: DispatcherCatalogItem[] = [];

export const DEFAULT_COMPANY_INFO: CompanyInfo = {
  nombre: "PROLAVTEX LAVANDERÍA INDUSTRIAL S.A.",
  subtitulo:
    "Diseño y Gestión de Procesos Maestros en Mezclilla, Tintorería y Acabados Textiles",
  ruc: "",
  direccion: "",
  telefono: "",
  email: "",
  planta: "PLANTA CENTRAL",
};

export const INITIAL_GARMENT_TYPES: GarmentTypeCatalogItem[] = [];

export const GARMENT_TYPES: string[] = [];

export const INDUSTRIAL_PROCESSES: IndustrialProcessCatalogItem[] = [];

export const ARTISAN_FINISHES: ArtisanFinishCatalogItem[] = [];

export const GARMENT_COLORS: string[] = [
  "Índigo Oscuro (Raw)",
  "Azul Medio (Mid Blue)",
  "Azul Celeste (Sky Bleach)",
  "Negro Sulfuro",
  "Gris Plomo / Charcoal",
  "Blanco Óptico / Crudo",
  "Azul Vintage (Dirty Tint)",
  "Verde Militar / Oliva",
];

export const INITIAL_CLIENTS: Client[] = [];

export const SAMPLE_DISPATCH_ORDER: DispatchOrder = {
  id: "ord-blank",
  numeroOrden: "ORD-00000000-01",
  fecha: new Date().toISOString().split("T")[0],
  fechaEntrega: new Date().toISOString().split("T")[0],
  despachadoPor: "ENCARGADO",
  cliente: {
    id: "cli-blank",
    nombre: "",
    rucCedula: "",
    telefono: "",
    direccion: "",
  },
  observaciones: "",
  creadoEn: new Date().toISOString(),
  items: [],
};

export const INITIAL_ORDERS_HISTORY: DispatchOrder[] = [];
