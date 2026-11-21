import { supabase } from "./supabase";
import {
  ArtisanFinishCatalogItem,
  Client,
  CompanyInfo,
  DispatcherCatalogItem,
  DispatchItem,
  DispatchOrder,
  GarmentTypeCatalogItem,
  IndustrialProcessCatalogItem,
} from "@/types/dispatch";
import { DEFAULT_COMPANY_INFO } from "@/data/catalogs";

// Helper to check valid UUID
export function isUUID(str?: string | null): boolean {
  if (!str) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    str
  );
}

// Helper to ensure a string is a valid UUID
export function ensureUUID(id?: string | null): string {
  if (isUUID(id)) return id!;
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// =========================================================================
// 1. CLIENTS (Cartera de Clientes)
// =========================================================================
export async function getClients(): Promise<Client[]> {
  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .order("nombre", { ascending: true });

  if (error) {
    console.error("Error al obtener clientes de Supabase:", error);
    throw error;
  }

  return (data || []).map((row) => ({
    id: row.id,
    nombre: row.nombre || "",
    rucCedula: row.ruc_cedula || "",
    telefono: row.telefono || "",
    direccion: row.direccion || "",
  }));
}

export async function createClient(
  client: Omit<Client, "id"> & { id?: string }
): Promise<Client> {
  const uuid = ensureUUID(client.id);
  const payload = {
    id: uuid,
    nombre: client.nombre.trim().toUpperCase(),
    ruc_cedula: client.rucCedula.trim(),
    telefono: client.telefono?.trim() || "S/N",
    direccion: client.direccion?.trim() || "Ciudad",
  };

  const { data, error } = await supabase
    .from("clients")
    .insert([payload])
    .select()
    .single();

  if (error) {
    console.error("Error al crear cliente en Supabase:", error);
    throw error;
  }

  return {
    id: data.id,
    nombre: data.nombre,
    rucCedula: data.ruc_cedula,
    telefono: data.telefono,
    direccion: data.direccion,
  };
}

export async function updateClient(
  id: string,
  client: Partial<Client>
): Promise<Client> {
  const payload: Record<string, any> = {};
  if (client.nombre !== undefined) payload.nombre = client.nombre.trim().toUpperCase();
  if (client.rucCedula !== undefined) payload.ruc_cedula = client.rucCedula.trim();
  if (client.telefono !== undefined) payload.telefono = client.telefono.trim();
  if (client.direccion !== undefined) payload.direccion = client.direccion.trim();

  const { data, error } = await supabase
    .from("clients")
    .update(payload)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error al actualizar cliente en Supabase:", error);
    throw error;
  }

  return {
    id: data.id,
    nombre: data.nombre,
    rucCedula: data.ruc_cedula,
    telefono: data.telefono,
    direccion: data.direccion,
  };
}

export async function deleteClient(id: string): Promise<void> {
  const { error } = await supabase.from("clients").delete().eq("id", id);
  if (error) {
    console.error("Error al eliminar cliente de Supabase:", error);
    throw error;
  }
}

// =========================================================================
// 2. DISPATCHERS (Encargados de Despacho)
// =========================================================================
export async function getDispatchers(): Promise<DispatcherCatalogItem[]> {
  const { data, error } = await supabase
    .from("dispatchers")
    .select("*")
    .order("nombre", { ascending: true });

  if (error) {
    console.error("Error al obtener encargados de Supabase:", error);
    throw error;
  }

  return (data || []).map((row) => ({
    id: row.id,
    nombre: row.nombre || "",
    cargo: row.cargo || "BODEGUERO",
    telefono: row.telefono || "",
  }));
}

export async function createDispatcher(
  item: Omit<DispatcherCatalogItem, "id"> & { id?: string }
): Promise<DispatcherCatalogItem> {
  const uuid = ensureUUID(item.id);
  const payload = {
    id: uuid,
    nombre: item.nombre.trim().toUpperCase(),
    cargo: item.cargo.trim().toUpperCase() || "BODEGUERO",
    telefono: item.telefono?.trim() || "S/N",
  };

  const { data, error } = await supabase
    .from("dispatchers")
    .insert([payload])
    .select()
    .single();

  if (error) {
    console.error("Error al crear encargado en Supabase:", error);
    throw error;
  }

  return {
    id: data.id,
    nombre: data.nombre,
    cargo: data.cargo,
    telefono: data.telefono,
  };
}

export async function updateDispatcher(
  id: string,
  item: Partial<DispatcherCatalogItem>
): Promise<DispatcherCatalogItem> {
  const payload: Record<string, any> = {};
  if (item.nombre !== undefined) payload.nombre = item.nombre.trim().toUpperCase();
  if (item.cargo !== undefined) payload.cargo = item.cargo.trim().toUpperCase();
  if (item.telefono !== undefined) payload.telefono = item.telefono.trim();

  const { data, error } = await supabase
    .from("dispatchers")
    .update(payload)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error al actualizar encargado en Supabase:", error);
    throw error;
  }

  return {
    id: data.id,
    nombre: data.nombre,
    cargo: data.cargo,
    telefono: data.telefono,
  };
}

export async function deleteDispatcher(id: string): Promise<void> {
  const { error } = await supabase.from("dispatchers").delete().eq("id", id);
  if (error) {
    console.error("Error al eliminar encargado de Supabase:", error);
    throw error;
  }
}

// =========================================================================
// 3. GARMENT TYPES (Tipos de Prenda)
// =========================================================================
export async function getGarmentTypes(): Promise<GarmentTypeCatalogItem[]> {
  const { data, error } = await supabase
    .from("garment_types")
    .select("*")
    .order("label", { ascending: true });

  if (error) {
    console.error("Error al obtener tipos de prenda de Supabase:", error);
    throw error;
  }

  return (data || []).map((row) => ({
    id: row.id,
    label: row.label || "",
    category: row.category || "DENIM CABALLERO",
    fabric: row.fabric || "",
    description: row.description || "",
  }));
}

export async function createGarmentType(
  item: Omit<GarmentTypeCatalogItem, "id"> & { id?: string }
): Promise<GarmentTypeCatalogItem> {
  const uuid = ensureUUID(item.id);
  const payload = {
    id: uuid,
    label: item.label.trim(),
    category: item.category.trim().toUpperCase() || "DENIM CABALLERO",
    fabric: item.fabric?.trim() || "Mezclilla Índigo 100% Algodón",
    description: item.description?.trim() || "",
  };

  const { data, error } = await supabase
    .from("garment_types")
    .insert([payload])
    .select()
    .single();

  if (error) {
    console.error("Error al crear tipo de prenda en Supabase:", error);
    throw error;
  }

  return {
    id: data.id,
    label: data.label,
    category: data.category,
    fabric: data.fabric,
    description: data.description,
  };
}

export async function updateGarmentType(
  id: string,
  item: Partial<GarmentTypeCatalogItem>
): Promise<GarmentTypeCatalogItem> {
  const payload: Record<string, any> = {};
  if (item.label !== undefined) payload.label = item.label.trim();
  if (item.category !== undefined) payload.category = item.category.trim().toUpperCase();
  if (item.fabric !== undefined) payload.fabric = item.fabric.trim();
  if (item.description !== undefined) payload.description = item.description.trim();

  const { data, error } = await supabase
    .from("garment_types")
    .update(payload)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error al actualizar tipo de prenda en Supabase:", error);
    throw error;
  }

  return {
    id: data.id,
    label: data.label,
    category: data.category,
    fabric: data.fabric,
    description: data.description,
  };
}

export async function deleteGarmentType(id: string): Promise<void> {
  const { error } = await supabase.from("garment_types").delete().eq("id", id);
  if (error) {
    console.error("Error al eliminar tipo de prenda de Supabase:", error);
    throw error;
  }
}

// =========================================================================
// 4. INDUSTRIAL PROCESSES (Procesos Industriales de Despacho)
// =========================================================================
export async function getProcesses(): Promise<IndustrialProcessCatalogItem[]> {
  const { data, error } = await supabase
    .from("industrial_processes")
    .select("*")
    .order("label", { ascending: true });

  if (error) {
    console.error("Error al obtener procesos industriales de Supabase:", error);
    throw error;
  }

  return (data || []).map((row) => ({
    id: row.id,
    label: row.label || "",
    category: row.category || "LAVADO",
    tipoPrenda: row.tipo_prenda || "Pantalón Jean Caballero",
    description: row.description || "",
  }));
}

export async function createProcess(
  item: Omit<IndustrialProcessCatalogItem, "id"> & { id?: string }
): Promise<IndustrialProcessCatalogItem> {
  const uuid = ensureUUID(item.id);
  const payload = {
    id: uuid,
    label: item.label.trim(),
    category: item.category.trim().toUpperCase() || "LAVADO",
    tipo_prenda: item.tipoPrenda?.trim() || "Pantalón Jean Caballero",
    description: item.description?.trim() || "",
  };

  const { data, error } = await supabase
    .from("industrial_processes")
    .insert([payload])
    .select()
    .single();

  if (error) {
    console.error("Error al crear proceso industrial en Supabase:", error);
    throw error;
  }

  return {
    id: data.id,
    label: data.label,
    category: data.category,
    tipoPrenda: data.tipo_prenda,
    description: data.description,
  };
}

export async function updateProcess(
  id: string,
  item: Partial<IndustrialProcessCatalogItem>
): Promise<IndustrialProcessCatalogItem> {
  const payload: Record<string, any> = {};
  if (item.label !== undefined) payload.label = item.label.trim();
  if (item.category !== undefined) payload.category = item.category.trim().toUpperCase();
  if (item.tipoPrenda !== undefined) payload.tipo_prenda = item.tipoPrenda.trim();
  if (item.description !== undefined) payload.description = item.description.trim();

  const { data, error } = await supabase
    .from("industrial_processes")
    .update(payload)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error al actualizar proceso en Supabase:", error);
    throw error;
  }

  return {
    id: data.id,
    label: data.label,
    category: data.category,
    tipoPrenda: data.tipo_prenda,
    description: data.description,
  };
}

export async function deleteProcess(id: string): Promise<void> {
  const { error } = await supabase.from("industrial_processes").delete().eq("id", id);
  if (error) {
    console.error("Error al eliminar proceso de Supabase:", error);
    throw error;
  }
}

// =========================================================================
// 5. ARTISAN FINISHES (Manualidades y Acabados Artesanales)
// =========================================================================
export async function getFinishes(): Promise<ArtisanFinishCatalogItem[]> {
  const { data, error } = await supabase
    .from("artisan_finishes")
    .select("*")
    .order("label", { ascending: true });

  if (error) {
    console.error("Error al obtener manualidades de Supabase:", error);
    throw error;
  }

  return (data || []).map((row) => ({
    id: row.id,
    label: row.label || "",
    category: row.category || "MANUALIDAD SECO",
    tipoPrenda: row.tipo_prenda || "Pantalón Jean Caballero",
    technique: row.technique || "",
  }));
}

export async function createFinish(
  item: Omit<ArtisanFinishCatalogItem, "id"> & { id?: string }
): Promise<ArtisanFinishCatalogItem> {
  const uuid = ensureUUID(item.id);
  const payload = {
    id: uuid,
    label: item.label.trim(),
    category: item.category.trim().toUpperCase() || "MANUALIDAD SECO",
    tipo_prenda: item.tipoPrenda?.trim() || "Pantalón Jean Caballero",
    technique: item.technique?.trim() || "",
  };

  const { data, error } = await supabase
    .from("artisan_finishes")
    .insert([payload])
    .select()
    .single();

  if (error) {
    console.error("Error al crear manualidad en Supabase:", error);
    throw error;
  }

  return {
    id: data.id,
    label: data.label,
    category: data.category,
    tipoPrenda: data.tipo_prenda,
    technique: data.technique,
  };
}

export async function updateFinish(
  id: string,
  item: Partial<ArtisanFinishCatalogItem>
): Promise<ArtisanFinishCatalogItem> {
  const payload: Record<string, any> = {};
  if (item.label !== undefined) payload.label = item.label.trim();
  if (item.category !== undefined) payload.category = item.category.trim().toUpperCase();
  if (item.tipoPrenda !== undefined) payload.tipo_prenda = item.tipoPrenda.trim();
  if (item.technique !== undefined) payload.technique = item.technique.trim();

  const { data, error } = await supabase
    .from("artisan_finishes")
    .update(payload)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error al actualizar manualidad en Supabase:", error);
    throw error;
  }

  return {
    id: data.id,
    label: data.label,
    category: data.category,
    tipoPrenda: data.tipo_prenda,
    technique: data.technique,
  };
}

export async function deleteFinish(id: string): Promise<void> {
  const { error } = await supabase.from("artisan_finishes").delete().eq("id", id);
  if (error) {
    console.error("Error al eliminar manualidad de Supabase:", error);
    throw error;
  }
}

// =========================================================================
// 6. COMPANY INFO (Datos de Planta y Empresa)
// =========================================================================
export async function getCompanyInfo(): Promise<CompanyInfo> {
  const { data, error } = await supabase
    .from("company_info")
    .select("*")
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("Error al obtener datos de empresa de Supabase:", error);
    throw error;
  }

  if (!data) {
    return DEFAULT_COMPANY_INFO;
  }

  return {
    nombre: data.nombre || DEFAULT_COMPANY_INFO.nombre,
    subtitulo: data.subtitulo || DEFAULT_COMPANY_INFO.subtitulo,
    ruc: data.ruc || DEFAULT_COMPANY_INFO.ruc,
    direccion: data.direccion || DEFAULT_COMPANY_INFO.direccion,
    telefono: data.telefono || DEFAULT_COMPANY_INFO.telefono,
    email: data.email || DEFAULT_COMPANY_INFO.email,
    planta: data.planta || DEFAULT_COMPANY_INFO.planta,
  };
}

export async function updateCompanyInfo(info: CompanyInfo): Promise<CompanyInfo> {
  // Check if a row exists
  const { data: existing } = await supabase
    .from("company_info")
    .select("id")
    .limit(1)
    .maybeSingle();

  const payload = {
    nombre: info.nombre,
    subtitulo: info.subtitulo,
    ruc: info.ruc,
    direccion: info.direccion,
    telefono: info.telefono,
    email: info.email,
    planta: info.planta,
  };

  if (existing?.id) {
    const { error } = await supabase
      .from("company_info")
      .update(payload)
      .eq("id", existing.id);
    if (error) throw error;
  } else {
    const { error } = await supabase.from("company_info").insert([payload]);
    if (error) throw error;
  }

  return info;
}

// =========================================================================
// 7. DISPATCH ORDERS & ITEMS (Órdenes y Lotes)
// =========================================================================
export async function getOrders(): Promise<DispatchOrder[]> {
  const { data, error } = await supabase
    .from("dispatch_orders")
    .select(
      `
      *,
      dispatch_items (*)
    `
    )
    .order("fecha", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error al obtener órdenes de Supabase:", error);
    throw error;
  }

  return (data || []).map((row) => {
    const rawItems: any[] = row.dispatch_items || [];
    const items: DispatchItem[] = rawItems.map((item) => ({
      id: item.id,
      tipoPrenda: item.tipo_prenda || "",
      cantidad: Number(item.cantidad) || 0,
      lote: item.lote || "",
      procesos: Array.isArray(item.procesos) ? item.procesos : [],
      manualidades: Array.isArray(item.manualidades) ? item.manualidades : [],
    }));

    const client: Client = {
      id: row.cliente_id || "",
      nombre: row.cliente_nombre || "",
      rucCedula: row.cliente_ruc || "",
      telefono: row.cliente_telefono || "",
      direccion: row.cliente_direccion || "",
    };

    return {
      id: row.id,
      numeroOrden: row.numero_orden,
      fecha: row.fecha,
      fechaEntrega: row.fecha_entrega,
      despachadoPor: row.despachado_por || "ENCARGADO",
      cliente: client,
      observaciones: row.observaciones || "",
      items: items,
      creadoEn: row.creado_en || row.created_at || new Date().toISOString(),
      pesoKg: row.peso_kg ?? undefined,
      ordenRecepcion: row.orden_recepcion || undefined,
      maquinaria: row.maquinaria || undefined,
      incluirCostos: Boolean(row.incluir_costos),
    };
  });
}

export async function saveOrder(order: DispatchOrder): Promise<DispatchOrder> {
  const orderUUID = ensureUUID(order.id);
  const clienteId = isUUID(order.cliente?.id) ? order.cliente.id : null;

  const orderPayload = {
    id: orderUUID,
    numero_orden: order.numeroOrden,
    fecha: order.fecha,
    fecha_entrega: order.fechaEntrega,
    despachado_por: order.despachadoPor || "ENCARGADO",
    cliente_id: clienteId,
    cliente_nombre: order.cliente?.nombre || "",
    cliente_ruc: order.cliente?.rucCedula || "",
    cliente_telefono: order.cliente?.telefono || "",
    cliente_direccion: order.cliente?.direccion || "",
    observaciones: order.observaciones || "",
    peso_kg: order.pesoKg !== undefined && order.pesoKg !== "" ? Number(order.pesoKg) : null,
    orden_recepcion: order.ordenRecepcion || null,
    maquinaria: order.maquinaria || null,
    incluir_costos: Boolean(order.incluirCostos),
    creado_en: order.creadoEn || new Date().toISOString(),
  };

  // Upsert order
  const { error: orderError } = await supabase
    .from("dispatch_orders")
    .upsert(orderPayload, { onConflict: "id" });

  if (orderError) {
    console.error("Error al guardar orden en Supabase:", orderError);
    throw orderError;
  }

  // Delete previous items and reinsert new items
  const { error: deleteError } = await supabase
    .from("dispatch_items")
    .delete()
    .eq("order_id", orderUUID);

  if (deleteError) {
    console.error("Error al sincronizar lotes de orden en Supabase:", deleteError);
    throw deleteError;
  }

  if (order.items && order.items.length > 0) {
    const itemsPayload = order.items.map((item) => ({
      id: ensureUUID(item.id),
      order_id: orderUUID,
      tipo_prenda: item.tipoPrenda || "Pantalón Jean Caballero",
      cantidad: Number(item.cantidad) || 0,
      lote: item.lote || "",
      procesos: Array.isArray(item.procesos) ? item.procesos : [],
      manualidades: Array.isArray(item.manualidades) ? item.manualidades : [],
    }));

    const { error: itemsError } = await supabase
      .from("dispatch_items")
      .insert(itemsPayload);

    if (itemsError) {
      console.error("Error al insertar lotes en Supabase:", itemsError);
      throw itemsError;
    }
  }

  return {
    ...order,
    id: orderUUID,
  };
}

export async function deleteOrder(orderId: string): Promise<void> {
  const { error } = await supabase
    .from("dispatch_orders")
    .delete()
    .eq("id", orderId);

  if (error) {
    console.error("Error al eliminar orden de Supabase:", error);
    throw error;
  }
}

// =========================================================================
// 8. AUTO-INITIALIZATION (Inicia completamente en blanco, sin datos precargados)
// =========================================================================
export async function seedInitialDataIfEmpty(): Promise<boolean> {
  // Base de datos empieza en blanco por requerimiento
  return false;
}
