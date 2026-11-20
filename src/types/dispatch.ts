export interface Client {
  id: string;
  nombre: string;
  rucCedula: string;
  telefono: string;
  direccion: string;
}

export interface GarmentTypeCatalogItem {
  id: string;
  label: string;
  category: string;
  fabric: string;
  description?: string;
}

export interface DispatcherCatalogItem {
  id: string;
  nombre: string;
  cargo: string;
  telefono?: string;
}

export interface IndustrialProcessCatalogItem {
  id: string;
  label: string;
  category: string;
  tipoPrenda: string;
  description?: string;
}

export interface ArtisanFinishCatalogItem {
  id: string;
  label: string;
  category: string;
  tipoPrenda: string;
  technique?: string;
}

export interface DispatchItem {
  id: string;
  tipoPrenda: string;
  cantidad: number;
  lote: string;
  procesos: string[];
  manualidades: string[];
}

export interface DispatchOrder {
  id: string;
  numeroOrden: string;
  fecha: string;
  fechaEntrega: string;
  despachadoPor?: string;
  cliente: Client;
  observaciones: string;
  items: DispatchItem[];
  creadoEn: string;
  pesoKg?: number | string;
  ordenRecepcion?: string;
  maquinaria?: string;
  incluirCostos?: boolean;
}

export interface CompanyInfo {
  nombre: string;
  subtitulo: string;
  ruc: string;
  direccion: string;
  telefono: string;
  email: string;
  planta: string;
}
