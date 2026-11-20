"use client";

import React, { useState, useEffect, useMemo } from "react";
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
import {
  ARTISAN_FINISHES,
  DEFAULT_COMPANY_INFO,
  GARMENT_COLORS,
  GARMENT_TYPES,
  INDUSTRIAL_PROCESSES,
  INITIAL_CLIENTS,
  INITIAL_DISPATCHERS,
  INITIAL_GARMENT_TYPES,
  INITIAL_ORDERS_HISTORY,
  SAMPLE_DISPATCH_ORDER,
} from "@/data/catalogs";
import ReceiptA4View from "@/components/ReceiptA4View";
import SearchableSelect, {
  CatalogSearchBox,
} from "@/components/SearchableSelect";
import * as db from "@/lib/supabaseService";
import * as XLSX from "xlsx";
import {
  Activity,
  AlertCircle,
  Award,
  BarChart3,
  Bell,
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Database,
  Eye,
  FileCheck2,
  FileDown,
  FileSpreadsheet,
  FileText,
  FileUp,
  FlaskConical,
  History,
  LayoutGrid,
  Layers,
  Loader2,
  Lock,
  LogOut,
  MapPin,
  Package,
  PackagePlus,
  Pencil,
  Phone,
  Plus,
  PlusCircle,
  Printer,
  RefreshCw,
  RotateCcw,
  Save,
  Search,
  Settings,
  ShieldCheck,
  Shirt,
  Sparkles,
  Trash2,
  TrendingUp,
  Trophy,
  UserCheck,
  UserPlus,
  Users,
  X,
} from "lucide-react";

type NavSection =
  | "dashboard"
  | "nuevo-despacho"
  | "procesos-despacho"
  | "manualidades"
  | "tipos-prenda"
  | "encargados"
  | "clientes"
  | "historial"
  | "configuracion";

function formatOrderNumberWithDate(dateStr: string, seqNum: number): string {
  const cleanDate = (dateStr || new Date().toISOString().split("T")[0]).replace(
    /-/g,
    ""
  );
  return `ORD-${cleanDate}-${String(seqNum).padStart(2, "0")}`;
}

function getInitialBlankOrder(seq = 1): DispatchOrder {
  const today = new Date().toISOString().split("T")[0];
  const deliveryDate = new Date(Date.now() + 3 * 86400000)
    .toISOString()
    .split("T")[0];
  return {
    id: db.ensureUUID(),
    numeroOrden: formatOrderNumberWithDate(today, seq),
    fecha: today,
    fechaEntrega: deliveryDate,
    despachadoPor: "ENCARGADO",
    cliente: {
      id: db.ensureUUID(),
      nombre: "",
      rucCedula: "",
      telefono: "",
      direccion: "",
    },
    observaciones: "",
    creadoEn: new Date().toISOString(),
    items: [
      {
        id: db.ensureUUID(),
        tipoPrenda: "Pantalón Jean Caballero",
        cantidad: 0,
        lote: "LT-01",
        procesos: ["Lavado Enzimático"],
        manualidades: [],
      },
    ],
  };
}

function extractSequenceFromOrderNumber(
  orderNum: string,
  fallbackSeq: number
): number {
  const parts = (orderNum || "").split("-");
  const lastPart = parts[parts.length - 1];
  const parsed = parseInt(lastPart, 10);
  return !isNaN(parsed) && parsed > 0 ? parsed : fallbackSeq;
}

export default function ProlavtexDispatchApp() {
  // Active Sidebar Module
  const [activeSection, setActiveSection] = useState<NavSection>("dashboard");
  const [showLiveSplitPreview, setShowLiveSplitPreview] =
    useState<boolean>(true);
  const [dispatchViewMode, setDispatchViewMode] = useState<"form" | "preview">("form");
  const [incluirCostos, setIncluirCostos] = useState<boolean>(false);
  const [watermarkDraft, setWatermarkDraft] = useState<boolean>(true);
  const [showSavedSuccessModal, setShowSavedSuccessModal] = useState<boolean>(false);

  // Company Configuration
  const [company, setCompany] = useState<CompanyInfo>(DEFAULT_COMPANY_INFO);

  // Dynamic Catalogs for Procesos para Despacho, Manualidades & Tipos de Prenda
  const [processCatalog, setProcessCatalog] =
    useState<IndustrialProcessCatalogItem[]>(INDUSTRIAL_PROCESSES);
  const [finishCatalog, setFinishCatalog] =
    useState<ArtisanFinishCatalogItem[]>(ARTISAN_FINISHES);
  const [garmentCatalog, setGarmentCatalog] =
    useState<GarmentTypeCatalogItem[]>(INITIAL_GARMENT_TYPES);
  const [dispatcherCatalog, setDispatcherCatalog] =
    useState<DispatcherCatalogItem[]>(INITIAL_DISPATCHERS);

  // Modal / Form states for adding/editing in Procesos Despacho, Manualidades, Tipos de Prenda, Encargados, and Clientes
  const [showNewDispatcherForm, setShowNewDispatcherForm] =
    useState<boolean>(false);
  const [editingDispatcherId, setEditingDispatcherId] = useState<string | null>(
    null
  );
  const [newDispatcherForm, setNewDispatcherForm] = useState({
    nombre: "",
    cargo: "BODEGUERO",
    telefono: "",
  });
  const [showNewProcessForm, setShowNewProcessForm] = useState<boolean>(false);
  const [editingProcessId, setEditingProcessId] = useState<string | null>(null);
  const [newProcessForm, setNewProcessForm] = useState({
    label: "",
    category: "LAVADO",
    tipoPrenda: "Pantalón Jean Caballero",
    description: "",
  });

  const [showNewFinishForm, setShowNewFinishForm] = useState<boolean>(false);
  const [editingFinishId, setEditingFinishId] = useState<string | null>(null);
  const [newFinishForm, setNewFinishForm] = useState({
    label: "",
    category: "MANUALIDAD SECO",
    tipoPrenda: "Pantalón Jean Caballero",
    technique: "",
  });

  const [showNewGarmentForm, setShowNewGarmentForm] = useState<boolean>(false);
  const [editingGarmentId, setEditingGarmentId] = useState<string | null>(null);
  const [newGarmentForm, setNewGarmentForm] = useState({
    label: "",
    category: "DENIM CABALLERO",
    fabric: "Mezclilla Índigo 100% Algodón",
    description: "",
  });

  // Clients State & Form
  const [clients, setClients] = useState<Client[]>(INITIAL_CLIENTS);
  const [clientSearch, setClientSearch] = useState<string>("");
  const [isCreatingClient, setIsCreatingClient] = useState<boolean>(false);
  const [showClientModalInDirectory, setShowClientModalInDirectory] =
    useState<boolean>(false);
  const [editingClientId, setEditingClientId] = useState<string | null>(null);
  const [newClientForm, setNewClientForm] = useState<Omit<Client, "id">>({
    nombre: "",
    rucCedula: "",
    telefono: "",
    direccion: "",
  });

  // Search & Date filters for Historial
  const [globalSearch, setGlobalSearch] = useState<string>("");
  const [historialStartDate, setHistorialStartDate] = useState<string>("");
  const [historialEndDate, setHistorialEndDate] = useState<string>("");

  // Dashboard Filters & Interactive Modal Windows ("Ventanas del Dashboard")
  const [dashboardClientFilter, setDashboardClientFilter] =
    useState<string>("TODOS");
  const [dashboardDispatcherFilter, setDashboardDispatcherFilter] =
    useState<string>("TODOS");
  const [dashboardPreviewOrder, setDashboardPreviewOrder] =
    useState<DispatchOrder | null>(null);
  const [dashboardSelectedClient, setDashboardSelectedClient] =
    useState<Client | null>(null);
  const [dashboardExpandedModal, setDashboardExpandedModal] = useState<
    | null
    | "procesos"
    | "manualidades"
    | "prendas"
    | "encargados"
    | "clientes"
  >(null);
  const [dashboardModalSearch, setDashboardModalSearch] = useState<string>("");

  // Consecutive counter & Saved Orders History (Inicia en 1 y vacío)
  const [orderCounter, setOrderCounter] = useState<number>(1);
  const [savedOrders, setSavedOrders] = useState<DispatchOrder[]>([]);

  // Active Dispatch Order Form State
  const [currentOrder, setCurrentOrder] = useState<DispatchOrder>(() =>
    getInitialBlankOrder(1)
  );

  // Custom Process / Finish quick input per item inside dispatch form
  const [customProcessInput, setCustomProcessInput] = useState<{
    [itemId: string]: string;
  }>({});
  const [customFinishInput, setCustomFinishInput] = useState<{
    [itemId: string]: string;
  }>({});

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3200);
  };

  // Supabase Sync & Loading States
  const [isLoadingData, setIsLoadingData] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [supabaseStatus, setSupabaseStatus] = useState<
    "connecting" | "connected" | "error"
  >("connecting");
  const [supabaseErrorDetails, setSupabaseErrorDetails] = useState<string | null>(null);

  // Load from Supabase on mount
  const loadSupabaseData = async (notify = false) => {
    setIsLoadingData(true);
    setSupabaseStatus("connecting");
    try {
      const [
        clientsRes,
        ordersRes,
        companyRes,
        procsRes,
        finishesRes,
        garmentsRes,
        dispatchersRes,
      ] = await Promise.all([
        db.getClients().catch((e) => {
          console.warn("Clients fetch warning:", e);
          return null;
        }),
        db.getOrders().catch((e) => {
          console.warn("Orders fetch warning:", e);
          return null;
        }),
        db.getCompanyInfo().catch((e) => {
          console.warn("Company fetch warning:", e);
          return null;
        }),
        db.getProcesses().catch((e) => {
          console.warn("Processes fetch warning:", e);
          return null;
        }),
        db.getFinishes().catch((e) => {
          console.warn("Finishes fetch warning:", e);
          return null;
        }),
        db.getGarmentTypes().catch((e) => {
          console.warn("Garments fetch warning:", e);
          return null;
        }),
        db.getDispatchers().catch((e) => {
          console.warn("Dispatchers fetch warning:", e);
          return null;
        }),
      ]);

      const anySuccess =
        clientsRes !== null ||
        ordersRes !== null ||
        companyRes !== null ||
        procsRes !== null;

      if (anySuccess) {
        setSupabaseStatus("connected");
        setSupabaseErrorDetails(null);

        if (clientsRes && clientsRes.length > 0) setClients(clientsRes);
        if (ordersRes !== null) {
          setSavedOrders(ordersRes);
          let maxSeq = 0;
          ordersRes.forEach((ord) => {
            const s = extractSequenceFromOrderNumber(ord.numeroOrden, 0);
            if (s > maxSeq) maxSeq = s;
          });
          const nextSeq = maxSeq + 1;
          setOrderCounter(nextSeq);
          setCurrentOrder((prev) => ({
            ...prev,
            numeroOrden: formatOrderNumberWithDate(prev.fecha, nextSeq),
            despachadoPor: prev.despachadoPor === "CARLOS URIÑA" ? "ENCARGADO" : (prev.despachadoPor || "ENCARGADO"),
          }));
        }
        if (companyRes) setCompany(companyRes);
        if (procsRes && procsRes.length > 0) setProcessCatalog(procsRes);
        if (finishesRes && finishesRes.length > 0) setFinishCatalog(finishesRes);
        if (garmentsRes && garmentsRes.length > 0) setGarmentCatalog(garmentsRes);
        if (dispatchersRes && dispatchersRes.length > 0)
          setDispatcherCatalog(dispatchersRes);

        // Auto-seed if tables exist but are empty (solo catálogos y clientes, sin órdenes falsas)
        if (!clientsRes || clientsRes.length === 0) {
          const seeded = await db.seedInitialDataIfEmpty();
          if (seeded) {
            triggerToast("Catálogos iniciales cargados en Supabase.");
            const newC = await db.getClients().catch(() => []);
            if (newC.length > 0) setClients(newC);
          }
        }

        if (notify) triggerToast("Datos actualizados desde Supabase.");
      } else {
        setSupabaseStatus("error");
        setSupabaseErrorDetails("Tablas no detectadas en Supabase.");
        if (notify) triggerToast("No se pudo conectar con las tablas de Supabase.");
      }
    } catch (err: any) {
      console.error("Error al cargar datos de Supabase:", err);
      setSupabaseStatus("error");
      setSupabaseErrorDetails(err?.message || "Error al conectar con Supabase");
      if (notify) triggerToast("Error de conexión con Supabase.");
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    loadSupabaseData();
  }, []);

  // Compatibility helpers
  const saveClientsToStorage = (updated: Client[]) => {
    setClients(updated);
  };

  const saveOrdersToStorage = (
    updated: DispatchOrder[],
    nextCounter?: number
  ) => {
    setSavedOrders(updated);
    if (nextCounter !== undefined) {
      setOrderCounter(nextCounter);
    }
  };

  const saveCompanyToStorage = (updated: CompanyInfo) => {
    setCompany(updated);
  };

  const saveProcessesToStorage = (updated: IndustrialProcessCatalogItem[]) => {
    setProcessCatalog(updated);
  };

  const saveFinishesToStorage = (updated: ArtisanFinishCatalogItem[]) => {
    setFinishCatalog(updated);
  };

  const saveGarmentsToStorage = (updated: GarmentTypeCatalogItem[]) => {
    setGarmentCatalog(updated);
  };

  const saveDispatchersToStorage = (updated: DispatcherCatalogItem[]) => {
    setDispatcherCatalog(updated);
  };

  // Excel / CSV Template Download Helper for "Plantilla" button
  const handleDownloadCSVTemplate = (
    type: "clientes" | "procesos" | "manualidades" | "prendas" | "encargados"
  ) => {
    let sheetName = "";
    let filename = "";
    let headers: string[] = [];
    let rows: (string | number)[][] = [];
    let colWidths: { wch: number }[] = [];

    if (type === "clientes") {
      sheetName = "Clientes";
      filename = "Plantilla_Clientes.xlsx";
      headers = ["Nombre", "Email", "Telefono", "Direccion", "Estado"];
      rows = [
        [
          "Cliente Ejemplo S.A.",
          "contacto@cliente.com",
          "+54 11 1234-5678",
          "Av. Siempre Viva 123",
          "Activo",
        ],
        [
          "Confecciones Denim Andino S.A.S.",
          "pedidos@denimandino.com",
          "+593 99 812 3456",
          "Av. Galo Plaza Lasso N52-18",
          "Activo",
        ],
        [
          "Textiles & Moda Kronos Cia. Ltda.",
          "ventas@kronos.com",
          "+593 98 765 4321",
          "Zona Industrial Pelileo Km 2",
          "Activo",
        ],
      ];
      colWidths = [
        { wch: 35 },
        { wch: 28 },
        { wch: 20 },
        { wch: 32 },
        { wch: 12 },
      ];
    } else if (type === "procesos") {
      sheetName = "Procesos";
      filename = "Plantilla_Procesos.xlsx";
      headers = ["Nombre", "Categoria", "Tipo_Prenda", "Descripcion", "Estado"];
      rows = [
        [
          "Lavado Enzimático",
          "LAVADO",
          "Pantalón Jean Caballero",
          "Bio-pulido y desgaste controlado en prenda de mezclilla",
          "Activo",
        ],
        [
          "Deslavado (Stone Wash)",
          "LAVADO PESADO",
          "Chaqueta Denim (Trucker)",
          "Abrasión física en tambor industrial para efecto vintage",
          "Activo",
        ],
        [
          "Neutralizado",
          "QUÍMICO",
          "Todas las Prendas Denim",
          "Eliminación de residuales oxidantes y estabilización de pH",
          "Activo",
        ],
        [
          "Suavizado Siliconado",
          "ACABADO",
          "Pantalón Jean Dama",
          "Aplicación de micro-emulsión para tacto extra suave",
          "Activo",
        ],
      ];
      colWidths = [
        { wch: 28 },
        { wch: 18 },
        { wch: 26 },
        { wch: 45 },
        { wch: 12 },
      ];
    } else if (type === "manualidades") {
      sheetName = "Manualidades";
      filename = "Plantilla_Manualidades.xlsx";
      headers = ["Nombre", "Categoria", "Tipo_Prenda", "Descripcion", "Estado"];
      rows = [
        [
          "Bigotes (Whiskers)",
          "MANUALIDAD SECO",
          "Pantalón Jean Caballero",
          "Marcado con molde polimérico y lija grano 220",
          "Activo",
        ],
        [
          "Lijado Localizado",
          "MANUALIDAD SECO",
          "Pantalón Jean Dama",
          "Desgaste manual en muslos con maniquí neumático",
          "Activo",
        ],
        [
          "Roturas / Grinding",
          "DESGASTE",
          "Short de Mezclilla",
          "Esmerilado artesanal en bordes de bolsillos y bota",
          "Activo",
        ],
        [
          "Focalizado (Spray PP)",
          "QUÍMICO LOCAL",
          "Pantalón Jean Caballero",
          "Nebulización localizada en cabina para reserva de luz",
          "Activo",
        ],
      ];
      colWidths = [
        { wch: 28 },
        { wch: 20 },
        { wch: 26 },
        { wch: 45 },
        { wch: 12 },
      ];
    } else if (type === "encargados") {
      sheetName = "Encargados";
      filename = "Plantilla_Encargados.xlsx";
      headers = ["Nombre", "Cargo", "Telefono", "Email", "Estado"];
      rows = [
        [
          "ENCARGADO PLANTA",
          "BODEGUERO",
          "+593 99 123 4501",
          "bodega@prolavtex.com",
          "Activo",
        ],
        [
          "SUPERVISOR DE TURNO",
          "FROSTEADOR",
          "+593 99 123 4502",
          "turno@prolavtex.com",
          "Activo",
        ],
        [
          "OPERADOR DE SECADO",
          "SECADOR",
          "+593 99 123 4504",
          "secado@prolavtex.com",
          "Activo",
        ],
      ];
      colWidths = [
        { wch: 28 },
        { wch: 20 },
        { wch: 20 },
        { wch: 26 },
        { wch: 12 },
      ];
    } else {
      sheetName = "Prendas";
      filename = "Plantilla_Tipos_Prenda.xlsx";
      headers = ["Nombre", "Categoria", "Tejido_Base", "Descripcion", "Estado"];
      rows = [
        [
          "Pantalón Jean Caballero",
          "DENIM PESADO",
          "Mezclilla Índigo 12oz - 14oz",
          "Corte clásico 5 bolsillos corte recto",
          "Activo",
        ],
        [
          "Pantalón Jean Dama",
          "DENIM STRETCH",
          "Mezclilla Stretch 9oz - 11oz",
          "Mezclilla con elastano corte skinny",
          "Activo",
        ],
        [
          "Chaqueta Denim (Trucker)",
          "DENIM SUPERIOR",
          "Mezclilla Rígida 13oz",
          "Casaca clásica estructurada con botones metálicos",
          "Activo",
        ],
        [
          "Short de Mezclilla",
          "DENIM VERANO",
          "Mezclilla Algodón 10oz",
          "Bermuda y short denim dama y caballero",
          "Activo",
        ],
      ];
      colWidths = [
        { wch: 28 },
        { wch: 18 },
        { wch: 28 },
        { wch: 42 },
        { wch: 12 },
      ];
    }

    const wb = XLSX.utils.book_new();
    const wsData = [headers, ...rows];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    ws["!cols"] = colWidths;
    XLSX.utils.book_append_sheet(wb, ws, sheetName);

    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([wbout], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    triggerToast(`Plantilla Excel "${filename}" descargada con formato de tabla.`);
  };

  // Excel / CSV Import Helper for "Cargar Excel" button
  const handleImportCSVFile = async (
    type: "clientes" | "procesos" | "manualidades" | "prendas" | "encargados",
    file?: File | null
  ) => {
    if (!file) return;
    try {
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer, { type: "array" });
      const firstSheetName = wb.SheetNames[0];
      if (!firstSheetName) {
        triggerToast("El archivo no contiene ninguna hoja de cálculo.");
        return;
      }
      const worksheet = wb.Sheets[firstSheetName];
      const rawRows: any[][] = XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
        defval: "",
      });

      const validRows = rawRows.filter(
        (r) => Array.isArray(r) && r.some((c) => String(c).trim().length > 0)
      );

      if (validRows.length < 2) {
        triggerToast("El archivo no contiene filas con datos.");
        return;
      }

      const headers = validRows[0].map((h: any) =>
        String(h || "").trim().toLowerCase()
      );
      const dataRows = validRows.slice(1);
      let importedCount = 0;
      setIsSaving(true);

      if (type === "clientes") {
        const nameIdx = headers.findIndex((h: string) => h.includes("nombre"));
        const telIdx = headers.findIndex((h: string) => h.includes("tel"));
        const dirIdx = headers.findIndex((h: string) => h.includes("dir"));
        const rucIdx = headers.findIndex(
          (h: string) => h.includes("ruc") || h.includes("cedula")
        );
        const emailIdx = headers.findIndex((h: string) => h.includes("email"));

        for (let idx = 0; idx < dataRows.length; idx++) {
          const cols = dataRows[idx].map((c: any) => String(c || "").trim());
          const nombre = nameIdx >= 0 ? cols[nameIdx] : cols[0];
          if (!nombre) continue;
          const rucCedula =
            rucIdx >= 0 && cols[rucIdx]
              ? cols[rucIdx]
              : `CLI-${Date.now().toString().slice(-6)}-${idx + 1}`;
          const telefono =
            telIdx >= 0 && cols[telIdx] ? cols[telIdx] : "S/N";
          const direccion =
            dirIdx >= 0 && cols[dirIdx]
              ? cols[dirIdx]
              : emailIdx >= 0 && cols[emailIdx]
              ? `Email: ${cols[emailIdx]}`
              : "Ciudad";

          const created = await db.createClient({
            nombre,
            rucCedula,
            telefono,
            direccion,
          });
          setClients((prev) => [created, ...prev]);
          importedCount++;
        }
      } else if (type === "procesos") {
        const nameIdx = headers.findIndex(
          (h: string) => h.includes("nombre") || h.includes("proceso")
        );
        const catIdx = headers.findIndex((h: string) => h.includes("cat"));
        const prendaIdx = headers.findIndex((h: string) => h.includes("prenda"));
        const descIdx = headers.findIndex((h: string) => h.includes("desc"));

        for (const row of dataRows) {
          const cols = row.map((c: any) => String(c || "").trim());
          const label = nameIdx >= 0 ? cols[nameIdx] : cols[0];
          if (!label) continue;
          const category =
            catIdx >= 0 && cols[catIdx] ? cols[catIdx] : "LAVADO";
          const tipoPrenda =
            prendaIdx >= 0 && cols[prendaIdx]
              ? cols[prendaIdx]
              : "Pantalón Jean Caballero";
          const description =
            descIdx >= 0 && cols[descIdx]
              ? cols[descIdx]
              : "Proceso industrial";

          const created = await db.createProcess({
            label,
            category,
            tipoPrenda,
            description,
          });
          setProcessCatalog((prev) => [created, ...prev]);
          importedCount++;
        }
      } else if (type === "manualidades") {
        const nameIdx = headers.findIndex(
          (h: string) => h.includes("nombre") || h.includes("manualidad")
        );
        const catIdx = headers.findIndex((h: string) => h.includes("cat"));
        const prendaIdx = headers.findIndex((h: string) => h.includes("prenda"));
        const descIdx = headers.findIndex(
          (h: string) => h.includes("desc") || h.includes("tec")
        );

        for (const row of dataRows) {
          const cols = row.map((c: any) => String(c || "").trim());
          const label = nameIdx >= 0 ? cols[nameIdx] : cols[0];
          if (!label) continue;
          const category =
            catIdx >= 0 && cols[catIdx] ? cols[catIdx] : "MANUALIDAD SECO";
          const tipoPrenda =
            prendaIdx >= 0 && cols[prendaIdx]
              ? cols[prendaIdx]
              : "Pantalón Jean Caballero";
          const technique =
            descIdx >= 0 && cols[descIdx] ? cols[descIdx] : "Acabado artesanal";

          const created = await db.createFinish({
            label,
            category,
            tipoPrenda,
            technique,
          });
          setFinishCatalog((prev) => [created, ...prev]);
          importedCount++;
        }
      } else if (type === "prendas") {
        const nameIdx = headers.findIndex(
          (h: string) => h.includes("nombre") || h.includes("prenda")
        );
        const catIdx = headers.findIndex((h: string) => h.includes("cat"));
        const fabricIdx = headers.findIndex(
          (h: string) => h.includes("tejido") || h.includes("fabric")
        );
        const descIdx = headers.findIndex((h: string) => h.includes("desc"));

        for (const row of dataRows) {
          const cols = row.map((c: any) => String(c || "").trim());
          const label = nameIdx >= 0 ? cols[nameIdx] : cols[0];
          if (!label) continue;
          const category =
            catIdx >= 0 && cols[catIdx] ? cols[catIdx] : "DENIM CABALLERO";
          const fabric =
            fabricIdx >= 0 && cols[fabricIdx]
              ? cols[fabricIdx]
              : "Mezclilla Índigo 100% Algodón";
          const description =
            descIdx >= 0 && cols[descIdx]
              ? cols[descIdx]
              : "Prenda registrada";

          const created = await db.createGarmentType({
            label,
            category,
            fabric,
            description,
          });
          setGarmentCatalog((prev) => [created, ...prev]);
          importedCount++;
        }
      } else if (type === "encargados") {
        const nameIdx = headers.findIndex((h: string) => h.includes("nombre"));
        const cargoIdx = headers.findIndex((h: string) => h.includes("cargo"));
        const telIdx = headers.findIndex((h: string) => h.includes("tel"));

        for (const row of dataRows) {
          const cols = row.map((c: any) => String(c || "").trim());
          const nombre = nameIdx >= 0 ? cols[nameIdx] : cols[0];
          if (!nombre) continue;
          const cargo =
            cargoIdx >= 0 && cols[cargoIdx] ? cols[cargoIdx] : "BODEGUERO";
          const telefono =
            telIdx >= 0 && cols[telIdx] ? cols[telIdx] : "S/N";

          const created = await db.createDispatcher({
            nombre,
            cargo,
            telefono,
          });
          setDispatcherCatalog((prev) => [created, ...prev]);
          importedCount++;
        }
      }

      triggerToast(
        `${importedCount} registros importados y sincronizados con Supabase.`
      );
    } catch (err: any) {
      console.error(err);
      triggerToast(
        "Error al importar archivo: " + (err.message || "Formato incorrecto")
      );
    } finally {
      setIsSaving(false);
    }
  };

  // =========================================================================
  // ANALYTICS ENGINE FOR DASHBOARD: TOP PROCESOS, TOP MANUALIDADES, TOP CLIENTES
  // =========================================================================
  const dashboardAnalytics = useMemo(() => {
    let totalGarmentsAllOrders = 0;
    let totalLotsAllOrders = 0;

    const processMap: Record<
      string,
      { label: string; prendas: number; lotes: number; category: string }
    > = {};
    const finishMap: Record<
      string,
      { label: string; prendas: number; lotes: number; tipoPrenda: string }
    > = {};
    const clientMap: Record<
      string,
      {
        id: string;
        nombre: string;
        rucCedula: string;
        telefono: string;
        direccion: string;
        prendas: number;
        ordenes: number;
        lotes: number;
        ultimaFecha: string;
      }
    > = {};

    const garmentMap: Record<
      string,
      { label: string; prendas: number; lotes: number }
    > = {};
    const dispatcherMap: Record<
      string,
      { nombre: string; cargo: string; prendas: number; ordenes: number }
    > = {};

    const q = activeSection === "dashboard" ? globalSearch.trim().toLowerCase() : "";

    const filteredOrders = savedOrders.filter((order) => {
      if (
        dashboardClientFilter !== "TODOS" &&
        order.cliente.nombre !== dashboardClientFilter &&
        order.cliente.rucCedula !== dashboardClientFilter
      ) {
        return false;
      }
      if (
        dashboardDispatcherFilter !== "TODOS" &&
        (order.despachadoPor || "ENCARGADO").toUpperCase() !==
          dashboardDispatcherFilter.toUpperCase()
      ) {
        return false;
      }
      if (q) {
        const matchesOrder =
          order.numeroOrden.toLowerCase().includes(q) ||
          order.cliente.nombre.toLowerCase().includes(q) ||
          order.cliente.rucCedula.toLowerCase().includes(q) ||
          (order.despachadoPor || "").toLowerCase().includes(q) ||
          order.items.some(
            (i) =>
              i.tipoPrenda.toLowerCase().includes(q) ||
              i.lote.toLowerCase().includes(q) ||
              i.procesos.some((p) => p.toLowerCase().includes(q)) ||
              i.manualidades.some((m) => m.toLowerCase().includes(q))
          );
        if (!matchesOrder) return false;
      }
      return true;
    });

    filteredOrders.forEach((order) => {
      const cliKey = order.cliente.rucCedula || order.cliente.nombre;
      if (!clientMap[cliKey]) {
        clientMap[cliKey] = {
          id: order.cliente.id,
          nombre: order.cliente.nombre,
          rucCedula: order.cliente.rucCedula,
          telefono: order.cliente.telefono,
          direccion: order.cliente.direccion,
          prendas: 0,
          ordenes: 0,
          lotes: 0,
          ultimaFecha: order.fecha,
        };
      }
      clientMap[cliKey].ordenes += 1;
      if (order.fecha > clientMap[cliKey].ultimaFecha) {
        clientMap[cliKey].ultimaFecha = order.fecha;
      }

      const dispName = (order.despachadoPor || "ENCARGADO").toUpperCase();
      if (!dispatcherMap[dispName]) {
        const foundDisp = dispatcherCatalog.find(
          (d) => d.nombre.toUpperCase() === dispName
        );
        dispatcherMap[dispName] = {
          nombre: dispName,
          cargo: foundDisp?.cargo || "BODEGUERO",
          prendas: 0,
          ordenes: 0,
        };
      }
      dispatcherMap[dispName].ordenes += 1;

      order.items.forEach((item) => {
        const qty = Number(item.cantidad) || 0;
        totalGarmentsAllOrders += qty;
        totalLotsAllOrders += 1;

        clientMap[cliKey].prendas += qty;
        clientMap[cliKey].lotes += 1;
        dispatcherMap[dispName].prendas += qty;

        const gName = (item.tipoPrenda || "Prenda Denim").toUpperCase();
        if (!garmentMap[gName]) {
          garmentMap[gName] = { label: gName, prendas: 0, lotes: 0 };
        }
        garmentMap[gName].prendas += qty;
        garmentMap[gName].lotes += 1;

        item.procesos.forEach((procName) => {
          if (!processMap[procName]) {
            const foundCat = processCatalog.find((p) => p.label === procName);
            processMap[procName] = {
              label: procName,
              prendas: 0,
              lotes: 0,
              category: foundCat?.category || "LAVADO",
            };
          }
          processMap[procName].prendas += qty;
          processMap[procName].lotes += 1;
        });

        item.manualidades.forEach((finName) => {
          if (!finishMap[finName]) {
            const foundFin = finishCatalog.find((f) => f.label === finName);
            finishMap[finName] = {
              label: finName,
              prendas: 0,
              lotes: 0,
              tipoPrenda:
                foundFin?.tipoPrenda || item.tipoPrenda || "Prenda Denim",
            };
          }
          finishMap[finName].prendas += qty;
          finishMap[finName].lotes += 1;
        });
      });
    });

    const topProcesses = Object.values(processMap).sort(
      (a, b) => b.prendas - a.prendas
    );
    const topFinishes = Object.values(finishMap).sort(
      (a, b) => b.prendas - a.prendas
    );
    const topClients = Object.values(clientMap).sort(
      (a, b) => b.prendas - a.prendas
    );
    const topGarments = Object.values(garmentMap).sort(
      (a, b) => b.prendas - a.prendas
    );
    const topDispatchers = Object.values(dispatcherMap).sort(
      (a, b) => b.prendas - a.prendas
    );

    const activeClientsRate =
      clients.length > 0
        ? Math.min(100, Math.round((topClients.length / clients.length) * 100))
        : 0;

    const avgGarmentsPerOrder =
      filteredOrders.length > 0
        ? Math.round(totalGarmentsAllOrders / filteredOrders.length)
        : 0;

    return {
      filteredOrders,
      totalGarmentsAllOrders,
      totalLotsAllOrders,
      avgGarmentsPerOrder,
      topProcesses,
      topFinishes,
      topClients,
      topGarments,
      topDispatchers,
      activeClientsRate,
    };
  }, [
    savedOrders,
    processCatalog,
    finishCatalog,
    dispatcherCatalog,
    clients.length,
    dashboardClientFilter,
    dashboardDispatcherFilter,
    globalSearch,
    activeSection,
  ]);

  // Create or Update Process in Catalog (Sin parámetros, con Tipo de Prenda)
  const handleSaveCatalogProcess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProcessForm.label.trim()) return;
    setIsSaving(true);

    try {
      if (editingProcessId) {
        const updated = await db.updateProcess(editingProcessId, {
          label: newProcessForm.label.trim(),
          category: newProcessForm.category.trim().toUpperCase() || "LAVADO",
          tipoPrenda:
            newProcessForm.tipoPrenda.trim() || "Pantalón Jean Caballero",
          description:
            newProcessForm.description.trim() || "Proceso industrial",
        });
        setProcessCatalog((prev) =>
          prev.map((p) => (p.id === editingProcessId ? updated : p))
        );
        triggerToast(`Proceso "${updated.label}" actualizado en Supabase.`);
      } else {
        const created = await db.createProcess({
          label: newProcessForm.label.trim(),
          category: newProcessForm.category.trim().toUpperCase() || "LAVADO",
          tipoPrenda:
            newProcessForm.tipoPrenda.trim() || "Pantalón Jean Caballero",
          description:
            newProcessForm.description.trim() ||
            "Proceso industrial configurado para planta Prolavtex",
        });
        setProcessCatalog((prev) => [created, ...prev]);
        triggerToast(`Proceso "${created.label}" añadido a Supabase.`);
      }

      setNewProcessForm({
        label: "",
        category: "LAVADO",
        tipoPrenda: "Pantalón Jean Caballero",
        description: "",
      });
      setEditingProcessId(null);
      setShowNewProcessForm(false);
    } catch (err: any) {
      console.error(err);
      triggerToast("Error al guardar proceso en Supabase: " + (err.message || "Error"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditCatalogProcess = (proc: IndustrialProcessCatalogItem) => {
    setEditingProcessId(proc.id);
    setNewProcessForm({
      label: proc.label,
      category: proc.category,
      tipoPrenda: proc.tipoPrenda || "Pantalón Jean Caballero",
      description: proc.description || "",
    });
    setShowNewProcessForm(true);
  };

  const handleDeleteCatalogProcess = async (id: string) => {
    setIsSaving(true);
    try {
      await db.deleteProcess(id);
      setProcessCatalog((prev) => prev.filter((p) => p.id !== id));
      triggerToast("Proceso eliminado de Supabase.");
    } catch (err: any) {
      console.error(err);
      triggerToast("Error al eliminar proceso en Supabase: " + (err.message || "Error"));
    } finally {
      setIsSaving(false);
    }
  };

  // Create or Update Manualidad in Catalog (Sin código, con Tipo de Prenda)
  const handleSaveCatalogFinish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFinishForm.label.trim()) return;
    setIsSaving(true);

    try {
      if (editingFinishId) {
        const updated = await db.updateFinish(editingFinishId, {
          label: newFinishForm.label.trim(),
          category:
            newFinishForm.category.trim().toUpperCase() ||
            "MANUALIDAD SECO",
          tipoPrenda:
            newFinishForm.tipoPrenda.trim() || "Pantalón Jean Caballero",
          technique:
            newFinishForm.technique.trim() ||
            "Acabado artesanal en mezclilla",
        });
        setFinishCatalog((prev) =>
          prev.map((f) => (f.id === editingFinishId ? updated : f))
        );
        triggerToast(`Manualidad "${updated.label}" actualizada en Supabase.`);
      } else {
        const created = await db.createFinish({
          label: newFinishForm.label.trim(),
          category:
            newFinishForm.category.trim().toUpperCase() || "MANUALIDAD SECO",
          tipoPrenda:
            newFinishForm.tipoPrenda.trim() || "Pantalón Jean Caballero",
          technique:
            newFinishForm.technique.trim() ||
            "Acabado artesanal manual en mezclilla",
        });
        setFinishCatalog((prev) => [created, ...prev]);
        triggerToast(`Manualidad "${created.label}" añadida a Supabase.`);
      }

      setNewFinishForm({
        label: "",
        category: "MANUALIDAD SECO",
        tipoPrenda: "Pantalón Jean Caballero",
        technique: "",
      });
      setEditingFinishId(null);
      setShowNewFinishForm(false);
    } catch (err: any) {
      console.error(err);
      triggerToast("Error al guardar manualidad en Supabase: " + (err.message || "Error"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditCatalogFinish = (fin: ArtisanFinishCatalogItem) => {
    setEditingFinishId(fin.id);
    setNewFinishForm({
      label: fin.label,
      category: fin.category,
      tipoPrenda: fin.tipoPrenda || "Pantalón Jean Caballero",
      technique: fin.technique || "",
    });
    setShowNewFinishForm(true);
  };

  const handleDeleteCatalogFinish = async (id: string) => {
    setIsSaving(true);
    try {
      await db.deleteFinish(id);
      setFinishCatalog((prev) => prev.filter((f) => f.id !== id));
      triggerToast("Manualidad eliminada de Supabase.");
    } catch (err: any) {
      console.error(err);
      triggerToast("Error al eliminar manualidad en Supabase: " + (err.message || "Error"));
    } finally {
      setIsSaving(false);
    }
  };

  // Create or Update Tipo de Prenda in Catalog
  const handleSaveCatalogGarment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGarmentForm.label.trim()) return;
    setIsSaving(true);

    try {
      if (editingGarmentId) {
        const updated = await db.updateGarmentType(editingGarmentId, {
          label: newGarmentForm.label.trim(),
          category:
            newGarmentForm.category.trim().toUpperCase() ||
            "DENIM CABALLERO",
          fabric:
            newGarmentForm.fabric.trim() || "Mezclilla Índigo 100% Algodón",
          description:
            newGarmentForm.description.trim() ||
            "Prenda textil registrada en planta",
        });
        setGarmentCatalog((prev) =>
          prev.map((g) => (g.id === editingGarmentId ? updated : g))
        );
        triggerToast(`Tipo de prenda "${updated.label}" actualizado en Supabase.`);
      } else {
        const created = await db.createGarmentType({
          label: newGarmentForm.label.trim(),
          category:
            newGarmentForm.category.trim().toUpperCase() || "DENIM CABALLERO",
          fabric: newGarmentForm.fabric.trim() || "Mezclilla Índigo 100% Algodón",
          description:
            newGarmentForm.description.trim() ||
            "Prenda textil configurada para despacho",
        });
        setGarmentCatalog((prev) => [created, ...prev]);
        triggerToast(`Tipo de prenda "${created.label}" añadido a Supabase.`);
      }

      setNewGarmentForm({
        label: "",
        category: "DENIM CABALLERO",
        fabric: "Mezclilla Índigo 100% Algodón",
        description: "",
      });
      setEditingGarmentId(null);
      setShowNewGarmentForm(false);
    } catch (err: any) {
      console.error(err);
      triggerToast("Error al guardar tipo de prenda en Supabase: " + (err.message || "Error"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditCatalogGarment = (gar: GarmentTypeCatalogItem) => {
    setEditingGarmentId(gar.id);
    setNewGarmentForm({
      label: gar.label,
      category: gar.category,
      fabric: gar.fabric,
      description: gar.description || "",
    });
    setShowNewGarmentForm(true);
  };

  const handleDeleteCatalogGarment = async (id: string) => {
    setIsSaving(true);
    try {
      await db.deleteGarmentType(id);
      setGarmentCatalog((prev) => prev.filter((g) => g.id !== id));
      triggerToast("Tipo de prenda eliminado de Supabase.");
    } catch (err: any) {
      console.error(err);
      triggerToast("Error al eliminar tipo de prenda en Supabase: " + (err.message || "Error"));
    } finally {
      setIsSaving(false);
    }
  };

  // Create or Update Encargado / Responsable de Despacho in Catalog
  const handleSaveCatalogDispatcher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDispatcherForm.nombre.trim()) return;
    setIsSaving(true);

    try {
      if (editingDispatcherId) {
        const updated = await db.updateDispatcher(editingDispatcherId, {
          nombre: newDispatcherForm.nombre.trim().toUpperCase(),
          cargo:
            newDispatcherForm.cargo.trim().toUpperCase() || "BODEGUERO",
          telefono: newDispatcherForm.telefono.trim() || "S/N",
        });
        setDispatcherCatalog((prev) =>
          prev.map((d) => (d.id === editingDispatcherId ? updated : d))
        );
        triggerToast(`Encargado "${updated.nombre}" actualizado en Supabase.`);
      } else {
        const created = await db.createDispatcher({
          nombre: newDispatcherForm.nombre.trim().toUpperCase(),
          cargo: newDispatcherForm.cargo.trim().toUpperCase() || "BODEGUERO",
          telefono: newDispatcherForm.telefono.trim() || "S/N",
        });
        setDispatcherCatalog((prev) => [created, ...prev]);
        triggerToast(`Encargado "${created.nombre}" añadido a Supabase.`);
      }

      setNewDispatcherForm({
        nombre: "",
        cargo: "BODEGUERO",
        telefono: "",
      });
      setEditingDispatcherId(null);
      setShowNewDispatcherForm(false);
    } catch (err: any) {
      console.error(err);
      triggerToast("Error al guardar encargado en Supabase: " + (err.message || "Error"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditCatalogDispatcher = (disp: DispatcherCatalogItem) => {
    setEditingDispatcherId(disp.id);
    setNewDispatcherForm({
      nombre: disp.nombre,
      cargo: disp.cargo,
      telefono: disp.telefono || "",
    });
    setShowNewDispatcherForm(true);
  };

  const handleDeleteCatalogDispatcher = async (id: string) => {
    setIsSaving(true);
    try {
      await db.deleteDispatcher(id);
      setDispatcherCatalog((prev) => prev.filter((d) => d.id !== id));
      triggerToast("Encargado eliminado de Supabase.");
    } catch (err: any) {
      console.error(err);
      triggerToast("Error al eliminar encargado en Supabase: " + (err.message || "Error"));
    } finally {
      setIsSaving(false);
    }
  };

  // Filtered clients for selector
  const filteredClients = useMemo(() => {
    const q = clientSearch.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter(
      (c) =>
        c.nombre.toLowerCase().includes(q) ||
        c.rucCedula.toLowerCase().includes(q) ||
        c.direccion.toLowerCase().includes(q)
    );
  }, [clients, clientSearch]);

  // Select an existing client
  const handleSelectClient = (client: Client) => {
    setCurrentOrder((prev) => ({
      ...prev,
      cliente: { ...client },
    }));
    setIsCreatingClient(false);
    triggerToast(`Cliente asignado: ${client.nombre}`);
  };

  // Create or Edit Client
  const handleCreateQuickClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientForm.nombre.trim() || !newClientForm.rucCedula.trim()) {
      triggerToast("Ingrese al menos Nombre y RUC/Cédula del cliente.");
      return;
    }
    setIsSaving(true);

    try {
      if (editingClientId) {
        const updated = await db.updateClient(editingClientId, {
          nombre: newClientForm.nombre.trim().toUpperCase(),
          rucCedula: newClientForm.rucCedula.trim(),
          telefono: newClientForm.telefono.trim() || "S/N",
          direccion: newClientForm.direccion.trim() || "Ciudad",
        });
        setClients((prev) =>
          prev.map((c) => (c.id === editingClientId ? updated : c))
        );
        triggerToast(`Cliente "${updated.nombre}" actualizado en Supabase.`);
      } else {
        const created = await db.createClient({
          nombre: newClientForm.nombre.trim().toUpperCase(),
          rucCedula: newClientForm.rucCedula.trim(),
          telefono: newClientForm.telefono.trim() || "S/N",
          direccion: newClientForm.direccion.trim() || "Ciudad",
        });
        setClients((prev) => [created, ...prev]);
        setCurrentOrder((prev) => ({
          ...prev,
          cliente: created,
        }));
        triggerToast(`Cliente "${created.nombre}" creado en Supabase.`);
      }

      setNewClientForm({ nombre: "", rucCedula: "", telefono: "", direccion: "" });
      setEditingClientId(null);
      setIsCreatingClient(false);
      setShowClientModalInDirectory(false);
    } catch (err: any) {
      console.error(err);
      triggerToast("Error al guardar cliente en Supabase: " + (err.message || "Error"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditDirectoryClient = (cli: Client) => {
    setEditingClientId(cli.id);
    setNewClientForm({
      nombre: cli.nombre,
      rucCedula: cli.rucCedula,
      telefono: cli.telefono,
      direccion: cli.direccion,
    });
    setShowClientModalInDirectory(true);
  };

  const handleDeleteDirectoryClient = async (id: string) => {
    setIsSaving(true);
    try {
      await db.deleteClient(id);
      setClients((prev) => prev.filter((c) => c.id !== id));
      triggerToast("Cliente eliminado de Supabase.");
    } catch (err: any) {
      console.error(err);
      triggerToast("Error al eliminar cliente en Supabase: " + (err.message || "Error"));
    } finally {
      setIsSaving(false);
    }
  };

  // Start a fresh new order with next consecutive number + emission date
  const handleNewBlankOrder = (preselectedClient?: Client) => {
    const today = new Date().toISOString().split("T")[0];
    const deliveryDate = new Date(Date.now() + 3 * 86400000)
      .toISOString()
      .split("T")[0];
    const formattedNum = formatOrderNumberWithDate(today, orderCounter);

    setCurrentOrder({
      id: db.ensureUUID(),
      numeroOrden: formattedNum,
      fecha: today,
      fechaEntrega: deliveryDate,
      despachadoPor: "ENCARGADO",
      cliente: preselectedClient ||
        clients[0] || {
          id: db.ensureUUID(),
          nombre: "",
          rucCedula: "",
          telefono: "",
          direccion: "",
        },
      observaciones: "",
      creadoEn: new Date().toISOString(),
      items: [
        {
          id: db.ensureUUID(),
          tipoPrenda: "Pantalón Jean Caballero",
          cantidad: 0,
          lote: `LT-${String(orderCounter).padStart(2, "0")}`,
          procesos: ["Lavado Enzimático"],
          manualidades: [],
        },
      ],
    });
    setActiveSection("nuevo-despacho");
    setDispatchViewMode("form");
    triggerToast(`Nueva orden generada: ${formattedNum}`);
  };

  // Garment Item Handlers
  const handleAddItem = () => {
    const nextIdx = currentOrder.items.length + 1;
    const newItem: DispatchItem = {
      id: db.ensureUUID(),
      tipoPrenda: "Pantalón Jean Caballero",
      cantidad: 120,
      lote: `LT-${880 + nextIdx}-${String.fromCharCode(64 + nextIdx)}`,
      procesos: ["Lavado Enzimático"],
      manualidades: [],
    };
    setCurrentOrder((prev) => ({
      ...prev,
      items: [...prev.items, newItem],
    }));
  };

  const handleDuplicateItem = (item: DispatchItem) => {
    const duplicated: DispatchItem = {
      ...item,
      id: db.ensureUUID(),
      lote: `${item.lote}-BIS`,
      procesos: [...item.procesos],
      manualidades: [...item.manualidades],
    };
    setCurrentOrder((prev) => ({
      ...prev,
      items: [...prev.items, duplicated],
    }));
    triggerToast(`Lote ${item.lote} duplicado.`);
  };

  const handleRemoveItem = (itemId: string) => {
    if (currentOrder.items.length <= 1) {
      triggerToast("El despacho debe tener al menos 1 lote registrado.");
      return;
    }
    setCurrentOrder((prev) => ({
      ...prev,
      items: prev.items.filter((i) => i.id !== itemId),
    }));
  };

  const handleUpdateItemField = <K extends keyof DispatchItem>(
    itemId: string,
    field: K,
    value: DispatchItem[K]
  ) => {
    setCurrentOrder((prev) => ({
      ...prev,
      items: prev.items.map((item) =>
        item.id === itemId ? { ...item, [field]: value } : item
      ),
    }));
  };

  const toggleItemProcess = (itemId: string, processLabel: string) => {
    setCurrentOrder((prev) => ({
      ...prev,
      items: prev.items.map((item) => {
        if (item.id !== itemId) return item;
        const exists = item.procesos.includes(processLabel);
        const updated = exists
          ? item.procesos.filter((p) => p !== processLabel)
          : [...item.procesos, processLabel];
        return { ...item, procesos: updated };
      }),
    }));
  };

  const toggleItemManualidad = (itemId: string, finishLabel: string) => {
    setCurrentOrder((prev) => ({
      ...prev,
      items: prev.items.map((item) => {
        if (item.id !== itemId) return item;
        const exists = item.manualidades.includes(finishLabel);
        const updated = exists
          ? item.manualidades.filter((m) => m !== finishLabel)
          : [...item.manualidades, finishLabel];
        return { ...item, manualidades: updated };
      }),
    }));
  };

  const handleAddCustomProcess = (itemId: string) => {
    const val = (customProcessInput[itemId] || "").trim();
    if (!val) return;
    setCurrentOrder((prev) => ({
      ...prev,
      items: prev.items.map((item) => {
        if (item.id !== itemId) return item;
        if (item.procesos.includes(val)) return item;
        return { ...item, procesos: [...item.procesos, val] };
      }),
    }));
    setCustomProcessInput((prev) => ({ ...prev, [itemId]: "" }));
  };

  const handleAddCustomFinish = (itemId: string) => {
    const val = (customFinishInput[itemId] || "").trim();
    if (!val) return;
    setCurrentOrder((prev) => ({
      ...prev,
      items: prev.items.map((item) => {
        if (item.id !== itemId) return item;
        if (item.manualidades.includes(val)) return item;
        return { ...item, manualidades: [...item.manualidades, val] };
      }),
    }));
    setCustomFinishInput((prev) => ({ ...prev, [itemId]: "" }));
  };

  // Save current order into Supabase & optionally print
  const handleSaveOrder = async (triggerPrint = false) => {
    const seq = extractSequenceFromOrderNumber(
      currentOrder.numeroOrden,
      orderCounter
    );
    const controlledOrderNum = formatOrderNumberWithDate(
      currentOrder.fecha,
      seq
    );
    const normalizedOrder: DispatchOrder = {
      ...currentOrder,
      id: db.ensureUUID(currentOrder.id),
      numeroOrden: controlledOrderNum,
      items: currentOrder.items.map((it) => ({
        ...it,
        id: db.ensureUUID(it.id),
      })),
    };
    setCurrentOrder(normalizedOrder);
    setIsSaving(true);

    try {
      const saved = await db.saveOrder(normalizedOrder);

      const existsIndex = savedOrders.findIndex(
        (o) => o.id === saved.id || o.numeroOrden === saved.numeroOrden
      );
      let updatedList: DispatchOrder[];
      let nextCounter = orderCounter;

      if (existsIndex >= 0) {
        updatedList = savedOrders.map((o, idx) =>
          idx === existsIndex ? saved : o
        );
      } else {
        updatedList = [saved, ...savedOrders];
        nextCounter = Math.max(orderCounter + 1, seq + 1);
      }

      setSavedOrders(updatedList);
      setOrderCounter(nextCounter);
      setShowSavedSuccessModal(true);
      triggerToast(
        `Orden ${controlledOrderNum} sincronizada con Supabase exitosamente.`
      );

      if (triggerPrint) {
        setTimeout(() => {
          window.print();
        }, 150);
      }
    } catch (err: any) {
      console.error(err);
      triggerToast("Error al guardar orden en Supabase: " + (err.message || "Error"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    setIsSaving(true);
    try {
      if (db.isUUID(orderId)) {
        await db.deleteOrder(orderId);
      }
      setSavedOrders((prev) => prev.filter((o) => o.id !== orderId));
      triggerToast("Orden eliminada del historial.");
    } catch (err: any) {
      console.error(err);
      triggerToast("Error al eliminar orden: " + (err.message || "Error"));
    } finally {
      setIsSaving(false);
    }
  };

  const [isGeneratingPDF, setIsGeneratingPDF] = useState<boolean>(false);
  const [pdfTargetOrder, setPdfTargetOrder] = useState<DispatchOrder | null>(null);

  const handleDownloadPDF = async (orderToDownload?: DispatchOrder) => {
    const target = orderToDownload || dashboardPreviewOrder || currentOrder;
    setPdfTargetOrder(target);
    setIsGeneratingPDF(true);

    try {
      const html2canvas = (await import("html2canvas")).default;
      const { jsPDF } = await import("jspdf");

      // Breve espera para que React monte y aplique el target en el contenedor off-screen
      await new Promise((resolve) => setTimeout(resolve, 100));

      const container = document.getElementById("pdf-export-container");
      if (!container) {
        triggerToast("Error: No se encontró el contenedor de exportación.");
        return;
      }

      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
        windowWidth: 794,
      });

      const imgData = canvas.toDataURL("image/jpeg", 0.95);
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      pdf.addImage(imgData, "JPEG", 0, 0, 210, 297);
      const fileName = `Guia-Despacho-${target.numeroOrden || "OP-1001"}.pdf`;
      pdf.save(fileName);
      triggerToast(`Archivo PDF descargado: ${fileName}`);
    } catch (error) {
      console.error("Error al exportar PDF:", error);
      triggerToast("Error al exportar documento a PDF");
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handlePrintNow = () => {
    handleSaveOrder(true);
  };

  // Totals for active order
  const totalUnidades = useMemo(
    () =>
      currentOrder.items.reduce(
        (sum, item) => sum + (Number(item.cantidad) || 0),
        0
      ),
    [currentOrder.items]
  );

  const totalProcesosAplicados = useMemo(
    () =>
      currentOrder.items.reduce(
        (sum, item) => sum + item.procesos.length + item.manualidades.length,
        0
      ),
    [currentOrder.items]
  );

  // Filtered orders for Historial with Search & Date Range (Calendario)
  const filteredHistorialOrders = useMemo(() => {
    return savedOrders.filter((ord) => {
      const q = globalSearch.trim().toLowerCase();
      const matchesText =
        !q ||
        ord.numeroOrden.toLowerCase().includes(q) ||
        ord.cliente.nombre.toLowerCase().includes(q) ||
        (ord.cliente.rucCedula &&
          ord.cliente.rucCedula.toLowerCase().includes(q)) ||
        (ord.despachadoPor && ord.despachadoPor.toLowerCase().includes(q)) ||
        ord.items.some(
          (it) =>
            it.lote.toLowerCase().includes(q) ||
            it.tipoPrenda.toLowerCase().includes(q) ||
            it.procesos.some((p) => p.toLowerCase().includes(q))
        );

      const orderDate = ord.fecha; // "YYYY-MM-DD"
      let matchesDate = true;
      if (historialStartDate && orderDate < historialStartDate) {
        matchesDate = false;
      }
      if (historialEndDate && orderDate > historialEndDate) {
        matchesDate = false;
      }

      return matchesText && matchesDate;
    });
  }, [savedOrders, globalSearch, historialStartDate, historialEndDate]);

  const handleExportOrdersToExcel = (ordersToExport: DispatchOrder[]) => {
    if (!ordersToExport || ordersToExport.length === 0) {
      triggerToast("No hay órdenes en el rango o filtro seleccionado.");
      return;
    }

    const headers = [
      "N_ORDEN",
      "FECHA_EMISION",
      "FECHA_ENTREGA",
      "CLIENTE",
      "RUC_CEDULA",
      "TELEFONO",
      "DIRECCION",
      "DESPACHADO_POR",
      "TOTAL_LOTES",
      "TOTAL_PRENDAS",
      "DETALLE_LOTES_Y_PROCESOS",
      "OBSERVACIONES",
    ];

    const escapeCSV = (val: string | number | undefined) => {
      const str = String(val ?? "").replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = ordersToExport.map((ord) => {
      const totalQty = ord.items.reduce(
        (acc, item) => acc + (Number(item.cantidad) || 0),
        0
      );
      const itemsDetail = ord.items
        .map(
          (item, idx) =>
            `[Lote ${item.lote || idx + 1}: ${item.tipoPrenda} - ${item.cantidad} uds - Proc: ${
              item.procesos.join("+") || "Ninguno"
            } - Man: ${item.manualidades.join("+") || "Ninguna"}]`
        )
        .join(" | ");

      return [
        escapeCSV(ord.numeroOrden),
        escapeCSV(ord.fecha),
        escapeCSV(ord.fechaEntrega),
        escapeCSV(ord.cliente.nombre),
        escapeCSV(ord.cliente.rucCedula),
        escapeCSV(ord.cliente.telefono),
        escapeCSV(ord.cliente.direccion),
        escapeCSV(ord.despachadoPor || "ENCARGADO"),
        ord.items.length,
        totalQty,
        escapeCSV(itemsDetail),
        escapeCSV(ord.observaciones || ""),
      ].join(";");
    });

    const csvContent = "\uFEFF" + [headers.join(";"), ...rows].join("\r\n");
    const blob = new Blob([csvContent], {
      type: "application/vnd.ms-excel;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const dateRangeSuffix =
      historialStartDate && historialEndDate
        ? `_${historialStartDate}_al_${historialEndDate}`
        : "";
    const filename = `Reporte_Despachos_Prolavtex${dateRangeSuffix}.csv`;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    triggerToast(
      `Reporte Excel exportado (${ordersToExport.length} órdenes incluidas).`
    );
  };

  // LEFT SIDEBAR NAVIGATION ITEMS ("Recibo A4" removed as requested!)
  const navItems: {
    id: NavSection;
    label: string;
    topTitle: string;
    icon: React.ComponentType<{ className?: string }>;
  }[] = [
    {
      id: "dashboard",
      label: "Dashboard",
      topTitle: "Dashboard",
      icon: LayoutGrid,
    },
    {
      id: "nuevo-despacho",
      label: "Nuevo Despacho",
      topTitle: "Dispatch",
      icon: FileCheck2,
    },
    {
      id: "procesos-despacho",
      label: "Procesos Despacho",
      topTitle: "Processes",
      icon: FlaskConical,
    },
    {
      id: "manualidades",
      label: "Manualidades",
      topTitle: "Finishes",
      icon: Sparkles,
    },
    {
      id: "tipos-prenda",
      label: "Tipos de Prenda",
      topTitle: "Garments",
      icon: Shirt,
    },
    {
      id: "encargados",
      label: "Encargados",
      topTitle: "Dispatchers",
      icon: UserCheck,
    },
    {
      id: "clientes",
      label: "Clientes",
      topTitle: "Clients",
      icon: Users,
    },
    {
      id: "historial",
      label: "Historial",
      topTitle: "History",
      icon: History,
    },
    {
      id: "configuracion",
      label: "Configuración",
      topTitle: "Settings",
      icon: Settings,
    },
  ];

  const currentNavMeta =
    navItems.find((n) => n.id === activeSection) || navItems[0];

  const hasActiveDashboardFilters =
    dashboardClientFilter !== "TODOS" ||
    dashboardDispatcherFilter !== "TODOS" ||
    (activeSection === "dashboard" && globalSearch.trim().length > 0);

  const handleSaveCompany = async () => {
    setIsSaving(true);
    try {
      await db.updateCompanyInfo(company);
      triggerToast("Configuración corporativa guardada en Supabase.");
    } catch (err: any) {
      console.error(err);
      triggerToast(
        "Error al guardar empresa en Supabase: " + (err.message || "Error")
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#F8FAFC] text-slate-800">
      {/* =====================================================================
          1. INTERFAZ ESTILO PROLAVTEX (OCULTA AL IMPRIMIR CON print:hidden)
         ===================================================================== */}
      <div className="print:hidden flex w-full min-h-screen">
        {/* LEFT FIXED SIDEBAR (PROLAVTEX DESIGN) */}
        <aside className="w-[260px] bg-white border-r border-slate-100 flex flex-col justify-between shrink-0 sticky top-0 h-screen select-none">
          <div className="flex flex-col">
            {/* Brand Logo Header */}
            <div className="px-6 pt-6 pb-4 flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-blue-600 shadow-md shadow-blue-600/25 flex items-center justify-center text-white shrink-0">
                <FlaskConical className="w-6 h-6 stroke-[2.2]" />
              </div>
              <span className="text-[21px] font-extrabold tracking-tight text-slate-900">
                Prolavtex
              </span>
            </div>

            {/* Sidebar Navigation List */}
            <nav className="px-4 py-2 space-y-1.5">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setGlobalSearch("");
                      setActiveSection(item.id);
                    }}
                    className={`w-full px-4 py-3 rounded-2xl text-[14.5px] flex items-center justify-between transition-all cursor-pointer ${
                      isActive
                        ? "bg-blue-50/80 text-blue-600 font-semibold"
                        : "text-slate-600 font-medium hover:bg-slate-50/80 hover:text-slate-900"
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <Icon
                        className={`w-5 h-5 shrink-0 ${
                          isActive
                            ? "text-blue-600 stroke-[2.2]"
                            : "text-slate-500 stroke-[1.8]"
                        }`}
                      />
                      <span>{item.label}</span>
                    </div>
                    {isActive && (
                      <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Bottom Sidebar Footer */}
          <div className="p-4 border-t border-slate-100/80">
            <button
              type="button"
              onClick={() =>
                triggerToast("Sesión activa en Planta Central Prolavtex")
              }
              className="w-full px-4 py-3 rounded-2xl text-[14.5px] font-medium text-slate-600 hover:bg-slate-50/80 hover:text-slate-900 flex items-center gap-3.5 transition-colors cursor-pointer"
            >
              <LogOut className="w-5 h-5 text-slate-500 stroke-[1.8] shrink-0" />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </aside>

        {/* RIGHT MAIN WORKSPACE */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* TOP HEADER BAR (IDENTICAL TO UPLOADED SCREENSHOT) */}
          <header className="h-20 bg-white border-b border-slate-100 px-8 flex items-center justify-between sticky top-0 z-20">
            <h2 className="text-[17px] font-extrabold text-slate-800 tracking-tight">
              {currentNavMeta.topTitle}
            </h2>

            <div className="flex items-center gap-4">
              {/* Supabase Connection Status Pill */}
              <div
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium border transition-all ${
                  isLoadingData
                    ? "bg-blue-50 border-blue-200 text-blue-700"
                    : supabaseStatus === "connected"
                    ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                    : "bg-amber-50 border-amber-200 text-amber-800"
                }`}
              >
                {isLoadingData ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                    <span>Sincronizando...</span>
                  </>
                ) : supabaseStatus === "connected" ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="font-bold">Supabase Conectado</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>Supabase: Ejecutar SQL</span>
                  </>
                )}
                <button
                  type="button"
                  onClick={() => loadSupabaseData(true)}
                  title="Recargar datos desde Supabase"
                  className="p-1 hover:bg-black/5 rounded-full text-slate-500 hover:text-slate-800 transition-colors ml-0.5 cursor-pointer"
                >
                  <RefreshCw
                    className={`w-3 h-3 ${isLoadingData ? "animate-spin" : ""}`}
                  />
                </button>
              </div>

              {/* Top Search Pill */}
              <div className="relative hidden sm:block w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar orden o cliente..."
                  value={globalSearch}
                  onChange={(e) => setGlobalSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#F8FAFC] border border-slate-100 text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                />
              </div>

              {/* Notification Bell */}
              <button
                type="button"
                onClick={() =>
                  triggerToast(
                    `Orden activa ${currentOrder.numeroOrden} lista para imprimir.`
                  )
                }
                className="w-9 h-9 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
              >
                <Bell className="w-[18px] h-[18px]" />
              </button>

              {/* Avatar Circle */}
              <div className="w-9 h-9 rounded-full bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center select-none">
                A
              </div>
            </div>
          </header>

          {/* TOAST MESSAGE */}
          {toastMessage && (
            <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-xl border border-slate-700">
              <FileCheck2 className="w-4 h-4 text-blue-400 shrink-0" />
              <span className="text-xs font-semibold">{toastMessage}</span>
            </div>
          )}

          {/* =================================================================
              MODULE 1: DASHBOARD EJECUTIVO PROLAVTEX (REORGANIZADO EN 4 NIVELES Y CON VENTANAS INTERACTIVAS)
             ================================================================= */}
          {activeSection === "dashboard" && (
            <main className="p-6 lg:p-8 max-w-[1560px] w-full mx-auto space-y-6">
              {/* NIVEL 0: CABECERA EJECUTIVA + BARRA DE ACCIONES RÁPIDAS Y FILTROS DE VENTANAS */}
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2.5">
                      <span className="px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-600 font-extrabold text-[10px] uppercase tracking-wider">
                        CENTRO DE CONTROL DE PLANTA
                      </span>
                      <span className="text-xs text-slate-400 font-semibold">
                        &bull; {company.planta}
                      </span>
                    </div>
                    <h1 className="text-2xl sm:text-[26px] font-extrabold text-slate-900 tracking-tight mt-1">
                      Panel Principal de Operaciones y Despachos
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
                      Organización integral de órdenes, procesos industriales,
                      manualidades, clientes y responsables con ventanas de
                      inspección rápida
                    </p>
                  </div>

                  {/* Botonera Principal de Creación Rápida desde el Dashboard */}
                  <div className="flex flex-wrap items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingClientId(null);
                        setNewClientForm({
                          nombre: "",
                          rucCedula: "",
                          telefono: "",
                          direccion: "",
                        });
                        setShowClientModalInDirectory(true);
                      }}
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-600 border border-slate-200/80 text-xs font-bold transition-all cursor-pointer"
                    >
                      <UserPlus className="w-3.5 h-3.5 text-blue-600" />
                      <span>+ Cliente</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setEditingProcessId(null);
                        setNewProcessForm({
                          label: "",
                          category: "LAVADO",
                          tipoPrenda:
                            garmentCatalog[0]?.label ||
                            "Pantalón Jean Caballero",
                          description: "",
                        });
                        setShowNewProcessForm(true);
                      }}
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-slate-50 hover:bg-indigo-50 text-slate-700 hover:text-indigo-600 border border-slate-200/80 text-xs font-bold transition-all cursor-pointer"
                    >
                      <FlaskConical className="w-3.5 h-3.5 text-indigo-600" />
                      <span>+ Proceso</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setEditingFinishId(null);
                        setNewFinishForm({
                          label: "",
                          category: "MANUALIDAD SECO",
                          tipoPrenda:
                            garmentCatalog[0]?.label ||
                            "Pantalón Jean Caballero",
                          technique: "",
                        });
                        setShowNewFinishForm(true);
                      }}
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-slate-50 hover:bg-purple-50 text-slate-700 hover:text-purple-600 border border-slate-200/80 text-xs font-bold transition-all cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                      <span>+ Manualidad</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleNewBlankOrder()}
                      className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/25 text-xs sm:text-[13px] font-bold transition-all cursor-pointer"
                    >
                      <Plus className="w-4 h-4 stroke-[2.5]" />
                      <span>Nuevo Despacho</span>
                    </button>
                  </div>
                </div>

                {/* Barra de Filtros Interactivos del Dashboard */}
                <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-3 flex-1">
                    <div className="flex items-center gap-2 bg-[#F8FAFC] border border-slate-200/80 rounded-2xl px-3.5 py-2 min-w-[230px]">
                      <Users className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                        Cliente:
                      </span>
                      <select
                        value={dashboardClientFilter}
                        onChange={(e) =>
                          setDashboardClientFilter(e.target.value)
                        }
                        className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none flex-1 cursor-pointer truncate"
                      >
                        <option value="TODOS">TODOS LOS CLIENTES</option>
                        {clients.map((c) => (
                          <option key={c.id} value={c.nombre}>
                            {c.nombre}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center gap-2 bg-[#F8FAFC] border border-slate-200/80 rounded-2xl px-3.5 py-2 min-w-[210px]">
                      <UserCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                        Encargado:
                      </span>
                      <select
                        value={dashboardDispatcherFilter}
                        onChange={(e) =>
                          setDashboardDispatcherFilter(e.target.value)
                        }
                        className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none flex-1 cursor-pointer"
                      >
                        <option value="TODOS">TODOS LOS ENCARGADOS</option>
                        {dispatcherCatalog.map((d) => (
                          <option key={d.id} value={d.nombre}>
                            {d.nombre} ({d.cargo})
                          </option>
                        ))}
                      </select>
                    </div>

                    {hasActiveDashboardFilters && (
                      <button
                        type="button"
                        onClick={() => {
                          setDashboardClientFilter("TODOS");
                          setDashboardDispatcherFilter("TODOS");
                          setGlobalSearch("");
                        }}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-extrabold transition-colors cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Limpiar Filtros</span>
                      </button>
                    )}
                  </div>

                  {/* Accesos Rápidos a Ventanas Emergentes del Dashboard */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mr-1 hidden xl:inline">
                      Ventanas de Análisis:
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setDashboardModalSearch("");
                        setDashboardExpandedModal("procesos");
                      }}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-600 text-[11px] font-bold transition-colors cursor-pointer"
                    >
                      Procesos ({dashboardAnalytics.topProcesses.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDashboardModalSearch("");
                        setDashboardExpandedModal("clientes");
                      }}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-amber-50 text-slate-600 hover:text-amber-700 text-[11px] font-bold transition-colors cursor-pointer"
                    >
                      Ranking Clientes ({dashboardAnalytics.topClients.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDashboardModalSearch("");
                        setDashboardExpandedModal("encargados");
                      }}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 text-[11px] font-bold transition-colors cursor-pointer"
                    >
                      Personal ({dashboardAnalytics.topDispatchers.length})
                    </button>
                  </div>
                </div>
              </div>

              {/* NIVEL 1: 4 VENTANAS KPI EJECUTIVAS INTERACTIVAS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
                {/* KPI 1: Prendas Despachadas */}
                <div
                  onClick={() => {
                    setDashboardModalSearch("");
                    setDashboardExpandedModal("prendas");
                  }}
                  className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm hover:border-blue-200 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between gap-4 group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors flex items-center justify-center shrink-0">
                      <Package className="w-5 h-5" />
                    </div>
                    <span className="px-2.5 py-1 rounded-lg bg-[#ECFDF5] text-[#10B981] font-extrabold text-[10px] uppercase tracking-wider shrink-0">
                      {dashboardAnalytics.totalLotsAllOrders} LOTES
                    </span>
                  </div>
                  <div>
                    <div className="text-2xl font-extrabold text-slate-900 leading-none">
                      {dashboardAnalytics.totalGarmentsAllOrders.toLocaleString(
                        "es-EC"
                      )}{" "}
                      <span className="text-xs font-bold text-slate-400">
                        UDS
                      </span>
                    </div>
                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mt-1.5">
                      PRENDAS DESPACHADAS
                    </div>
                  </div>
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold text-slate-500">
                    <span>
                      Promedio:{" "}
                      <strong className="text-slate-700">
                        {dashboardAnalytics.avgGarmentsPerOrder.toLocaleString(
                          "es-EC"
                        )}{" "}
                        uds/orden
                      </strong>
                    </span>
                    <span className="text-blue-600 group-hover:translate-x-0.5 transition-transform">
                      Ver Prendas &rarr;
                    </span>
                  </div>
                </div>

                {/* KPI 2: Proceso Industrial Líder */}
                <div
                  onClick={() => {
                    setDashboardModalSearch("");
                    setDashboardExpandedModal("procesos");
                  }}
                  className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm hover:border-indigo-200 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between gap-4 group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors flex items-center justify-center shrink-0">
                      <FlaskConical className="w-5 h-5" />
                    </div>
                    <span className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-600 font-extrabold text-[10px] uppercase tracking-wider shrink-0">
                      PROCESO TOP #1
                    </span>
                  </div>
                  <div className="min-w-0">
                    <div className="text-[15px] font-extrabold text-slate-900 uppercase truncate leading-tight">
                      {dashboardAnalytics.topProcesses[0]?.label ||
                        "LAVADO ENZIMÁTICO"}
                    </div>
                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mt-1.5">
                      {dashboardAnalytics.topProcesses[0]?.prendas.toLocaleString(
                        "es-EC"
                      ) || 0}{" "}
                      PRENDAS &bull;{" "}
                      {dashboardAnalytics.topProcesses[0]?.lotes || 0} LOTES
                    </div>
                  </div>
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold text-slate-500">
                    <span>
                      Catálogo:{" "}
                      <strong className="text-slate-700">
                        {processCatalog.length} procesos
                      </strong>
                    </span>
                    <span className="text-indigo-600 group-hover:translate-x-0.5 transition-transform">
                      Abrir Ventana &rarr;
                    </span>
                  </div>
                </div>

                {/* KPI 3: Cliente Top */}
                <div
                  onClick={() => {
                    const topCli = dashboardAnalytics.topClients[0];
                    if (topCli) {
                      const found = clients.find(
                        (c) =>
                          c.rucCedula === topCli.rucCedula ||
                          c.nombre === topCli.nombre
                      );
                      setDashboardSelectedClient(
                        found || {
                          id: topCli.id,
                          nombre: topCli.nombre,
                          rucCedula: topCli.rucCedula,
                          telefono: topCli.telefono,
                          direccion: topCli.direccion,
                        }
                      );
                    } else {
                      setDashboardExpandedModal("clientes");
                    }
                  }}
                  className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm hover:border-amber-200 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between gap-4 group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-500 group-hover:bg-amber-500 group-hover:text-white transition-colors flex items-center justify-center shrink-0">
                      <Trophy className="w-5 h-5" />
                    </div>
                    <span className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-600 font-extrabold text-[10px] uppercase tracking-wider shrink-0">
                      CLIENTE VIP
                    </span>
                  </div>
                  <div className="min-w-0">
                    <div className="text-[14px] font-extrabold text-slate-900 uppercase truncate leading-tight">
                      {dashboardAnalytics.topClients[0]?.nombre ||
                        "SIN CLIENTE"}
                    </div>
                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mt-1.5">
                      {dashboardAnalytics.topClients[0]?.prendas.toLocaleString(
                        "es-EC"
                      ) || 0}{" "}
                      UDS &bull;{" "}
                      {dashboardAnalytics.topClients[0]?.ordenes || 0} ÓRDENES
                    </div>
                  </div>
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold text-slate-500">
                    <span>
                      Cartera activa:{" "}
                      <strong className="text-slate-700">
                        {dashboardAnalytics.activeClientsRate}%
                      </strong>
                    </span>
                    <span className="text-amber-600 group-hover:translate-x-0.5 transition-transform">
                      Ver Ficha &rarr;
                    </span>
                  </div>
                </div>

                {/* KPI 4: Órdenes Emitidas y Vista Rápida */}
                <div
                  onClick={() => {
                    if (dashboardAnalytics.filteredOrders[0]) {
                      setDashboardPreviewOrder(
                        dashboardAnalytics.filteredOrders[0]
                      );
                    } else {
                      setActiveSection("historial");
                    }
                  }}
                  className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm hover:border-emerald-200 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between gap-4 group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors flex items-center justify-center shrink-0">
                      <Activity className="w-5 h-5" />
                    </div>
                    <span className="px-2.5 py-1 rounded-lg bg-[#ECFDF5] text-[#10B981] font-extrabold text-[10px] uppercase tracking-wider shrink-0">
                      CONTROL A4
                    </span>
                  </div>
                  <div>
                    <div className="text-2xl font-extrabold text-slate-900 leading-none">
                      {dashboardAnalytics.filteredOrders.length}{" "}
                      <span className="text-xs font-bold text-slate-400">
                        / {savedOrders.length}
                      </span>
                    </div>
                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mt-1.5">
                      ÓRDENES DE DESPACHO EMITIDAS
                    </div>
                  </div>
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold text-slate-500">
                    <span className="truncate">
                      Última:{" "}
                      <strong className="text-slate-700">
                        {dashboardAnalytics.filteredOrders[0]?.numeroOrden ||
                          "N/A"}
                      </strong>
                    </span>
                    <span className="text-emerald-600 group-hover:translate-x-0.5 transition-transform shrink-0">
                      Ver Recibo &rarr;
                    </span>
                  </div>
                </div>
              </div>

              {/* NIVEL 2: 2 VENTANAS PRINCIPALES SIMÉTRICAS (6 COLS + 6 COLS) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                {/* VENTANA PRINCIPAL 1 (6 COLS): RANKING DE PROCESOS QUE MÁS SE DESPACHAN */}
                <div className="lg:col-span-6 bg-white rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between overflow-hidden">
                  <div>
                    <div className="px-6 py-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3.5">
                        <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                          <BarChart3 className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-[15px] font-extrabold text-slate-900 uppercase tracking-tight">
                              Procesos que Más se Despachan
                            </h3>
                            <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-600 font-extrabold text-[10px]">
                              TOP {Math.min(5, dashboardAnalytics.topProcesses.length)}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 font-medium">
                            Volumen de prendas y participación por proceso
                            industrial
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setDashboardModalSearch("");
                            setDashboardExpandedModal("procesos");
                          }}
                          className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-600 text-[11px] font-extrabold uppercase tracking-wider transition-colors cursor-pointer"
                        >
                          Ampliar Ventana
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveSection("procesos-despacho")}
                          className="text-xs font-extrabold uppercase tracking-wider text-blue-600 hover:text-blue-700 cursor-pointer px-2"
                        >
                          Catálogo &rarr;
                        </button>
                      </div>
                    </div>

                    <div className="divide-y divide-slate-100/80">
                      {dashboardAnalytics.topProcesses.length === 0 ? (
                        <div className="p-10 text-center text-xs text-slate-400 font-semibold">
                          No hay procesos registrados para el filtro actual.
                        </div>
                      ) : (
                        dashboardAnalytics.topProcesses
                          .slice(0, 5)
                          .map((proc, index) => {
                            const maxPrendas =
                              dashboardAnalytics.topProcesses[0]?.prendas || 1;
                            const widthPct = Math.max(
                              12,
                              Math.round((proc.prendas / maxPrendas) * 100)
                            );
                            const shareOfTotal = Math.round(
                              (proc.prendas /
                                Math.max(
                                  1,
                                  dashboardAnalytics.totalGarmentsAllOrders
                                )) *
                                100
                            );

                            return (
                              <div
                                key={proc.label}
                                className="px-6 py-4 hover:bg-slate-50/70 transition-colors space-y-2.5"
                              >
                                <div className="flex items-center justify-between gap-3">
                                  <div className="flex items-center gap-3 min-w-0">
                                    <span
                                      className={`w-7 h-7 rounded-xl font-mono text-[11px] font-extrabold flex items-center justify-center shrink-0 ${
                                        index === 0
                                          ? "bg-blue-600 text-white shadow-xs shadow-blue-600/30"
                                          : index === 1
                                          ? "bg-blue-50 text-blue-700"
                                          : "bg-slate-100 text-slate-500"
                                      }`}
                                    >
                                      {String(index + 1).padStart(2, "0")}
                                    </span>
                                    <div className="min-w-0">
                                      <span className="font-bold text-[#1E293B] text-[13px] uppercase tracking-[-0.01em] block truncate">
                                        {proc.label}
                                      </span>
                                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#94A3B8] block">
                                        {proc.category} &bull; {proc.lotes}{" "}
                                        {proc.lotes === 1
                                          ? "LOTE PROCESADO"
                                          : "LOTES PROCESADOS"}
                                      </span>
                                    </div>
                                  </div>

                                  <div className="text-right shrink-0">
                                    <span className="inline-block px-2.5 py-1 rounded-md bg-[#ECFDF5] text-[#10B981] font-extrabold text-[11px] uppercase tracking-wider">
                                      {proc.prendas.toLocaleString("es-EC")} UDS
                                    </span>
                                  </div>
                                </div>

                                <div className="flex items-center gap-3">
                                  <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                      className={`h-full rounded-full ${
                                        index === 0
                                          ? "bg-blue-600"
                                          : "bg-blue-400"
                                      }`}
                                      style={{ width: `${widthPct}%` }}
                                    />
                                  </div>
                                  <span className="text-[10px] font-extrabold text-slate-400 w-16 text-right uppercase">
                                    {shareOfTotal}% VOL.
                                  </span>
                                </div>
                              </div>
                            );
                          })
                      )}
                    </div>
                  </div>

                  {/* Footer de la Ventana 1 */}
                  <div className="px-6 py-3.5 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-[11px] font-bold text-slate-400">
                      Mostrando Top {Math.min(5, dashboardAnalytics.topProcesses.length)} de{" "}
                      {dashboardAnalytics.topProcesses.length} procesos aplicados
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingProcessId(null);
                        setNewProcessForm({
                          label: "",
                          category: "LAVADO",
                          tipoPrenda:
                            garmentCatalog[0]?.label ||
                            "Pantalón Jean Caballero",
                          description: "",
                        });
                        setShowNewProcessForm(true);
                      }}
                      className="text-[11px] font-extrabold text-blue-600 hover:text-blue-700 uppercase tracking-wider cursor-pointer"
                    >
                      + Registrar Nuevo Proceso
                    </button>
                  </div>
                </div>

                {/* VENTANA PRINCIPAL 2 (6 COLS): CLIENTES TOP DE LA PLANTA */}
                <div className="lg:col-span-6 bg-white rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between overflow-hidden">
                  <div>
                    <div className="px-6 py-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3.5">
                        <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center shrink-0">
                          <Trophy className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-[15px] font-extrabold text-slate-900 uppercase tracking-tight">
                              Clientes Top de la Planta
                            </h3>
                            <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-600 font-extrabold text-[10px]">
                              CARTERA VIP
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 font-medium">
                            Ranking por volumen acumulado, ficha rápida y
                            despacho en 1 clic
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setDashboardModalSearch("");
                            setDashboardExpandedModal("clientes");
                          }}
                          className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-amber-50 text-slate-600 hover:text-amber-700 text-[11px] font-extrabold uppercase tracking-wider transition-colors cursor-pointer"
                        >
                          Ampliar Ventana
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveSection("clientes")}
                          className="text-xs font-extrabold uppercase tracking-wider text-blue-600 hover:text-blue-700 cursor-pointer px-2"
                        >
                          Cartera &rarr;
                        </button>
                      </div>
                    </div>

                    <div className="divide-y divide-slate-100/80">
                      {dashboardAnalytics.topClients.length === 0 ? (
                        <div className="p-10 text-center text-xs text-slate-400 font-semibold">
                          No hay clientes con despachos para el filtro actual.
                        </div>
                      ) : (
                        dashboardAnalytics.topClients
                          .slice(0, 5)
                          .map((cli, idx) => {
                            const pctShare = Math.round(
                              (cli.prendas /
                                Math.max(
                                  1,
                                  dashboardAnalytics.totalGarmentsAllOrders
                                )) *
                                100
                            );

                            return (
                              <div
                                key={cli.rucCedula + idx}
                                className="px-6 py-4 hover:bg-slate-50/70 transition-colors space-y-2.5"
                              >
                                <div className="flex items-center justify-between gap-3">
                                  <div className="flex items-center gap-3 min-w-0">
                                    <span
                                      className={`px-2.5 py-1 rounded-lg font-mono text-[10.5px] font-black uppercase shrink-0 ${
                                        idx === 0
                                          ? "bg-blue-600 text-white"
                                          : idx === 1
                                          ? "bg-amber-100 text-amber-700"
                                          : "bg-slate-100 text-slate-600"
                                      }`}
                                    >
                                      TOP {idx + 1}
                                    </span>
                                    <div className="min-w-0">
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setDashboardSelectedClient({
                                            id: cli.id,
                                            nombre: cli.nombre,
                                            rucCedula: cli.rucCedula,
                                            telefono: cli.telefono,
                                            direccion: cli.direccion,
                                          })
                                        }
                                        className="font-bold text-[#1E293B] hover:text-blue-600 text-[13px] uppercase tracking-[-0.01em] block truncate text-left cursor-pointer"
                                      >
                                        {cli.nombre}
                                      </button>
                                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] block">
                                        RUC: {cli.rucCedula} &bull;{" "}
                                        {cli.ordenes}{" "}
                                        {cli.ordenes === 1
                                          ? "ORDEN"
                                          : "ÓRDENES"}{" "}
                                        ({cli.lotes} LOTES)
                                      </span>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2 shrink-0">
                                    <span className="inline-block px-2.5 py-1 rounded-md bg-[#ECFDF5] text-[#10B981] font-extrabold text-[11px] uppercase tracking-wider">
                                      {cli.prendas.toLocaleString("es-EC")} UDS
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setDashboardSelectedClient({
                                          id: cli.id,
                                          nombre: cli.nombre,
                                          rucCedula: cli.rucCedula,
                                          telefono: cli.telefono,
                                          direccion: cli.direccion,
                                        })
                                      }
                                      title="Ver Ficha y Órdenes del Cliente"
                                      className="p-1.5 rounded-xl bg-slate-100 hover:bg-blue-50 text-slate-500 hover:text-blue-600 transition-colors cursor-pointer"
                                    >
                                      <Eye className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleNewBlankOrder({
                                          id: cli.id,
                                          nombre: cli.nombre,
                                          rucCedula: cli.rucCedula,
                                          telefono: cli.telefono,
                                          direccion: cli.direccion,
                                        })
                                      }
                                      title="Crear Nuevo Despacho para este Cliente"
                                      className="p-1.5 rounded-xl bg-blue-50 hover:bg-blue-600 text-blue-600 hover:text-white transition-colors cursor-pointer"
                                    >
                                      <Plus className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>

                                <div className="flex items-center gap-3">
                                  <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                      className={`h-full rounded-full ${
                                        idx === 0
                                          ? "bg-blue-600"
                                          : "bg-[#10B981]"
                                      }`}
                                      style={{
                                        width: `${Math.max(10, pctShare)}%`,
                                      }}
                                    />
                                  </div>
                                  <span className="text-[10px] font-extrabold text-slate-400 w-16 text-right uppercase">
                                    {pctShare}% TOTAL
                                  </span>
                                </div>
                              </div>
                            );
                          })
                      )}
                    </div>
                  </div>

                  {/* Footer de la Ventana 2 */}
                  <div className="px-6 py-3.5 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-[11px] font-bold text-slate-400">
                      {dashboardAnalytics.topClients.length} clientes con
                      movimiento en planta
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingClientId(null);
                        setNewClientForm({
                          nombre: "",
                          rucCedula: "",
                          telefono: "",
                          direccion: "",
                        });
                        setShowClientModalInDirectory(true);
                      }}
                      className="text-[11px] font-extrabold text-blue-600 hover:text-blue-700 uppercase tracking-wider cursor-pointer"
                    >
                      + Registrar Nuevo Cliente
                    </button>
                  </div>
                </div>
              </div>

              {/* NIVEL 3: 3 VENTANAS OPERATIVAS SIMÉTRICAS (MANUALIDADES, PRENDAS Y ENCARGADOS) */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
                {/* VENTANA OPERATIVA 1: MANUALIDADES TOP */}
                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between overflow-hidden">
                  <div>
                    <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                          <Sparkles className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="text-[13.5px] font-extrabold text-slate-900 uppercase tracking-tight">
                            Manualidades Top
                          </h3>
                          <p className="text-[11px] text-slate-400 font-medium">
                            Acabados en seco y desgaste
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setDashboardModalSearch("");
                            setDashboardExpandedModal("manualidades");
                          }}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 text-[10px] font-extrabold uppercase cursor-pointer"
                        >
                          Ampliar
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveSection("manualidades")}
                          className="text-[11px] font-bold uppercase text-indigo-600 hover:text-indigo-700 cursor-pointer px-1"
                        >
                          Ver &rarr;
                        </button>
                      </div>
                    </div>

                    <div className="divide-y divide-slate-100/80">
                      {dashboardAnalytics.topFinishes.slice(0, 5).map((fin) => (
                        <div
                          key={fin.label}
                          className="px-6 py-3.5 flex items-center justify-between gap-2 hover:bg-slate-50/70 transition-colors"
                        >
                          <div className="min-w-0">
                            <span className="font-bold text-[#1E293B] text-[12.5px] uppercase tracking-[-0.01em] block truncate">
                              {fin.label}
                            </span>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] block truncate">
                              {fin.tipoPrenda} &bull; {fin.lotes} LOTES
                            </span>
                          </div>
                          <span className="px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-600 font-extrabold text-[10.5px] uppercase tracking-wider shrink-0">
                            {fin.prendas.toLocaleString("es-EC")} UDS
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="px-6 py-3 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[10.5px] font-bold text-slate-400">
                      {finishCatalog.length} en catálogo
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingFinishId(null);
                        setNewFinishForm({
                          label: "",
                          category: "MANUALIDAD SECO",
                          tipoPrenda:
                            garmentCatalog[0]?.label ||
                            "Pantalón Jean Caballero",
                          technique: "",
                        });
                        setShowNewFinishForm(true);
                      }}
                      className="text-[10.5px] font-extrabold text-indigo-600 hover:text-indigo-700 uppercase cursor-pointer"
                    >
                      + Nueva Manualidad
                    </button>
                  </div>
                </div>

                {/* VENTANA OPERATIVA 2: PRENDAS MÁS DESPACHADAS */}
                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between overflow-hidden">
                  <div>
                    <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                          <Shirt className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="text-[13.5px] font-extrabold text-slate-900 uppercase tracking-tight">
                            Prendas Más Despachadas
                          </h3>
                          <p className="text-[11px] text-slate-400 font-medium">
                            Distribución por línea textil
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setDashboardModalSearch("");
                            setDashboardExpandedModal("prendas");
                          }}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-600 text-[10px] font-extrabold uppercase cursor-pointer"
                        >
                          Ampliar
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveSection("tipos-prenda")}
                          className="text-[11px] font-bold uppercase text-blue-600 hover:text-blue-700 cursor-pointer px-1"
                        >
                          Ver &rarr;
                        </button>
                      </div>
                    </div>

                    <div className="divide-y divide-slate-100/80">
                      {dashboardAnalytics.topGarments.slice(0, 5).map((gar) => (
                        <div
                          key={gar.label}
                          className="px-6 py-3.5 flex items-center justify-between gap-2 hover:bg-slate-50/70 transition-colors"
                        >
                          <div className="min-w-0">
                            <span className="font-bold text-[#1E293B] text-[12.5px] uppercase tracking-[-0.01em] block truncate">
                              {gar.label}
                            </span>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] block">
                              {gar.lotes}{" "}
                              {gar.lotes === 1
                                ? "LOTE PROCESADO"
                                : "LOTES PROCESADOS"}
                            </span>
                          </div>
                          <span className="px-2.5 py-1 rounded-md bg-blue-50 text-blue-600 font-extrabold text-[10.5px] uppercase tracking-wider shrink-0">
                            {gar.prendas.toLocaleString("es-EC")} UDS
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="px-6 py-3 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[10.5px] font-bold text-slate-400">
                      {garmentCatalog.length} tipos registrados
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingGarmentId(null);
                        setNewGarmentForm({
                          label: "",
                          category: "DENIM CABALLERO",
                          fabric: "Mezclilla Índigo 100% Algodón",
                          description: "",
                        });
                        setShowNewGarmentForm(true);
                      }}
                      className="text-[10.5px] font-extrabold text-blue-600 hover:text-blue-700 uppercase cursor-pointer"
                    >
                      + Nueva Prenda
                    </button>
                  </div>
                </div>

                {/* VENTANA OPERATIVA 3: DESPACHOS POR ENCARGADO */}
                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between overflow-hidden">
                  <div>
                    <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                          <UserCheck className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="text-[13.5px] font-extrabold text-slate-900 uppercase tracking-tight">
                            Despachos por Encargado
                          </h3>
                          <p className="text-[11px] text-slate-400 font-medium">
                            Responsables de salida en planta
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setDashboardModalSearch("");
                            setDashboardExpandedModal("encargados");
                          }}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-emerald-50 text-slate-600 hover:text-emerald-600 text-[10px] font-extrabold uppercase cursor-pointer"
                        >
                          Ampliar
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveSection("encargados")}
                          className="text-[11px] font-bold uppercase text-emerald-600 hover:text-emerald-700 cursor-pointer px-1"
                        >
                          Ver &rarr;
                        </button>
                      </div>
                    </div>

                    <div className="divide-y divide-slate-100/80">
                      {dashboardAnalytics.topDispatchers
                        .slice(0, 5)
                        .map((disp) => (
                          <div
                            key={disp.nombre}
                            onClick={() =>
                              setDashboardDispatcherFilter((prev) =>
                                prev === disp.nombre ? "TODOS" : disp.nombre
                              )
                            }
                            title="Clic para filtrar el Dashboard por este encargado"
                            className="px-6 py-3.5 flex items-center justify-between gap-3 hover:bg-slate-50/70 transition-colors cursor-pointer"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 font-extrabold text-[11px] flex items-center justify-center shrink-0">
                                {disp.nombre
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")
                                  .slice(0, 2)}
                              </div>
                              <div className="min-w-0">
                                <span className="font-bold text-[#1E293B] text-[12.5px] uppercase tracking-[-0.01em] block truncate">
                                  {disp.nombre}
                                </span>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] block">
                                  {disp.cargo} &bull; {disp.ordenes}{" "}
                                  {disp.ordenes === 1 ? "ORDEN" : "ÓRDENES"}
                                </span>
                              </div>
                            </div>
                            <span className="px-2.5 py-1 rounded-md bg-[#ECFDF5] text-[#10B981] font-extrabold text-[10.5px] uppercase tracking-wider shrink-0">
                              {disp.prendas.toLocaleString("es-EC")} UDS
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>

                  <div className="px-6 py-3 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[10.5px] font-bold text-slate-400">
                      {dispatcherCatalog.length} encargados activos
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingDispatcherId(null);
                        setNewDispatcherForm({
                          nombre: "",
                          cargo: "BODEGUERO",
                          telefono: "",
                        });
                        setShowNewDispatcherForm(true);
                      }}
                      className="text-[10.5px] font-extrabold text-emerald-600 hover:text-emerald-700 uppercase cursor-pointer"
                    >
                      + Nuevo Encargado
                    </button>
                  </div>
                </div>
              </div>

              {/* NIVEL 4: VENTANA MAESTRA DE ÚLTIMOS DESPACHOS EMITIDOS CON INSPECCIÓN A4 EN VIVO */}
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-[15px] font-extrabold text-slate-900 uppercase tracking-tight">
                          Control de Últimos Despachos Emitidos
                        </h3>
                        <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 font-extrabold text-[10px]">
                          {dashboardAnalytics.filteredOrders.length} ÓRDENES
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 font-medium">
                        Inspeccione el recibo A4 en ventana emergente, edite
                        lotes o imprima directamente
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setActiveSection("historial")}
                      className="text-xs font-extrabold uppercase tracking-wider text-blue-600 hover:text-blue-700 cursor-pointer"
                    >
                      Ver Historial Completo &rarr;
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 text-[10.5px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50/50">
                        <th className="py-3.5 px-6">N° ORDEN / EMISIÓN</th>
                        <th className="py-3.5 px-6">CLIENTE / RUC</th>
                        <th className="py-3.5 px-6">DETALLE DE PRENDAS Y PROCESOS</th>
                        <th className="py-3.5 px-6">ENCARGADO</th>
                        <th className="py-3.5 px-6">VOLUMEN</th>
                        <th className="py-3.5 px-6 text-right">
                          VENTANA / ACCIONES
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100/80 text-xs">
                      {dashboardAnalytics.filteredOrders
                        .slice(0, 8)
                        .map((ord) => {
                          const totalQty = ord.items.reduce(
                            (acc, i) => acc + (Number(i.cantidad) || 0),
                            0
                          );
                          const uniqueProcesses = Array.from(
                            new Set(ord.items.flatMap((i) => i.procesos))
                          );
                          return (
                            <tr
                              key={ord.id}
                              className="hover:bg-slate-50/80 transition-colors"
                            >
                              <td className="py-4 px-6">
                                <button
                                  type="button"
                                  onClick={() => setDashboardPreviewOrder(ord)}
                                  className="font-bold text-blue-600 hover:text-blue-700 text-[13px] uppercase tracking-[-0.01em] block text-left cursor-pointer"
                                >
                                  {ord.numeroOrden}
                                </button>
                                <span className="text-[10.5px] font-semibold uppercase tracking-wider text-[#94A3B8] block mt-0.5">
                                  FECHA: {ord.fecha}
                                </span>
                              </td>
                              <td className="py-4 px-6">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setDashboardSelectedClient(ord.cliente)
                                  }
                                  className="font-bold text-[#1E293B] hover:text-blue-600 text-[12.5px] uppercase tracking-[-0.01em] block text-left cursor-pointer"
                                >
                                  {ord.cliente.nombre}
                                </button>
                                <span className="text-[10.5px] font-semibold uppercase tracking-wider text-[#94A3B8] block mt-0.5">
                                  RUC: {ord.cliente.rucCedula}
                                </span>
                              </td>
                              <td className="py-4 px-6 max-w-xs">
                                <div className="font-bold text-slate-700 text-[11.5px] truncate">
                                  {ord.items
                                    .map((i) => `${i.tipoPrenda} (${i.lote})`)
                                    .join(" • ")}
                                </div>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {uniqueProcesses.slice(0, 3).map((p) => (
                                    <span
                                      key={p}
                                      className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-600 font-bold text-[9.5px] uppercase"
                                    >
                                      {p}
                                    </span>
                                  ))}
                                  {uniqueProcesses.length > 3 && (
                                    <span className="px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-500 font-bold text-[9.5px]">
                                      +{uniqueProcesses.length - 3}
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="py-4 px-6">
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-[10.5px] font-extrabold uppercase tracking-wider">
                                  <UserCheck className="w-3 h-3 text-emerald-600" />
                                  {ord.despachadoPor || "ENCARGADO"}
                                </span>
                              </td>
                              <td className="py-4 px-6">
                                <span className="inline-block px-2.5 py-1 rounded-md bg-[#ECFDF5] text-[#10B981] font-extrabold text-[11px] uppercase tracking-wider">
                                  {totalQty.toLocaleString("es-EC")} PRENDAS
                                </span>
                                <span className="text-[10px] font-bold uppercase text-slate-400 block mt-0.5">
                                  {ord.items.length}{" "}
                                  {ord.items.length === 1 ? "LOTE" : "LOTES"}
                                </span>
                              </td>
                              <td className="py-4 px-6 text-right">
                                <div className="inline-flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setDashboardPreviewOrder(ord)
                                    }
                                    title="Abrir Ventana de Vista Previa A4 y Detalle"
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-600 text-blue-600 hover:text-white font-bold text-[11px] transition-colors cursor-pointer"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                    <span>Ver A4</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setCurrentOrder(ord);
                                      setActiveSection("nuevo-despacho");
                                    }}
                                    title="Editar en Despacho"
                                    className="p-1.5 rounded-xl text-[#94A3B8] hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                                  >
                                    <Pencil className="w-4 h-4" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setCurrentOrder(ord);
                                      setTimeout(() => {
                                        window.print();
                                      }, 150);
                                    }}
                                    title="Imprimir Recibo A4"
                                    className="p-1.5 rounded-xl text-[#94A3B8] hover:text-emerald-600 hover:bg-emerald-50 transition-colors cursor-pointer"
                                  >
                                    <Printer className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>
            </main>
          )}

          {/* =================================================================
              MODULE 2: NUEVO DESPACHO (FORMULARIO DE REGISTRO + MONITOR A4)
             ================================================================= */}
          {activeSection === "nuevo-despacho" && (
            <main className="p-8 max-w-[1550px] w-full mx-auto space-y-7">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h1 className="text-[26px] font-extrabold text-slate-900 tracking-tight leading-tight">
                    Registro de Despacho Textil
                  </h1>
                  <p className="text-sm text-slate-500 font-medium mt-0.5">
                    Recepción y salida de lotes de mezclilla, procesos
                    industriales y emisión de recibos A4 (Original y Copia)
                  </p>
                </div>
              </div>

              {/* 3 KPI SUMMARY CARDS */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="bg-white rounded-3xl py-3.5 px-5 border border-slate-100 shadow-sm flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-2xl font-extrabold text-slate-900 leading-none">
                      {currentOrder.items.length}
                    </div>
                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mt-1">
                      LOTES EN ESTA ORDEN ({currentOrder.numeroOrden})
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-3xl py-3.5 px-5 border border-slate-100 shadow-sm flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <Package className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-2xl font-extrabold text-slate-900 leading-none">
                      {totalUnidades.toLocaleString("es-EC")}
                    </div>
                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mt-1">
                      PRENDAS TOTALES A DESPACHAR
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-3xl py-3.5 px-5 border border-slate-100 shadow-sm flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center shrink-0">
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-2xl font-extrabold text-slate-900 leading-none">
                      {totalProcesosAplicados} ops
                    </div>
                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mt-1">
                      PROCESOS Y MANUALIDADES APLICADAS
                    </div>
                  </div>
                </div>
              </div>

              {/* FORMULARIO PRINCIPAL DE REGISTRO */}
              <div className="max-w-[1280px] mx-auto w-full space-y-6">
                  {/* CARD 1: SELECCIÓN O CREACIÓN RÁPIDA DE CLIENTE */}
                  <section className="bg-white rounded-3xl border border-slate-100 shadow-sm relative">
                    <div className="px-6 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 font-bold text-xs flex items-center justify-center">
                          01
                        </div>
                        <div>
                          <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wide">
                            Cliente / Confeccionista
                          </h3>
                          <p className="text-xs text-slate-400">
                            Seleccione un cliente de la cartera o regístrelo
                            rápidamente
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setEditingClientId(null);
                          setNewClientForm({
                            nombre: "",
                            rucCedula: "",
                            telefono: "",
                            direccion: "",
                          });
                          setShowClientModalInDirectory(true);
                        }}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/20 text-xs font-bold transition-all cursor-pointer"
                      >
                        <Plus className="w-4 h-4 stroke-[2.5]" />
                        <span>Nuevo Cliente</span>
                      </button>
                    </div>

                    <div className="p-6">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                            Cliente que Recibe
                          </label>
                          <SearchableSelect
                            options={clients.map((cli) => ({
                              value: cli.nombre,
                              label: cli.nombre,
                              sublabel: cli.rucCedula,
                            }))}
                            value={currentOrder.cliente.nombre}
                            placeholder="SELECCIONAR CLIENTE..."
                            searchPlaceholder="Buscar..."
                            onChange={(val) => {
                              const found = clients.find(
                                (c) => c.nombre === val || c.id === val
                              );
                              if (found) handleSelectClient(found);
                            }}
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                            RUC / Cédula
                          </label>
                          <input
                            type="text"
                            value={currentOrder.cliente.rucCedula}
                            onChange={(e) =>
                              setCurrentOrder((prev) => ({
                                ...prev,
                                cliente: {
                                  ...prev.cliente,
                                  rucCedula: e.target.value,
                                },
                              }))
                            }
                            className="w-full px-3.5 py-2.5 rounded-2xl bg-[#F8FAFC] border border-slate-200/80 text-xs font-mono font-bold text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                            Teléfono
                          </label>
                          <input
                            type="text"
                            value={currentOrder.cliente.telefono}
                            onChange={(e) =>
                              setCurrentOrder((prev) => ({
                                ...prev,
                                cliente: {
                                  ...prev.cliente,
                                  telefono: e.target.value,
                                },
                              }))
                            }
                            className="w-full px-3.5 py-2.5 rounded-2xl bg-[#F8FAFC] border border-slate-200/80 text-xs font-mono text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-none"
                          />
                        </div>
                        <div className="sm:col-span-3">
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                            Dirección del Cliente
                          </label>
                          <input
                            type="text"
                            value={currentOrder.cliente.direccion}
                            onChange={(e) =>
                              setCurrentOrder((prev) => ({
                                ...prev,
                                cliente: {
                                  ...prev.cliente,
                                  direccion: e.target.value,
                                },
                              }))
                            }
                            className="w-full px-3.5 py-2.5 rounded-2xl bg-[#F8FAFC] border border-slate-200/80 text-xs text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* CARD 2: DATOS DEL DESPACHO (SOLO FECHA DE EMISIÓN DEL DOCUMENTO) */}
                  <section className="bg-white rounded-3xl border border-slate-100 shadow-sm relative">
                    <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 font-bold text-xs flex items-center justify-center">
                        02
                      </div>
                      <div>
                        <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wide">
                          Datos del Despacho
                        </h3>
                        <p className="text-xs text-slate-400">
                          Número de orden consecutivo, responsable que despacha y
                          fecha en que se emite el documento
                        </p>
                      </div>
                    </div>

                    <div className="p-6 space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center justify-between">
                            <span>N° de Orden (Fecha + Secuencia)</span>
                            <span className="inline-flex items-center gap-1 text-[9px] font-extrabold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-md">
                              <Lock className="w-2.5 h-2.5" />
                              CONTROL FIJO
                            </span>
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              readOnly
                              tabIndex={-1}
                              title="Número de control automático (Fecha + Secuencia). No modificable."
                              value={formatOrderNumberWithDate(
                                currentOrder.fecha,
                                extractSequenceFromOrderNumber(
                                  currentOrder.numeroOrden,
                                  orderCounter
                                )
                              )}
                              className="w-full px-3.5 py-2.5 pr-9 rounded-2xl bg-slate-100/90 border border-slate-200 text-xs font-mono font-extrabold text-blue-700 cursor-not-allowed select-none focus:outline-none"
                            />
                            <Lock className="w-3.5 h-3.5 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                            Responsable que Despacha
                          </label>
                          <SearchableSelect
                            options={[
                              {
                                value: "ENCARGADO",
                                label: "ENCARGADO",
                                sublabel: "POR DEFECTO",
                              },
                              ...dispatcherCatalog.map((d) => ({
                                value: d.nombre,
                                label: d.nombre,
                                sublabel: d.cargo,
                              })),
                            ]}
                            value={currentOrder.despachadoPor || "ENCARGADO"}
                            placeholder="ENCARGADO"
                            searchPlaceholder="Buscar encargado..."
                            onChange={(val) =>
                              setCurrentOrder((prev) => ({
                                ...prev,
                                despachadoPor: val,
                              }))
                            }
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            Fecha de Emisión del Documento
                          </label>
                          <input
                            type="date"
                            value={currentOrder.fecha}
                            onChange={(e) => {
                              const newDate = e.target.value;
                              setCurrentOrder((prev) => {
                                const seq = extractSequenceFromOrderNumber(
                                  prev.numeroOrden,
                                  orderCounter
                                );
                                return {
                                  ...prev,
                                  fecha: newDate,
                                  numeroOrden: formatOrderNumberWithDate(
                                    newDate,
                                    seq
                                  ),
                                };
                              });
                            }}
                            className="w-full px-3.5 py-2.5 rounded-2xl bg-[#F8FAFC] border border-slate-200/80 text-xs font-mono font-semibold text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-none"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                          Observaciones Generales / Control de Calidad
                        </label>
                        <textarea
                          rows={2}
                          placeholder="Instrucciones de acabado, referencia de muestra física, empaque o control de encogimiento..."
                          value={currentOrder.observaciones}
                          onChange={(e) =>
                            setCurrentOrder((prev) => ({
                              ...prev,
                              observaciones: e.target.value,
                            }))
                          }
                          className="w-full px-3.5 py-2.5 rounded-xl bg-[#F8FAFC] border border-slate-200/80 text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-blue-600 focus:outline-none"
                        />
                      </div>
                    </div>
                  </section>

                  {/* CARD 3: DETALLE DINÁMICO DE PRENDAS, PROCESOS INDUSTRIALES Y MANUALIDADES */}
                  <section className="bg-white rounded-3xl border border-slate-100 shadow-sm relative">
                    <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 font-bold text-xs flex items-center justify-center">
                        03
                      </div>
                      <div>
                        <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wide">
                          Detalle de Prendas, Proceso Hecho y Manualidades
                        </h3>
                        <p className="text-xs text-slate-400">
                          Seleccione el tipo de prenda, lote y el proceso
                          hecho que se despacha al cliente
                        </p>
                      </div>
                    </div>

                    <div className="p-6 space-y-5">
                      {currentOrder.items.map((item, index) => (
                        <div
                          key={item.id}
                          className="rounded-2xl border border-slate-200/80 bg-[#F8FAFC] p-5 space-y-4 transition-all hover:border-blue-200"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/70 pb-3">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-blue-600 text-white font-mono text-xs font-extrabold flex items-center justify-center shadow-sm shadow-blue-600/20">
                                #{String(index + 1).padStart(2, "0")}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-extrabold text-slate-900 uppercase">
                                    {item.tipoPrenda || "Prenda Textil"}
                                  </span>
                                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-blue-50 text-blue-600 border border-blue-200/60">
                                    LOTE {item.lote || "S/L"}
                                  </span>
                                </div>
                                <span className="text-xs text-slate-500">
                                  Proceso hecho:{" "}
                                  <strong className="text-slate-700 uppercase">
                                    {item.procesos.length > 0
                                      ? item.procesos.join(" + ")
                                      : "Sin especificar"}
                                  </strong>{" "}
                                  &bull;{" "}
                                  <strong className="text-emerald-600">
                                    {Number(item.cantidad || 0).toLocaleString(
                                      "es-EC"
                                    )}{" "}
                                    unidades
                                  </strong>
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleDuplicateItem(item)}
                                title="Duplicar Lote"
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white hover:bg-blue-50 text-slate-600 hover:text-blue-600 border border-slate-200/80 text-xs font-bold transition-colors cursor-pointer"
                              >
                                <Copy className="w-3.5 h-3.5" />
                                Duplicar
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemoveItem(item.id)}
                                title="Eliminar Lote"
                                className="w-8 h-8 rounded-xl bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-slate-200/80 flex items-center justify-center transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5">
                            <div className="sm:col-span-6">
                              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                                Tipo de Prenda
                              </label>
                              <SearchableSelect
                                options={garmentCatalog.map((g) => ({
                                  value: g.label,
                                  label: g.label,
                                  sublabel: g.category,
                                }))}
                                value={item.tipoPrenda}
                                placeholder="SELECCIONAR PRENDA..."
                                searchPlaceholder="Buscar..."
                                allowCustom={true}
                                onChange={(val) =>
                                  handleUpdateItemField(
                                    item.id,
                                    "tipoPrenda",
                                    val
                                  )
                                }
                              />
                            </div>

                            <div className="sm:col-span-3">
                              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                                Cantidad (Unidades)
                              </label>
                              <input
                                type="number"
                                min={1}
                                value={item.cantidad}
                                onChange={(e) =>
                                  handleUpdateItemField(
                                    item.id,
                                    "cantidad",
                                    Math.max(
                                      0,
                                      parseInt(e.target.value, 10) || 0
                                    )
                                  )
                                }
                                className="w-full px-3 py-2.5 rounded-2xl bg-white border border-slate-200 text-xs font-mono font-extrabold text-blue-600 focus:border-blue-600 focus:outline-none"
                              />
                            </div>

                            <div className="sm:col-span-3">
                              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                                Lote
                              </label>
                              <input
                                type="text"
                                placeholder="LT-001"
                                value={item.lote}
                                onChange={(e) =>
                                  handleUpdateItemField(
                                    item.id,
                                    "lote",
                                    e.target.value.toUpperCase()
                                  )
                                }
                                className="w-full px-3 py-2.5 rounded-2xl bg-white border border-slate-200 text-xs font-mono font-bold text-slate-900 focus:border-blue-600 focus:outline-none"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-1">
                            {/* PROCESOS INDUSTRIALES (PROCESO HECHO) */}
                            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 space-y-3">
                              <div className="flex items-center justify-between">
                                <span className="text-[11px] font-extrabold uppercase tracking-wider text-blue-600 flex items-center gap-1.5">
                                  <FlaskConical className="w-3.5 h-3.5" />
                                  Proceso Hecho / Despacho ({item.procesos.length})
                                </span>
                                {item.procesos.length > 0 && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleUpdateItemField(
                                        item.id,
                                        "procesos",
                                        []
                                      )
                                    }
                                    className="text-[10px] font-bold text-slate-400 hover:text-rose-500"
                                  >
                                    Limpiar
                                  </button>
                                )}
                              </div>

                              <SearchableSelect
                                options={processCatalog.map((proc) => ({
                                  value: proc.label,
                                  label: proc.label,
                                  sublabel: proc.category,
                                }))}
                                value=""
                                placeholder="BUSCAR Y AÑADIR PROCESO..."
                                searchPlaceholder="Buscar..."
                                allowCustom={true}
                                onChange={(val) => {
                                  if (!item.procesos.includes(val)) {
                                    toggleItemProcess(item.id, val);
                                  }
                                }}
                              />

                              <div className="flex flex-wrap gap-1.5">
                                {processCatalog.map((proc) => {
                                  const active = item.procesos.includes(
                                    proc.label
                                  );
                                  return (
                                    <button
                                      key={proc.id}
                                      type="button"
                                      onClick={() =>
                                        toggleItemProcess(item.id, proc.label)
                                      }
                                      className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold border transition-all flex items-center gap-1 cursor-pointer uppercase ${
                                        active
                                          ? "bg-blue-600 border-blue-600 text-white shadow-sm shadow-blue-600/20"
                                          : "bg-[#F8FAFC] border-slate-200/80 text-slate-600 hover:border-blue-300 hover:text-blue-600"
                                      }`}
                                    >
                                      {active && <Check className="w-3 h-3" />}
                                      {proc.label}
                                    </button>
                                  );
                                })}

                                {item.procesos
                                  .filter(
                                    (p) =>
                                      !processCatalog.some(
                                        (cat) => cat.label === p
                                      )
                                  )
                                  .map((customP) => (
                                    <button
                                      key={customP}
                                      type="button"
                                      onClick={() =>
                                        toggleItemProcess(item.id, customP)
                                      }
                                      className="px-2.5 py-1.5 rounded-xl text-[11px] font-bold border bg-blue-600 border-blue-600 text-white flex items-center gap-1 uppercase"
                                    >
                                      <Check className="w-3 h-3" />
                                      {customP}
                                    </button>
                                  ))}
                              </div>
                            </div>

                            {/* MANUALIDADES / ACABADOS ARTESANALES */}
                            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 space-y-3">
                              <div className="flex items-center justify-between">
                                <span className="text-[11px] font-extrabold uppercase tracking-wider text-indigo-600 flex items-center gap-1.5">
                                  <Sparkles className="w-3.5 h-3.5" />
                                  Manualidades ({item.manualidades.length})
                                </span>
                                {item.manualidades.length > 0 && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleUpdateItemField(
                                        item.id,
                                        "manualidades",
                                        []
                                      )
                                    }
                                    className="text-[10px] font-bold text-slate-400 hover:text-rose-500"
                                  >
                                    Limpiar
                                  </button>
                                )}
                              </div>

                              <SearchableSelect
                                options={finishCatalog.map((fin) => ({
                                  value: fin.label,
                                  label: fin.label,
                                  sublabel: fin.category,
                                }))}
                                value=""
                                placeholder="BUSCAR Y AÑADIR MANUALIDAD..."
                                searchPlaceholder="Buscar..."
                                allowCustom={true}
                                onChange={(val) => {
                                  if (!item.manualidades.includes(val)) {
                                    toggleItemManualidad(item.id, val);
                                  }
                                }}
                              />

                              <div className="flex flex-wrap gap-1.5">
                                {finishCatalog.map((fin) => {
                                  const active = item.manualidades.includes(
                                    fin.label
                                  );
                                  return (
                                    <button
                                      key={fin.id}
                                      type="button"
                                      onClick={() =>
                                        toggleItemManualidad(item.id, fin.label)
                                      }
                                      className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold border transition-all flex items-center gap-1 cursor-pointer uppercase ${
                                        active
                                          ? "bg-indigo-600 border-indigo-600 text-white shadow-sm shadow-indigo-600/20"
                                          : "bg-[#F8FAFC] border-slate-200/80 text-slate-600 hover:border-indigo-300 hover:text-indigo-600"
                                      }`}
                                    >
                                      {active && <Check className="w-3 h-3" />}
                                      {fin.label}
                                    </button>
                                  );
                                })}

                                {item.manualidades
                                  .filter(
                                    (m) =>
                                      !finishCatalog.some(
                                        (cat) => cat.label === m
                                      )
                                  )
                                  .map((customM) => (
                                    <button
                                      key={customM}
                                      type="button"
                                      onClick={() =>
                                        toggleItemManualidad(item.id, customM)
                                      }
                                      className="px-2.5 py-1.5 rounded-xl text-[11px] font-bold border bg-indigo-600 border-indigo-600 text-white flex items-center gap-1 uppercase"
                                    >
                                      <Check className="w-3 h-3" />
                                      {customM}
                                    </button>
                                  ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}

                      <div className="pt-3 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={handleAddItem}
                          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#F8FAFC] hover:bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200/80 transition-colors cursor-pointer"
                        >
                          <Plus className="w-4 h-4 text-blue-600" />
                          Agregar Otro Lote
                        </button>
                      </div>
                    </div>
                  </section>

                {/* BOTÓN VER HOJA DE DESPACHO */}
                <div className="pt-6 pb-2 flex justify-center">
                  <button
                    type="button"
                    onClick={() => setDispatchViewMode("preview")}
                    className="inline-flex items-center justify-center gap-3 px-12 py-4 rounded-full bg-[#EEF4FF] hover:bg-blue-100 text-[#2563EB] font-bold text-sm tracking-wider uppercase shadow-sm hover:shadow-md transition-all cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
                  >
                    <Eye className="w-5 h-5 text-blue-600" />
                    <span>Ver Hoja de Despacho</span>
                  </button>
                </div>
              </div>
            </main>
          )}

          {/* VENTANA EMERGENTE: PREVISUALIZACIÓN DE DESPACHO CON HOJA A4 (IMAGEN 2) */}
          {dispatchViewMode === "preview" && (
            <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 lg:p-6 overflow-hidden animate-in fade-in duration-200">
              <div className="bg-white rounded-3xl shadow-2xl max-w-[1550px] w-full h-[94vh] max-h-[960px] flex flex-col md:flex-row overflow-hidden border border-slate-100">
                {/* PANEL IZQUIERDO: CONTROLES Y RESUMEN EXACTO A IMAGEN 2 */}
                <div className="w-full md:w-[380px] lg:w-[410px] p-7 lg:p-8 bg-white border-r border-slate-100 flex flex-col justify-between shrink-0 overflow-y-auto">
                  <div className="space-y-6">
                    {/* Cabecera de Previsualización (Imagen 2) */}
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/25 shrink-0">
                        <Eye className="w-7 h-7 stroke-[2.2]" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-tight">
                          Previsualización
                        </h2>
                        <div className="text-xs font-black uppercase tracking-wider text-slate-400 mt-1">
                          ORDEN {currentOrder.numeroOrden || "OP-1001"}
                        </div>
                      </div>
                    </div>

                    {/* Tarjeta: Resumen con formato de Imagen 2 y valores reales del despacho */}
                    <div className="bg-white rounded-[26px] p-7 border border-slate-200/80 shadow-sm space-y-2">
                      <span className="text-xs font-black uppercase tracking-wider text-slate-400 block">
                        RESUMEN DE PRENDAS
                      </span>
                      <div className="text-[38px] lg:text-[42px] font-black text-slate-900 tracking-tight leading-none my-1 flex items-baseline gap-2">
                        <span>{totalUnidades.toLocaleString("es-EC")}</span>
                        <span className="text-xl font-bold text-slate-400">UDS</span>
                      </div>
                      <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider block">
                        PRENDAS TOTALES A DESPACHAR
                      </span>
                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-500">
                        <span>Total Lotes:</span>
                        <span className="font-extrabold text-slate-900">
                          {currentOrder.items.length}{" "}
                          {currentOrder.items.length === 1 ? "Lote" : "Lotes"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                        <span>Cliente:</span>
                        <span className="font-extrabold text-slate-900 truncate max-w-[190px]">
                          {currentOrder.cliente.nombre || "Consumidor Final"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Acciones Inferiores del Panel (Imagen 2) */}
                  <div className="pt-6 space-y-4">
                    {/* Botón Principal: Confirmar y Guardar (Imagen 2) */}
                    <button
                      type="button"
                      onClick={() => {
                        handleSaveOrder(false);
                        setShowSavedSuccessModal(true);
                      }}
                      className="w-full py-4 px-6 rounded-2xl sm:rounded-[22px] bg-[#0B132B] hover:bg-slate-900 text-white flex items-center gap-4 shadow-xl shadow-slate-950/15 transition-all cursor-pointer group"
                    >
                      <ShieldCheck className="w-6 h-6 text-white stroke-[2.2] shrink-0" />
                      <div className="text-left">
                        <div className="text-[13px] font-black uppercase tracking-wider text-white leading-tight">
                          CONFIRMAR Y GUARDAR
                        </div>
                        <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mt-0.5">
                          REGISTRAR EN HISTORIAL
                        </div>
                      </div>
                    </button>

                    {/* Enlace para regresar al editor (Imagen 2) */}
                    <div className="pt-2 text-center">
                      <button
                        type="button"
                        onClick={() => setDispatchViewMode("form")}
                        className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors cursor-pointer py-2"
                      >
                        <X className="w-4 h-4 stroke-[2.5]" />
                        <span>REGRESAR AL EDITOR</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* COLUMNA DERECHA: NUESTRA HOJA A4 EXACTA VISIBLE DESDE EL INICIO */}
                <div className="flex-1 bg-[#EAEEF4] p-4 sm:p-6 lg:p-8 flex justify-center items-start overflow-y-auto">
                  <div className="origin-top my-4 transition-transform scale-[0.60] sm:scale-[0.70] md:scale-[0.76] lg:scale-[0.84] xl:scale-[0.88] shadow-2xl rounded-sm">
                    <ReceiptA4View
                      order={currentOrder}
                      company={company}
                      watermark={undefined}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* MODAL DE ÉXITO: ORDEN GUARDADA (FORMATO EXACTO IMAGEN 3) */}
          {showSavedSuccessModal && (
            <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white rounded-[32px] max-w-xl w-full p-8 sm:p-10 shadow-2xl border border-slate-100 text-center space-y-7 animate-in fade-in zoom-in duration-200">
                {/* Ícono de Check en cápsula verde claro como la imagen */}
                <div className="w-16 h-16 rounded-[22px] bg-[#E8F8F0] mx-auto flex items-center justify-center border border-emerald-100/60 shadow-sm">
                  <Check className="w-8 h-8 text-emerald-500 stroke-[3]" />
                </div>

                <div>
                  <h2 className="text-3xl font-black text-slate-900 tracking-tight">
                    ¡Orden Guardada!
                  </h2>
                  <div className="text-xs font-black text-blue-600 uppercase tracking-widest mt-1.5">
                    ORDEN: {currentOrder.numeroOrden || "OP-1001"}
                  </div>
                  <p className="text-xs text-slate-500 font-medium mt-2 max-w-sm mx-auto">
                    Seleccione el formato de reporte que desea descargar o imprimir:
                  </p>
                </div>

                {/* ÚNICAMENTE 2 OPCIONES: DESCARGAR PDF E IMPRIMIR ORDEN EN EL MISMO FORMATO */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      handleDownloadPDF(currentOrder);
                    }}
                    disabled={isGeneratingPDF}
                    className="p-7 rounded-[26px] bg-[#FBFDFF] border border-slate-200/80 hover:border-blue-500 hover:bg-blue-50/20 hover:shadow-lg transition-all flex flex-col items-center text-center gap-3 cursor-pointer group shadow-sm disabled:opacity-60"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-[#0F172A] text-white flex items-center justify-center group-hover:scale-105 transition-transform shadow-md shadow-slate-900/10">
                      {isGeneratingPDF ? (
                        <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <FileText className="w-7 h-7" />
                      )}
                    </div>
                    <div>
                      <div className="text-[13px] font-black uppercase text-slate-900 tracking-wider">
                        {isGeneratingPDF ? "GENERANDO PDF..." : "DESCARGAR PDF"}
                      </div>
                      <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mt-1">
                        HOJA DE RUTA OPERATIVA
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowSavedSuccessModal(false);
                      setTimeout(() => window.print(), 150);
                    }}
                    className="p-7 rounded-[26px] bg-[#FBFDFF] border border-slate-200/80 hover:border-blue-500 hover:bg-blue-50/20 hover:shadow-lg transition-all flex flex-col items-center text-center gap-3 cursor-pointer group shadow-sm"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-[#0F172A] text-white flex items-center justify-center group-hover:scale-105 transition-transform shadow-md shadow-slate-900/10">
                      <Printer className="w-7 h-7" />
                    </div>
                    <div>
                      <div className="text-[13px] font-black uppercase text-slate-900 tracking-wider">
                        IMPRIMIR ORDEN
                      </div>
                      <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mt-1">
                        IMPRESIÓN OPERATIVA
                      </div>
                    </div>
                  </button>
                </div>

                {/* ENLACE CREAR NUEVA ORDEN EXACTO A IMAGEN */}
                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setShowSavedSuccessModal(false);
                      handleNewBlankOrder();
                      setDispatchViewMode("form");
                    }}
                    className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-blue-600 transition-colors cursor-pointer py-1"
                  >
                    <PlusCircle className="w-4 h-4 stroke-[2.2]" />
                    <span>CREAR NUEVA ORDEN</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* =================================================================
              MODULE 3: PROCESOS DESPACHO (MISMO FORMATO EXACTO PROLAVTEX)
             ================================================================= */}
          {activeSection === "procesos-despacho" && (
            <main className="p-8 max-w-[1450px] w-full mx-auto space-y-7">
              {/* Top Header Row: Title + [Plantilla] [Cargar Excel] [Nuevo Proceso] */}
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h1 className="text-[26px] font-extrabold text-slate-900 tracking-tight">
                    Cartera de Procesos
                  </h1>
                  <p className="text-sm text-slate-500 font-medium mt-0.5">
                    Gestión de activos, procesos industriales y segmentación
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => handleDownloadCSVTemplate("procesos")}
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/80 shadow-sm text-xs font-bold transition-all cursor-pointer"
                  >
                    <FileDown className="w-4 h-4 text-blue-600 stroke-[2.5]" />
                    <span>Plantilla</span>
                  </button>

                  <label className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/80 shadow-sm text-xs font-bold transition-all cursor-pointer">
                    <FileUp className="w-4 h-4 text-emerald-600 stroke-[2.5]" />
                    <span>Cargar Excel</span>
                    <input
                      type="file"
                      accept=".csv,.xlsx,.xls"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleImportCSVFile("procesos", file);
                          e.target.value = "";
                        }
                      }}
                    />
                  </label>

                  <button
                    type="button"
                    onClick={() => {
                      setEditingProcessId(null);
                      setNewProcessForm({
                        label: "",
                        category: "LAVADO",
                        tipoPrenda:
                          garmentCatalog[0]?.label || "Pantalón Jean Caballero",
                        description: "",
                      });
                      setShowNewProcessForm(true);
                    }}
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/25 text-xs font-bold transition-all cursor-pointer"
                  >
                    <Plus className="w-4 h-4 stroke-[2.5]" />
                    <span>Nuevo Proceso</span>
                  </button>
                </div>
              </div>

              {/* 3 KPI Cards (Reducidas al tamaño compacto de la tercera imagen) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="bg-white rounded-3xl py-3.5 px-5 border border-slate-100 shadow-sm flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <FlaskConical className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-2xl font-extrabold text-slate-900 leading-none">
                      {processCatalog.length}
                    </div>
                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mt-1">
                      PROCESOS TOTALES
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-3xl py-3.5 px-5 border border-slate-100 shadow-sm flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <Activity className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-2xl font-extrabold text-slate-900 leading-none">
                      100%
                    </div>
                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mt-1">
                      TASA DE ACTIVIDAD
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-3xl py-3.5 px-5 border border-slate-100 shadow-sm flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center shrink-0">
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-2xl font-extrabold text-slate-900 leading-none">
                      VIP
                    </div>
                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mt-1">
                      SEGMENTACIÓN TOP
                    </div>
                  </div>
                </div>
              </div>

              {/* Search Bar Card */}
              <CatalogSearchBox
                value={globalSearch}
                onChange={setGlobalSearch}
                placeholder="Buscar..."
                items={processCatalog.map((p) => ({
                  id: p.id,
                  label: p.label,
                  sublabel: p.category,
                }))}
              />

              {/* Master Table */}
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      <th className="py-4 px-6">PROCESO</th>
                      <th className="py-4 px-6">CATEGORÍA</th>
                      <th className="py-4 px-6">TIPO DE PRENDA</th>
                      <th className="py-4 px-6">ESTADO</th>
                      <th className="py-4 px-6 text-right">ACCIONES</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100/80 text-xs">
                    {processCatalog
                      .filter(
                        (p) =>
                          !globalSearch.trim() ||
                          p.label
                            .toLowerCase()
                            .includes(globalSearch.toLowerCase()) ||
                          p.category
                            .toLowerCase()
                            .includes(globalSearch.toLowerCase()) ||
                          (p.tipoPrenda || "")
                            .toLowerCase()
                            .includes(globalSearch.toLowerCase())
                      )
                      .map((proc) => (
                        <tr
                          key={proc.id}
                          className="hover:bg-slate-50/70 transition-colors"
                        >
                          <td className="py-5 px-6">
                            <span className="font-bold text-[#1E293B] text-[13px] uppercase tracking-[-0.01em]">
                              {proc.label}
                            </span>
                          </td>
                          <td className="py-5 px-6">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
                              {proc.category}
                            </span>
                          </td>
                          <td className="py-5 px-6">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
                              {proc.tipoPrenda || "PANTALÓN JEAN CABALLERO"}
                            </span>
                          </td>
                          <td className="py-5 px-6">
                            <span className="inline-block px-2.5 py-1 rounded-md bg-[#ECFDF5] text-[#10B981] font-extrabold text-[10px] uppercase tracking-wider">
                              ACTIVO
                            </span>
                          </td>
                          <td className="py-5 px-6 text-right">
                            <div className="inline-flex items-center gap-3">
                              <button
                                type="button"
                                onClick={() => handleEditCatalogProcess(proc)}
                                title="Editar proceso"
                                className="p-1.5 rounded-lg text-[#94A3B8] hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  handleDeleteCatalogProcess(proc.id)
                                }
                                title="Eliminar proceso"
                                className="p-1.5 rounded-lg text-[#94A3B8] hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </main>
          )}

          {/* =================================================================
              MODULE 4: MANUALIDADES (MISMO FORMATO EXACTO PROLAVTEX)
             ================================================================= */}
          {activeSection === "manualidades" && (
            <main className="p-8 max-w-[1450px] w-full mx-auto space-y-7">
              {/* Top Header Row: Title + [Plantilla] [Cargar Excel] [Nueva Manualidad] */}
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h1 className="text-[26px] font-extrabold text-slate-900 tracking-tight">
                    Cartera de Manualidades
                  </h1>
                  <p className="text-sm text-slate-500 font-medium mt-0.5">
                    Gestión de activos, acabados artesanales y segmentación
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => handleDownloadCSVTemplate("manualidades")}
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/80 shadow-sm text-xs font-bold transition-all cursor-pointer"
                  >
                    <FileDown className="w-4 h-4 text-blue-600 stroke-[2.5]" />
                    <span>Plantilla</span>
                  </button>

                  <label className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/80 shadow-sm text-xs font-bold transition-all cursor-pointer">
                    <FileUp className="w-4 h-4 text-emerald-600 stroke-[2.5]" />
                    <span>Cargar Excel</span>
                    <input
                      type="file"
                      accept=".csv,.xlsx,.xls"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleImportCSVFile("manualidades", file);
                          e.target.value = "";
                        }
                      }}
                    />
                  </label>

                  <button
                    type="button"
                    onClick={() => {
                      setEditingFinishId(null);
                      setNewFinishForm({
                        label: "",
                        category: "MANUALIDAD SECO",
                        tipoPrenda:
                          garmentCatalog[0]?.label || "Pantalón Jean Caballero",
                        technique: "",
                      });
                      setShowNewFinishForm(true);
                    }}
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/25 text-xs font-bold transition-all cursor-pointer"
                  >
                    <Plus className="w-4 h-4 stroke-[2.5]" />
                    <span>Nueva Manualidad</span>
                  </button>
                </div>
              </div>

              {/* 3 KPI Cards (Reducidas al tamaño compacto de la tercera imagen) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="bg-white rounded-3xl py-3.5 px-5 border border-slate-100 shadow-sm flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-2xl font-extrabold text-slate-900 leading-none">
                      {finishCatalog.length}
                    </div>
                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mt-1">
                      MANUALIDADES TOTALES
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-3xl py-3.5 px-5 border border-slate-100 shadow-sm flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <Activity className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-2xl font-extrabold text-slate-900 leading-none">
                      100%
                    </div>
                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mt-1">
                      TASA DE ACTIVIDAD
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-3xl py-3.5 px-5 border border-slate-100 shadow-sm flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center shrink-0">
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-2xl font-extrabold text-slate-900 leading-none">
                      VIP
                    </div>
                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mt-1">
                      SEGMENTACIÓN TOP
                    </div>
                  </div>
                </div>
              </div>

              {/* Search Bar Card */}
              <CatalogSearchBox
                value={globalSearch}
                onChange={setGlobalSearch}
                placeholder="Buscar..."
                items={finishCatalog.map((f) => ({
                  id: f.id,
                  label: f.label,
                  sublabel: f.category,
                }))}
              />

              {/* Master Table */}
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      <th className="py-4 px-6">MANUALIDAD</th>
                      <th className="py-4 px-6">CATEGORÍA</th>
                      <th className="py-4 px-6">TIPO DE PRENDA</th>
                      <th className="py-4 px-6">ESTADO</th>
                      <th className="py-4 px-6 text-right">ACCIONES</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100/80 text-xs">
                    {finishCatalog
                      .filter(
                        (f) =>
                          !globalSearch.trim() ||
                          f.label
                            .toLowerCase()
                            .includes(globalSearch.toLowerCase()) ||
                          f.category
                            .toLowerCase()
                            .includes(globalSearch.toLowerCase()) ||
                          (f.tipoPrenda || "")
                            .toLowerCase()
                            .includes(globalSearch.toLowerCase())
                      )
                      .map((fin) => (
                        <tr
                          key={fin.id}
                          className="hover:bg-slate-50/70 transition-colors"
                        >
                          <td className="py-5 px-6">
                            <span className="font-bold text-[#1E293B] text-[13px] uppercase tracking-[-0.01em]">
                              {fin.label}
                            </span>
                          </td>
                          <td className="py-5 px-6">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
                              {fin.category}
                            </span>
                          </td>
                          <td className="py-5 px-6">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
                              {fin.tipoPrenda || "PANTALÓN JEAN CABALLERO"}
                            </span>
                          </td>
                          <td className="py-5 px-6">
                            <span className="inline-block px-2.5 py-1 rounded-md bg-[#ECFDF5] text-[#10B981] font-extrabold text-[10px] uppercase tracking-wider">
                              ACTIVO
                            </span>
                          </td>
                          <td className="py-5 px-6 text-right">
                            <div className="inline-flex items-center gap-3">
                              <button
                                type="button"
                                onClick={() => handleEditCatalogFinish(fin)}
                                title="Editar manualidad"
                                className="p-1.5 rounded-lg text-[#94A3B8] hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  handleDeleteCatalogFinish(fin.id)
                                }
                                title="Eliminar manualidad"
                                className="p-1.5 rounded-lg text-[#94A3B8] hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </main>
          )}

          {/* =================================================================
              MODULE 4B: TIPOS DE PRENDA (MISMO FORMATO EXACTO PROLAVTEX)
             ================================================================= */}
          {activeSection === "tipos-prenda" && (
            <main className="p-8 max-w-[1450px] w-full mx-auto space-y-7">
              {/* Top Header Row: Title + [Plantilla] [Cargar Excel] [Nueva Prenda] */}
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h1 className="text-[26px] font-extrabold text-slate-900 tracking-tight">
                    Cartera de Tipos de Prenda
                  </h1>
                  <p className="text-sm text-slate-500 font-medium mt-0.5">
                    Gestión de activos, centros de costo y segmentación
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => handleDownloadCSVTemplate("prendas")}
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/80 shadow-sm text-xs font-bold transition-all cursor-pointer"
                  >
                    <FileDown className="w-4 h-4 text-blue-600 stroke-[2.5]" />
                    <span>Plantilla</span>
                  </button>

                  <label className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/80 shadow-sm text-xs font-bold transition-all cursor-pointer">
                    <FileUp className="w-4 h-4 text-emerald-600 stroke-[2.5]" />
                    <span>Cargar Excel</span>
                    <input
                      type="file"
                      accept=".csv,.xlsx,.xls"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleImportCSVFile("prendas", file);
                          e.target.value = "";
                        }
                      }}
                    />
                  </label>

                  <button
                    type="button"
                    onClick={() => {
                      setEditingGarmentId(null);
                      setNewGarmentForm({
                        label: "",
                        category: "DENIM CABALLERO",
                        fabric: "Mezclilla Índigo 100% Algodón",
                        description: "",
                      });
                      setShowNewGarmentForm(true);
                    }}
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/25 text-xs font-bold transition-all cursor-pointer"
                  >
                    <Plus className="w-4 h-4 stroke-[2.5]" />
                    <span>Nueva Prenda</span>
                  </button>
                </div>
              </div>

              {/* 3 KPI Cards (Reducidas al tamaño compacto de la tercera imagen) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="bg-white rounded-3xl py-3.5 px-5 border border-slate-100 shadow-sm flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <Shirt className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-2xl font-extrabold text-slate-900 leading-none">
                      {garmentCatalog.length}
                    </div>
                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mt-1">
                      PRENDAS TOTALES
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-3xl py-3.5 px-5 border border-slate-100 shadow-sm flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <Activity className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-2xl font-extrabold text-slate-900 leading-none">
                      100%
                    </div>
                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mt-1">
                      TASA DE ACTIVIDAD
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-3xl py-3.5 px-5 border border-slate-100 shadow-sm flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center shrink-0">
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-2xl font-extrabold text-slate-900 leading-none">
                      VIP
                    </div>
                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mt-1">
                      SEGMENTACIÓN TOP
                    </div>
                  </div>
                </div>
              </div>

              {/* Search Bar Card */}
              <CatalogSearchBox
                value={globalSearch}
                onChange={setGlobalSearch}
                placeholder="Buscar..."
                items={garmentCatalog.map((g) => ({
                  id: g.id,
                  label: g.label,
                  sublabel: g.category,
                }))}
              />

              {/* Master Table (Mismo formato exacto que la captura) */}
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      <th className="py-4 px-6">PRENDA</th>
                      <th className="py-4 px-6">CATEGORÍA</th>
                      <th className="py-4 px-6">TEJIDO / COMPOSICIÓN</th>
                      <th className="py-4 px-6">ESTADO</th>
                      <th className="py-4 px-6 text-right">ACCIONES</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100/80 text-xs">
                    {garmentCatalog
                      .filter(
                        (g) =>
                          !globalSearch.trim() ||
                          g.label
                            .toLowerCase()
                            .includes(globalSearch.toLowerCase()) ||
                          g.category
                            .toLowerCase()
                            .includes(globalSearch.toLowerCase()) ||
                          g.fabric
                            .toLowerCase()
                            .includes(globalSearch.toLowerCase())
                      )
                      .map((gar) => (
                        <tr
                          key={gar.id}
                          className="hover:bg-slate-50/70 transition-colors"
                        >
                          <td className="py-5 px-6">
                            <span className="font-bold text-[#1E293B] text-[13px] uppercase tracking-[-0.01em]">
                              {gar.label}
                            </span>
                          </td>
                          <td className="py-5 px-6">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
                              {gar.category}
                            </span>
                          </td>
                          <td className="py-5 px-6">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
                              {gar.fabric}
                            </span>
                          </td>
                          <td className="py-5 px-6">
                            <span className="inline-block px-2.5 py-1 rounded-md bg-[#ECFDF5] text-[#10B981] font-extrabold text-[10px] uppercase tracking-wider">
                              ACTIVO
                            </span>
                          </td>
                          <td className="py-5 px-6 text-right">
                            <div className="inline-flex items-center gap-3">
                              <button
                                type="button"
                                onClick={() => handleEditCatalogGarment(gar)}
                                title="Editar tipo de prenda"
                                className="p-1.5 rounded-lg text-[#94A3B8] hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  handleDeleteCatalogGarment(gar.id)
                                }
                                title="Eliminar tipo de prenda"
                                className="p-1.5 rounded-lg text-[#94A3B8] hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </main>
          )}

          {/* =================================================================
              MODULE 4C: ENCARGADOS / RESPONSABLES DE DESPACHO (FORMATO EXACTO)
             ================================================================= */}
          {activeSection === "encargados" && (
            <main className="p-8 max-w-[1450px] w-full mx-auto space-y-7">
              {/* Top Header Row: Title + [Plantilla] [Cargar Excel] [+ Nuevo Encargado] */}
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h1 className="text-[26px] font-extrabold text-slate-900 tracking-tight">
                    Cartera de Encargados
                  </h1>
                  <p className="text-sm text-slate-500 font-medium mt-0.5">
                    Gestión de responsables que despachan, cargos de planta y control
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => handleDownloadCSVTemplate("encargados")}
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/80 shadow-sm text-xs font-bold transition-all cursor-pointer"
                  >
                    <FileDown className="w-4 h-4 text-blue-600 stroke-[2.5]" />
                    <span>Plantilla</span>
                  </button>

                  <label className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/80 shadow-sm text-xs font-bold transition-all cursor-pointer">
                    <FileUp className="w-4 h-4 text-emerald-600 stroke-[2.5]" />
                    <span>Cargar Excel</span>
                    <input
                      type="file"
                      accept=".csv,.xlsx,.xls"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleImportCSVFile("encargados", file);
                          e.target.value = "";
                        }
                      }}
                    />
                  </label>

                  <button
                    type="button"
                    onClick={() => {
                      setEditingDispatcherId(null);
                      setNewDispatcherForm({
                        nombre: "",
                        cargo: "BODEGUERO",
                        telefono: "",
                      });
                      setShowNewDispatcherForm(true);
                    }}
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/25 text-xs font-bold transition-all cursor-pointer"
                  >
                    <Plus className="w-4 h-4 stroke-[2.5]" />
                    <span>Nuevo Encargado</span>
                  </button>
                </div>
              </div>

              {/* 3 KPI Cards (Reducidas al tamaño compacto de la tercera imagen) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="bg-white rounded-3xl py-3.5 px-5 border border-slate-100 shadow-sm flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <UserCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-2xl font-extrabold text-slate-900 leading-none">
                      {dispatcherCatalog.length}
                    </div>
                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mt-1">
                      ENCARGADOS TOTALES
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-3xl py-3.5 px-5 border border-slate-100 shadow-sm flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <Activity className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-2xl font-extrabold text-slate-900 leading-none">
                      100%
                    </div>
                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mt-1">
                      TASA DE ACTIVIDAD
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-3xl py-3.5 px-5 border border-slate-100 shadow-sm flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center shrink-0">
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-2xl font-extrabold text-slate-900 leading-none">
                      VIP
                    </div>
                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mt-1">
                      PERSONAL PLANTA
                    </div>
                  </div>
                </div>
              </div>

              {/* Search Bar Card */}
              <CatalogSearchBox
                value={globalSearch}
                onChange={setGlobalSearch}
                placeholder="Buscar..."
                items={dispatcherCatalog.map((d) => ({
                  id: d.id,
                  label: d.nombre,
                  sublabel: d.cargo,
                }))}
              />

              {/* Master Table (Mismo formato exacto que la captura de Carlos Uriña / Israel Flores) */}
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      <th className="py-4 px-6">ENCARGADO / RESPONSABLE</th>
                      <th className="py-4 px-6">CARGO / ÁREA</th>
                      <th className="py-4 px-6">ESTADO</th>
                      <th className="py-4 px-6 text-right">ACCIONES</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100/80 text-xs">
                    {dispatcherCatalog
                      .filter(
                        (d) =>
                          !globalSearch.trim() ||
                          d.nombre
                            .toLowerCase()
                            .includes(globalSearch.toLowerCase()) ||
                          d.cargo
                            .toLowerCase()
                            .includes(globalSearch.toLowerCase())
                      )
                      .map((disp) => (
                        <tr
                          key={disp.id}
                          className="hover:bg-slate-50/70 transition-colors"
                        >
                          <td className="py-5 px-6">
                            <span className="font-bold text-[#1E293B] text-[13px] uppercase tracking-[-0.01em]">
                              {disp.nombre}
                            </span>
                          </td>
                          <td className="py-5 px-6">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
                              {disp.cargo}
                            </span>
                          </td>
                          <td className="py-5 px-6">
                            <span className="inline-block px-2.5 py-1 rounded-md bg-[#ECFDF5] text-[#10B981] font-extrabold text-[10px] uppercase tracking-wider">
                              ACTIVO
                            </span>
                          </td>
                          <td className="py-5 px-6 text-right">
                            <div className="inline-flex items-center gap-3">
                              <button
                                type="button"
                                onClick={() =>
                                  handleEditCatalogDispatcher(disp)
                                }
                                title="Editar encargado"
                                className="p-1.5 rounded-lg text-[#94A3B8] hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  handleDeleteCatalogDispatcher(disp.id)
                                }
                                title="Eliminar encargado"
                                className="p-1.5 rounded-lg text-[#94A3B8] hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </main>
          )}

          {/* =================================================================
              MODULE 5: CARTERA DE CLIENTES (IDÉNTICO A LA CAPTURA SUBIDA)
             ================================================================= */}
          {activeSection === "clientes" && (
            <main className="p-8 max-w-[1450px] w-full mx-auto space-y-7">
              {/* Top Header Row: Title + [Plantilla] [Cargar Excel] [+ Nuevo Cliente] */}
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h1 className="text-[26px] font-extrabold text-slate-900 tracking-tight">
                    Cartera de Clientes
                  </h1>
                  <p className="text-sm text-slate-500 font-medium mt-0.5">
                    Gestión de activos, centros de costo y segmentación
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => handleDownloadCSVTemplate("clientes")}
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/80 shadow-sm text-xs font-bold transition-all cursor-pointer"
                  >
                    <FileDown className="w-4 h-4 text-blue-600 stroke-[2.5]" />
                    <span>Plantilla</span>
                  </button>

                  <label className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/80 shadow-sm text-xs font-bold transition-all cursor-pointer">
                    <FileUp className="w-4 h-4 text-emerald-600 stroke-[2.5]" />
                    <span>Cargar Excel</span>
                    <input
                      type="file"
                      accept=".csv,.xlsx,.xls"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleImportCSVFile("clientes", file);
                          e.target.value = "";
                        }
                      }}
                    />
                  </label>

                  <button
                    type="button"
                    onClick={() => {
                      setEditingClientId(null);
                      setNewClientForm({
                        nombre: "",
                        rucCedula: "",
                        telefono: "",
                        direccion: "",
                      });
                      setShowClientModalInDirectory((v) => !v);
                    }}
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/25 text-xs font-bold transition-all cursor-pointer"
                  >
                    <Plus className="w-4 h-4 stroke-[2.5]" />
                    <span>Nuevo Cliente</span>
                  </button>
                </div>
              </div>

              {/* 3 KPI Cards (Reducidas al tamaño compacto de la tercera imagen) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="bg-white rounded-3xl py-3.5 px-5 border border-slate-100 shadow-sm flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-2xl font-extrabold text-slate-900 leading-none">
                      {clients.length}
                    </div>
                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mt-1">
                      CLIENTES TOTALES
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-3xl py-3.5 px-5 border border-slate-100 shadow-sm flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <Activity className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-2xl font-extrabold text-slate-900 leading-none">
                      {dashboardAnalytics.activeClientsRate}%
                    </div>
                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mt-1">
                      TASA DE ACTIVIDAD
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-3xl py-3.5 px-5 border border-slate-100 shadow-sm flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center shrink-0">
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-2xl font-extrabold text-slate-900 leading-none">
                      VIP
                    </div>
                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mt-1">
                      SEGMENTACIÓN TOP
                    </div>
                  </div>
                </div>
              </div>

              {/* Search Bar Card (EXACT PLACEHOLDER FROM SCREENSHOT) */}
              <CatalogSearchBox
                value={globalSearch}
                onChange={setGlobalSearch}
                placeholder="Buscar..."
                items={clients.map((c) => ({
                  id: c.id,
                  label: c.nombre,
                  sublabel: `RUC: ${c.rucCedula}`,
                }))}
              />

              {/* Master Table (EXACT COLUMNS FROM SCREENSHOT: CLIENTE, CONTACTO, UBICACIÓN, ESTADO, ACCIONES) */}
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      <th className="py-4 px-6">CLIENTE</th>
                      <th className="py-4 px-6">CONTACTO</th>
                      <th className="py-4 px-6">UBICACIÓN</th>
                      <th className="py-4 px-6">ESTADO</th>
                      <th className="py-4 px-6 text-right">ACCIONES</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100/80 text-xs">
                    {clients
                      .filter(
                        (c) =>
                          !globalSearch.trim() ||
                          c.nombre
                            .toLowerCase()
                            .includes(globalSearch.toLowerCase()) ||
                          c.rucCedula
                            .toLowerCase()
                            .includes(globalSearch.toLowerCase()) ||
                          c.direccion
                            .toLowerCase()
                            .includes(globalSearch.toLowerCase())
                      )
                      .map((cli) => (
                        <tr
                          key={cli.id}
                          className="hover:bg-slate-50/70 transition-colors"
                        >
                          <td className="py-5 px-6">
                            <span className="font-bold text-[#1E293B] text-[13px] uppercase tracking-[-0.01em] block">
                              {cli.nombre}
                            </span>
                            <span className="text-[10.5px] font-semibold uppercase tracking-wider text-[#94A3B8] mt-0.5 block">
                              RUC: {cli.rucCedula}
                            </span>
                          </td>
                          <td className="py-5 px-6">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
                              {cli.telefono}
                            </span>
                          </td>
                          <td className="py-5 px-6">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] line-clamp-1">
                              {cli.direccion}
                            </span>
                          </td>
                          <td className="py-5 px-6">
                            <span className="inline-block px-2.5 py-1 rounded-md bg-[#ECFDF5] text-[#10B981] font-extrabold text-[10px] uppercase tracking-wider">
                              ACTIVO
                            </span>
                          </td>
                          <td className="py-5 px-6 text-right">
                            <div className="inline-flex items-center gap-3">
                              <button
                                type="button"
                                onClick={() => handleEditDirectoryClient(cli)}
                                title="Editar cliente"
                                className="p-1.5 rounded-lg text-[#94A3B8] hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  handleDeleteDirectoryClient(cli.id)
                                }
                                title="Eliminar cliente"
                                className="p-1.5 rounded-lg text-[#94A3B8] hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </main>
          )}

          {/* =================================================================
              MODULE 6: HISTORIAL DE ÓRDENES DE DESPACHO (MISMO FORMATO Y FUENTE)
             ================================================================= */}
          {activeSection === "historial" && (
            <main className="p-8 max-w-[1450px] w-full mx-auto space-y-7">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h1 className="text-[26px] font-extrabold text-slate-900 tracking-tight leading-tight">
                    Historial de Ordenes
                  </h1>
                  <p className="text-sm text-slate-500 font-medium mt-0.5">
                    Registro y trazabilidad de procesos ejecutados
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleExportOrdersToExcel(filteredHistorialOrders)}
                  className="inline-flex items-center gap-2.5 px-6 py-3 rounded-full bg-[#2563EB] hover:bg-blue-700 text-white shadow-lg shadow-blue-600/25 text-xs font-black uppercase tracking-wider transition-all cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
                >
                  <FileSpreadsheet className="w-4 h-4 stroke-[2.2]" />
                  <span>EXPORTAR EXCEL</span>
                </button>
              </div>

              {/* 3 KPI Cards (Reducidas al tamaño compacto de la tercera imagen) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="bg-white rounded-3xl py-3.5 px-5 border border-slate-100 shadow-sm flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <History className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-2xl font-extrabold text-slate-900 leading-none">
                      {filteredHistorialOrders.length}
                    </div>
                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mt-1">
                      ÓRDENES EN FILTRO
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-3xl py-3.5 px-5 border border-slate-100 shadow-sm flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <Activity className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-2xl font-extrabold text-slate-900 leading-none">
                      {filteredHistorialOrders
                        .reduce(
                          (sum, ord) =>
                            sum +
                            ord.items.reduce(
                              (acc, i) => acc + (Number(i.cantidad) || 0),
                              0
                            ),
                          0
                        )
                        .toLocaleString("es-EC")}
                    </div>
                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mt-1">
                      PRENDAS EN FILTRO
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-3xl py-3.5 px-5 border border-slate-100 shadow-sm flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center shrink-0">
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-2xl font-extrabold text-slate-900 leading-none">
                      {savedOrders.length}
                    </div>
                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mt-1">
                      TOTAL HISTÓRICO
                    </div>
                  </div>
                </div>
              </div>

              {/* Buscador Integrado con Rango de Fechas (Calendario) exacto a la imagen */}
              <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-100 shadow-sm flex flex-col md:flex-row items-center gap-3.5">
                <div className="relative flex-1 w-full">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={globalSearch}
                    onChange={(e) => setGlobalSearch(e.target.value)}
                    placeholder="Buscar por Nº orden o cliente..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white border border-slate-200/90 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                  {globalSearch && (
                    <button
                      type="button"
                      onClick={() => setGlobalSearch("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2.5 shrink-0 w-full md:w-auto">
                  <input
                    type="date"
                    value={historialStartDate}
                    onChange={(e) => setHistorialStartDate(e.target.value)}
                    title="Fecha Desde"
                    className="px-3.5 py-2.5 rounded-2xl bg-white border border-slate-200/90 text-xs text-slate-700 focus:outline-none focus:border-blue-500 font-medium cursor-pointer"
                  />
                  <span className="text-xs font-black uppercase text-slate-400 px-1">
                    A
                  </span>
                  <input
                    type="date"
                    value={historialEndDate}
                    onChange={(e) => setHistorialEndDate(e.target.value)}
                    title="Fecha Hasta"
                    className="px-3.5 py-2.5 rounded-2xl bg-white border border-slate-200/90 text-xs text-slate-700 focus:outline-none focus:border-blue-500 font-medium cursor-pointer"
                  />
                  {(historialStartDate || historialEndDate) && (
                    <button
                      type="button"
                      onClick={() => {
                        setHistorialStartDate("");
                        setHistorialEndDate("");
                      }}
                      className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-500 transition-colors cursor-pointer"
                    >
                      Limpiar
                    </button>
                  )}
                </div>
              </div>

              {/* Master Table (Misma fuente y diseño exacto que la captura) */}
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      <th className="py-4 px-6">ORDEN / CLIENTE</th>
                      <th className="py-4 px-6">LOTES / PRENDAS</th>
                      <th className="py-4 px-6">FECHA EMISIÓN</th>
                      <th className="py-4 px-6">ESTADO</th>
                      <th className="py-4 px-6 text-right">ACCIONES</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100/80 text-xs">
                    {filteredHistorialOrders.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="py-12 text-center text-slate-400 font-medium text-xs"
                        >
                          No se encontraron órdenes registradas en el rango o búsqueda seleccionada.
                        </td>
                      </tr>
                    ) : (
                      filteredHistorialOrders.map((ord) => {
                        const totalQty = ord.items.reduce(
                          (acc, i) => acc + (Number(i.cantidad) || 0),
                          0
                        );
                        return (
                          <tr
                            key={ord.id}
                            className="hover:bg-slate-50/70 transition-colors"
                          >
                            <td className="py-5 px-6">
                              <span className="font-bold text-[#1E293B] text-[13px] uppercase tracking-[-0.01em] block">
                                {ord.numeroOrden} &mdash; {ord.cliente.nombre}
                              </span>
                              <span className="text-[10.5px] font-semibold uppercase tracking-wider text-[#94A3B8] mt-0.5 block">
                                RUC: {ord.cliente.rucCedula} &bull; DESPACHA:{" "}
                                {ord.despachadoPor || "ENCARGADO"}
                              </span>
                            </td>
                            <td className="py-5 px-6">
                              <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
                                {ord.items.length} LOTES &bull;{" "}
                                {totalQty.toLocaleString("es-EC")} PRENDAS
                              </span>
                            </td>
                            <td className="py-5 px-6">
                              <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
                                {ord.fecha}
                              </span>
                            </td>
                            <td className="py-5 px-6">
                              <span className="inline-block px-2.5 py-1 rounded-md bg-[#ECFDF5] text-[#10B981] font-extrabold text-[10px] uppercase tracking-wider">
                                ACTIVO
                              </span>
                            </td>
                            <td className="py-5 px-6 text-right">
                              <div className="inline-flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setCurrentOrder(ord);
                                    setDashboardPreviewOrder(ord);
                                  }}
                                  title="Ver Vista Previa A4"
                                  className="w-9 h-9 rounded-2xl bg-slate-100/90 hover:bg-blue-50 text-slate-500 hover:text-blue-600 flex items-center justify-center transition-all cursor-pointer shadow-sm shadow-slate-200/50"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteOrder(ord.id)}
                                  title="Eliminar Orden"
                                  className="w-9 h-9 rounded-2xl hover:bg-rose-50 text-slate-400 hover:text-rose-600 flex items-center justify-center transition-all cursor-pointer"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      }))}
                  </tbody>
                </table>
              </div>
            </main>
          )}

          {/* =================================================================
              MODULE 7: CONFIGURACIÓN CORPORATIVA DE LA PLANTA
             ================================================================= */}
          {activeSection === "configuracion" && (
            <main className="p-8 max-w-[900px] w-full mx-auto space-y-6">
              <div>
                <h1 className="text-[26px] font-extrabold text-slate-900 tracking-tight">
                  Configuración de Planta (Cabecera A4)
                </h1>
                <p className="text-sm text-slate-500 font-medium">
                  Personalice los datos corporativos que aparecen en las dos
                  mitades del recibo A4
                </p>
              </div>

              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Razón Social / Nombre de la Lavandería
                  </label>
                  <input
                    type="text"
                    value={company.nombre}
                    onChange={(e) =>
                      saveCompanyToStorage({
                        ...company,
                        nombre: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2.5 rounded-xl bg-[#F8FAFC] border border-slate-200 text-xs font-bold text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Subtítulo / Especialidad Industrial
                  </label>
                  <input
                    type="text"
                    value={company.subtitulo}
                    onChange={(e) =>
                      saveCompanyToStorage({
                        ...company,
                        subtitulo: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2.5 rounded-xl bg-[#F8FAFC] border border-slate-200 text-xs text-slate-800"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                      RUC de la Empresa
                    </label>
                    <input
                      type="text"
                      value={company.ruc}
                      onChange={(e) =>
                        saveCompanyToStorage({
                          ...company,
                          ruc: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2.5 rounded-xl bg-[#F8FAFC] border border-slate-200 text-xs font-mono text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                      Línea / Planta
                    </label>
                    <input
                      type="text"
                      value={company.planta}
                      onChange={(e) =>
                        saveCompanyToStorage({
                          ...company,
                          planta: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2.5 rounded-xl bg-[#F8FAFC] border border-slate-200 text-xs font-mono text-slate-800"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Dirección Física de Planta
                  </label>
                  <input
                    type="text"
                    value={company.direccion}
                    onChange={(e) =>
                      saveCompanyToStorage({
                        ...company,
                        direccion: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2.5 rounded-xl bg-[#F8FAFC] border border-slate-200 text-xs text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Teléfonos de Contacto
                  </label>
                  <input
                    type="text"
                    value={company.telefono}
                    onChange={(e) =>
                      setCompany({
                        ...company,
                        telefono: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2.5 rounded-xl bg-[#F8FAFC] border border-slate-200 text-xs font-mono text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Correo Electrónico
                  </label>
                  <input
                    type="email"
                    value={company.email}
                    onChange={(e) =>
                      setCompany({
                        ...company,
                        email: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2.5 rounded-xl bg-[#F8FAFC] border border-slate-200 text-xs text-slate-800"
                  />
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={handleSaveCompany}
                    className="px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-blue-600/25 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isSaving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    <span>Guardar Configuración en Supabase</span>
                  </button>
                </div>
              </div>
            </main>
          )}
          {/* =================================================================
              VENTANAS EMERGENTES (MODALES ESTILO PROLAVTEX) PARA CREAR/EDITAR:
              1. CLIENTES
              2. PROCESOS DE DESPACHO
              3. MANUALIDADES / ACABADOS
             ================================================================= */}

          {/* 1. MODAL EMERGENTE: NUEVO / EDITAR CLIENTE */}
          {showClientModalInDirectory && (
            <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white rounded-[32px] max-w-[460px] w-full p-8 shadow-2xl relative border border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowClientModalInDirectory(false);
                    setEditingClientId(null);
                  }}
                  className="absolute top-7 right-7 text-slate-300 hover:text-slate-500 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5 stroke-[2.5]" />
                </button>

                <div className="flex items-center gap-4 mb-7">
                  <div className="w-14 h-14 rounded-[20px] bg-blue-600 shadow-lg shadow-blue-600/30 flex items-center justify-center text-white shrink-0">
                    <Building2 className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="text-[22px] font-black text-slate-900 tracking-tight leading-none">
                      {editingClientId ? "Editar Cliente" : "Nuevo Cliente"}
                    </h3>
                    <span className="text-[10.5px] font-extrabold uppercase tracking-[0.12em] text-slate-400 block mt-1.5">
                      GESTIÓN DE CARTERA Y DESPACHOS
                    </span>
                  </div>
                </div>

                <form onSubmit={handleCreateQuickClient} className="space-y-5">
                  <div>
                    <label className="block text-[10.5px] font-extrabold uppercase tracking-[0.08em] text-slate-400 mb-2">
                      RAZÓN SOCIAL / EMPRESA
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. Confecciones Denim Andino S.A."
                      value={newClientForm.nombre}
                      onChange={(e) =>
                        setNewClientForm((prev) => ({
                          ...prev,
                          nombre: e.target.value,
                        }))
                      }
                      className="w-full px-5 py-4 rounded-2xl bg-[#F4F7FA] border border-transparent text-sm font-semibold text-slate-800 placeholder:text-slate-400/90 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-[10.5px] font-extrabold uppercase tracking-[0.08em] text-slate-400 mb-2">
                        RUC / CÉDULA
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="1791402981001"
                        value={newClientForm.rucCedula}
                        onChange={(e) =>
                          setNewClientForm((prev) => ({
                            ...prev,
                            rucCedula: e.target.value,
                          }))
                        }
                        className="w-full px-5 py-4 rounded-2xl bg-[#F4F7FA] border border-transparent text-sm font-semibold text-slate-800 placeholder:text-slate-400/90 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-[10.5px] font-extrabold uppercase tracking-[0.08em] text-slate-400 mb-2">
                        TELÉFONO
                      </label>
                      <input
                        type="text"
                        placeholder="+593 99 ..."
                        value={newClientForm.telefono}
                        onChange={(e) =>
                          setNewClientForm((prev) => ({
                            ...prev,
                            telefono: e.target.value,
                          }))
                        }
                        className="w-full px-5 py-4 rounded-2xl bg-[#F4F7FA] border border-transparent text-sm font-semibold text-slate-800 placeholder:text-slate-400/90 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10.5px] font-extrabold uppercase tracking-[0.08em] text-slate-400 mb-2">
                      DIRECCIÓN / OFICINA
                    </label>
                    <div className="relative">
                      <MapPin className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Calle, Número, Ciudad..."
                        value={newClientForm.direccion}
                        onChange={(e) =>
                          setNewClientForm((prev) => ({
                            ...prev,
                            direccion: e.target.value,
                          }))
                        }
                        className="w-full pl-11 pr-5 py-4 rounded-2xl bg-[#F4F7FA] border border-transparent text-sm font-semibold text-slate-800 placeholder:text-slate-400/90 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-12 gap-3.5 pt-3">
                    <button
                      type="button"
                      onClick={() => {
                        setShowClientModalInDirectory(false);
                        setEditingClientId(null);
                      }}
                      className="col-span-4 py-4 rounded-2xl bg-[#F4F7FA] hover:bg-slate-200/70 text-[11px] font-extrabold uppercase tracking-wider text-slate-500 transition-colors cursor-pointer"
                    >
                      CANCELAR
                    </button>
                    <button
                      type="submit"
                      className="col-span-8 py-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/30 text-[11px] font-extrabold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>
                        {editingClientId
                          ? "GUARDAR CAMBIOS"
                          : "REGISTRAR CLIENTE"}
                      </span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* 2. MODAL EMERGENTE: NUEVO / EDITAR PROCESO DE DESPACHO (FORMATO IDÉNTICO AL RESTO) */}
          {showNewProcessForm && (
            <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white rounded-[32px] max-w-[460px] w-full p-8 shadow-2xl relative border border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowNewProcessForm(false);
                    setEditingProcessId(null);
                  }}
                  className="absolute top-7 right-7 text-slate-300 hover:text-slate-500 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5 stroke-[2.5]" />
                </button>

                <div className="flex items-center gap-4 mb-7">
                  <div className="w-14 h-14 rounded-[20px] bg-blue-600 shadow-lg shadow-blue-600/30 flex items-center justify-center text-white shrink-0">
                    <FlaskConical className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="text-[22px] font-black text-slate-900 tracking-tight leading-none">
                      {editingProcessId ? "Editar Proceso" : "Nuevo Proceso"}
                    </h3>
                    <span className="text-[10.5px] font-extrabold uppercase tracking-[0.12em] text-slate-400 block mt-1.5">
                      GESTIÓN DE PROCESOS INDUSTRIALES
                    </span>
                  </div>
                </div>

                <form
                  onSubmit={handleSaveCatalogProcess}
                  className="space-y-5"
                >
                  <div>
                    <label className="block text-[10.5px] font-extrabold uppercase tracking-[0.08em] text-slate-400 mb-2">
                      NOMBRE DEL PROCESO INDUSTRIAL
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. Lavado Enzimático / Deslavado"
                      value={newProcessForm.label}
                      onChange={(e) =>
                        setNewProcessForm((prev) => ({
                          ...prev,
                          label: e.target.value,
                        }))
                      }
                      className="w-full px-5 py-4 rounded-2xl bg-[#F4F7FA] border border-transparent text-sm font-semibold text-slate-800 placeholder:text-slate-400/90 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-[10.5px] font-extrabold uppercase tracking-[0.08em] text-slate-400 mb-2">
                        CATEGORÍA
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ej. LAVADO"
                        value={newProcessForm.category}
                        onChange={(e) =>
                          setNewProcessForm((prev) => ({
                            ...prev,
                            category: e.target.value,
                          }))
                        }
                        className="w-full px-5 py-4 rounded-2xl bg-[#F4F7FA] border border-transparent text-sm font-semibold text-slate-800 placeholder:text-slate-400/90 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-[10.5px] font-extrabold uppercase tracking-[0.08em] text-slate-400 mb-2">
                        TIPO DE PRENDA
                      </label>
                      <SearchableSelect
                        options={garmentCatalog.map((g) => ({
                          value: g.label,
                          label: g.label,
                          sublabel: g.category,
                        }))}
                        value={newProcessForm.tipoPrenda}
                        placeholder="SELECCIONAR..."
                        searchPlaceholder="Buscar..."
                        allowCustom={true}
                        onChange={(val) =>
                          setNewProcessForm((prev) => ({
                            ...prev,
                            tipoPrenda: val,
                          }))
                        }
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10.5px] font-extrabold uppercase tracking-[0.08em] text-slate-400 mb-2">
                      DESCRIPCIÓN / OBSERVACIÓN
                    </label>
                    <div className="relative">
                      <FileText className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Detalle del proceso para el despacho..."
                        value={newProcessForm.description}
                        onChange={(e) =>
                          setNewProcessForm((prev) => ({
                            ...prev,
                            description: e.target.value,
                          }))
                        }
                        className="w-full pl-11 pr-5 py-4 rounded-2xl bg-[#F4F7FA] border border-transparent text-sm font-semibold text-slate-800 placeholder:text-slate-400/90 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-12 gap-3.5 pt-3">
                    <button
                      type="button"
                      onClick={() => {
                        setShowNewProcessForm(false);
                        setEditingProcessId(null);
                      }}
                      className="col-span-4 py-4 rounded-2xl bg-[#F4F7FA] hover:bg-slate-200/70 text-[11px] font-extrabold uppercase tracking-wider text-slate-500 transition-colors cursor-pointer"
                    >
                      CANCELAR
                    </button>
                    <button
                      type="submit"
                      className="col-span-8 py-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/30 text-[11px] font-extrabold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>
                        {editingProcessId
                          ? "GUARDAR CAMBIOS"
                          : "REGISTRAR PROCESO"}
                      </span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* 3. MODAL EMERGENTE: NUEVA / EDITAR MANUALIDAD (FORMATO IDÉNTICO AL RESTO) */}
          {showNewFinishForm && (
            <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white rounded-[32px] max-w-[460px] w-full p-8 shadow-2xl relative border border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowNewFinishForm(false);
                    setEditingFinishId(null);
                  }}
                  className="absolute top-7 right-7 text-slate-300 hover:text-slate-500 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5 stroke-[2.5]" />
                </button>

                <div className="flex items-center gap-4 mb-7">
                  <div className="w-14 h-14 rounded-[20px] bg-blue-600 shadow-lg shadow-blue-600/30 flex items-center justify-center text-white shrink-0">
                    <Sparkles className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="text-[22px] font-black text-slate-900 tracking-tight leading-none">
                      {editingFinishId
                        ? "Editar Manualidad"
                        : "Nueva Manualidad"}
                    </h3>
                    <span className="text-[10.5px] font-extrabold uppercase tracking-[0.12em] text-slate-400 block mt-1.5">
                      GESTIÓN DE ACABADOS ARTESANALES
                    </span>
                  </div>
                </div>

                <form onSubmit={handleSaveCatalogFinish} className="space-y-5">
                  <div>
                    <label className="block text-[10.5px] font-extrabold uppercase tracking-[0.08em] text-slate-400 mb-2">
                      NOMBRE DE LA MANUALIDAD / ACABADO
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. Bigotes (Whiskers) / Lijado Localizado"
                      value={newFinishForm.label}
                      onChange={(e) =>
                        setNewFinishForm((prev) => ({
                          ...prev,
                          label: e.target.value,
                        }))
                      }
                      className="w-full px-5 py-4 rounded-2xl bg-[#F4F7FA] border border-transparent text-sm font-semibold text-slate-800 placeholder:text-slate-400/90 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-[10.5px] font-extrabold uppercase tracking-[0.08em] text-slate-400 mb-2">
                        CATEGORÍA / ÁREA
                      </label>
                      <input
                        type="text"
                        placeholder="MANUALIDAD SECO"
                        value={newFinishForm.category}
                        onChange={(e) =>
                          setNewFinishForm((prev) => ({
                            ...prev,
                            category: e.target.value,
                          }))
                        }
                        className="w-full px-5 py-4 rounded-2xl bg-[#F4F7FA] border border-transparent text-sm font-semibold text-slate-800 placeholder:text-slate-400/90 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-[10.5px] font-extrabold uppercase tracking-[0.08em] text-slate-400 mb-2">
                        TIPO DE PRENDA
                      </label>
                      <SearchableSelect
                        options={garmentCatalog.map((g) => ({
                          value: g.label,
                          label: g.label,
                          sublabel: g.category,
                        }))}
                        value={newFinishForm.tipoPrenda}
                        placeholder="SELECCIONAR..."
                        searchPlaceholder="Buscar..."
                        allowCustom={true}
                        onChange={(val) =>
                          setNewFinishForm((prev) => ({
                            ...prev,
                            tipoPrenda: val,
                          }))
                        }
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10.5px] font-extrabold uppercase tracking-[0.08em] text-slate-400 mb-2">
                      TÉCNICA / APLICACIÓN
                    </label>
                    <div className="relative">
                      <FileText className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Ej. Marcado con molde polimérico y lija..."
                        value={newFinishForm.technique}
                        onChange={(e) =>
                          setNewFinishForm((prev) => ({
                            ...prev,
                            technique: e.target.value,
                          }))
                        }
                        className="w-full pl-11 pr-5 py-4 rounded-2xl bg-[#F4F7FA] border border-transparent text-sm font-semibold text-slate-800 placeholder:text-slate-400/90 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-12 gap-3.5 pt-3">
                    <button
                      type="button"
                      onClick={() => {
                        setShowNewFinishForm(false);
                        setEditingFinishId(null);
                      }}
                      className="col-span-4 py-4 rounded-2xl bg-[#F4F7FA] hover:bg-slate-200/70 text-[11px] font-extrabold uppercase tracking-wider text-slate-500 transition-colors cursor-pointer"
                    >
                      CANCELAR
                    </button>
                    <button
                      type="submit"
                      className="col-span-8 py-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/30 text-[11px] font-extrabold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>
                        {editingFinishId
                          ? "GUARDAR CAMBIOS"
                          : "REGISTRAR MANUALIDAD"}
                      </span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* 4. MODAL EMERGENTE: NUEVO / EDITAR TIPO DE PRENDA (FORMATO IDÉNTICO AL RESTO) */}
          {showNewGarmentForm && (
            <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white rounded-[32px] max-w-[460px] w-full p-8 shadow-2xl relative border border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowNewGarmentForm(false);
                    setEditingGarmentId(null);
                  }}
                  className="absolute top-7 right-7 text-slate-300 hover:text-slate-500 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5 stroke-[2.5]" />
                </button>

                <div className="flex items-center gap-4 mb-7">
                  <div className="w-14 h-14 rounded-[20px] bg-blue-600 shadow-lg shadow-blue-600/30 flex items-center justify-center text-white shrink-0">
                    <Shirt className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="text-[22px] font-black text-slate-900 tracking-tight leading-none">
                      {editingGarmentId ? "Editar Prenda" : "Nueva Prenda"}
                    </h3>
                    <span className="text-[10.5px] font-extrabold uppercase tracking-[0.12em] text-slate-400 block mt-1.5">
                      GESTIÓN DE TIPOS DE PRENDA
                    </span>
                  </div>
                </div>

                <form
                  onSubmit={handleSaveCatalogGarment}
                  className="space-y-5"
                >
                  <div>
                    <label className="block text-[10.5px] font-extrabold uppercase tracking-[0.08em] text-slate-400 mb-2">
                      NOMBRE DEL TIPO DE PRENDA
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. Pantalón Jean Caballero / Chaqueta Denim"
                      value={newGarmentForm.label}
                      onChange={(e) =>
                        setNewGarmentForm((prev) => ({
                          ...prev,
                          label: e.target.value,
                        }))
                      }
                      className="w-full px-5 py-4 rounded-2xl bg-[#F4F7FA] border border-transparent text-sm font-semibold text-slate-800 placeholder:text-slate-400/90 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-[10.5px] font-extrabold uppercase tracking-[0.08em] text-slate-400 mb-2">
                        CATEGORÍA / LÍNEA
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="DENIM CABALLERO"
                        value={newGarmentForm.category}
                        onChange={(e) =>
                          setNewGarmentForm((prev) => ({
                            ...prev,
                            category: e.target.value,
                          }))
                        }
                        className="w-full px-5 py-4 rounded-2xl bg-[#F4F7FA] border border-transparent text-sm font-semibold text-slate-800 placeholder:text-slate-400/90 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-[10.5px] font-extrabold uppercase tracking-[0.08em] text-slate-400 mb-2">
                        TEJIDO / COMPOSICIÓN
                      </label>
                      <input
                        type="text"
                        placeholder="Denim Índigo 12 oz"
                        value={newGarmentForm.fabric}
                        onChange={(e) =>
                          setNewGarmentForm((prev) => ({
                            ...prev,
                            fabric: e.target.value,
                          }))
                        }
                        className="w-full px-5 py-4 rounded-2xl bg-[#F4F7FA] border border-transparent text-sm font-semibold text-slate-800 placeholder:text-slate-400/90 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10.5px] font-extrabold uppercase tracking-[0.08em] text-slate-400 mb-2">
                      DESCRIPCIÓN / OBSERVACIÓN
                    </label>
                    <div className="relative">
                      <FileText className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Ej. Corte clásico 5 bolsillos..."
                        value={newGarmentForm.description}
                        onChange={(e) =>
                          setNewGarmentForm((prev) => ({
                            ...prev,
                            description: e.target.value,
                          }))
                        }
                        className="w-full pl-11 pr-5 py-4 rounded-2xl bg-[#F4F7FA] border border-transparent text-sm font-semibold text-slate-800 placeholder:text-slate-400/90 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-12 gap-3.5 pt-3">
                    <button
                      type="button"
                      onClick={() => {
                        setShowNewGarmentForm(false);
                        setEditingGarmentId(null);
                      }}
                      className="col-span-4 py-4 rounded-2xl bg-[#F4F7FA] hover:bg-slate-200/70 text-[11px] font-extrabold uppercase tracking-wider text-slate-500 transition-colors cursor-pointer"
                    >
                      CANCELAR
                    </button>
                    <button
                      type="submit"
                      className="col-span-8 py-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/30 text-[11px] font-extrabold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>
                        {editingGarmentId
                          ? "GUARDAR CAMBIOS"
                          : "REGISTRAR PRENDA"}
                      </span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* 5. MODAL EMERGENTE: NUEVO / EDITAR ENCARGADO DE DESPACHO */}
          {showNewDispatcherForm && (
            <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white rounded-[32px] max-w-[460px] w-full p-8 shadow-2xl relative border border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowNewDispatcherForm(false);
                    setEditingDispatcherId(null);
                  }}
                  className="absolute top-7 right-7 text-slate-300 hover:text-slate-500 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5 stroke-[2.5]" />
                </button>

                <div className="flex items-center gap-4 mb-7">
                  <div className="w-14 h-14 rounded-[20px] bg-blue-600 shadow-lg shadow-blue-600/30 flex items-center justify-center text-white shrink-0">
                    <UserCheck className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="text-[22px] font-black text-slate-900 tracking-tight leading-none">
                      {editingDispatcherId
                        ? "Editar Encargado"
                        : "Nuevo Encargado"}
                    </h3>
                    <span className="text-[10.5px] font-extrabold uppercase tracking-[0.12em] text-slate-400 block mt-1.5">
                      RESPONSABLE QUE DESPACHA EN PLANTA
                    </span>
                  </div>
                </div>

                <form
                  onSubmit={handleSaveCatalogDispatcher}
                  className="space-y-5"
                >
                  <div>
                    <label className="block text-[10.5px] font-extrabold uppercase tracking-[0.08em] text-slate-400 mb-2">
                      NOMBRE COMPLETO DEL ENCARGADO
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. CARLOS URIÑA / ISRAEL FLORES"
                      value={newDispatcherForm.nombre}
                      onChange={(e) =>
                        setNewDispatcherForm((prev) => ({
                          ...prev,
                          nombre: e.target.value,
                        }))
                      }
                      className="w-full px-5 py-4 rounded-2xl bg-[#F4F7FA] border border-transparent text-sm font-semibold text-slate-800 uppercase placeholder:normal-case placeholder:text-slate-400/90 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-[10.5px] font-extrabold uppercase tracking-[0.08em] text-slate-400 mb-2">
                        CARGO / FUNCIÓN
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ej. BODEGUERO"
                        value={newDispatcherForm.cargo}
                        onChange={(e) =>
                          setNewDispatcherForm((prev) => ({
                            ...prev,
                            cargo: e.target.value,
                          }))
                        }
                        className="w-full px-5 py-4 rounded-2xl bg-[#F4F7FA] border border-transparent text-sm font-semibold text-slate-800 uppercase placeholder:normal-case placeholder:text-slate-400/90 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-[10.5px] font-extrabold uppercase tracking-[0.08em] text-slate-400 mb-2">
                        TELÉFONO / INTERNO
                      </label>
                      <input
                        type="text"
                        placeholder="099..."
                        value={newDispatcherForm.telefono}
                        onChange={(e) =>
                          setNewDispatcherForm((prev) => ({
                            ...prev,
                            telefono: e.target.value,
                          }))
                        }
                        className="w-full px-5 py-4 rounded-2xl bg-[#F4F7FA] border border-transparent text-sm font-semibold text-slate-800 placeholder:text-slate-400/90 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-12 gap-3.5 pt-3">
                    <button
                      type="button"
                      onClick={() => {
                        setShowNewDispatcherForm(false);
                        setEditingDispatcherId(null);
                      }}
                      className="col-span-4 py-4 rounded-2xl bg-[#F4F7FA] hover:bg-slate-200/70 text-[11px] font-extrabold uppercase tracking-wider text-slate-500 transition-colors cursor-pointer"
                    >
                      CANCELAR
                    </button>
                    <button
                      type="submit"
                      className="col-span-8 py-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/30 text-[11px] font-extrabold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>
                        {editingDispatcherId
                          ? "GUARDAR CAMBIOS"
                          : "REGISTRAR ENCARGADO"}
                      </span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* =================================================================
              6. VENTANAS EMERGENTES DEL DASHBOARD PRINCIPAL:
                 A) VENTANA DE INSPECCIÓN DE ORDEN Y VISTA PREVIA RECIBO A4
                 B) VENTANA DE FICHA EJECUTIVA DEL CLIENTE Y SUS DESPACHOS
                 C) VENTANA DE RANKING ANALÍTICO AMPLIADO (PROCESOS / MANUALIDADES / PRENDAS / ENCARGADOS / CLIENTES)
             ================================================================= */}

          {/* 6A. VENTANA EMERGENTE: INSPECCIÓN RÁPIDA DE ORDEN + VISTA PREVIA A4 */}
          {dashboardPreviewOrder && (
            <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
              <div className="bg-white rounded-[32px] max-w-[1180px] w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden">
                {/* Header de la Ventana */}
                <div className="px-7 py-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4 bg-white shrink-0">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-blue-600 shadow-lg shadow-blue-600/25 flex items-center justify-center text-white shrink-0">
                      <FileText className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2.5">
                        <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">
                          Orden {dashboardPreviewOrder.numeroOrden}
                        </h3>
                        <span className="px-2.5 py-0.5 rounded-md bg-[#ECFDF5] text-[#10B981] font-extrabold text-[10px] uppercase tracking-wider">
                          EMISIÓN: {dashboardPreviewOrder.fecha}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 font-semibold mt-0.5">
                        Cliente:{" "}
                        <strong className="text-slate-800 uppercase">
                          {dashboardPreviewOrder.cliente.nombre}
                        </strong>{" "}
                        &bull; RUC: {dashboardPreviewOrder.cliente.rucCedula}{" "}
                        &bull; Despacha:{" "}
                        <strong className="text-blue-600 uppercase">
                          {dashboardPreviewOrder.despachadoPor || "ENCARGADO"}
                        </strong>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => {
                        setCurrentOrder(dashboardPreviewOrder);
                        setDashboardPreviewOrder(null);
                        setActiveSection("nuevo-despacho");
                      }}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-600 text-xs font-extrabold uppercase tracking-wider transition-colors cursor-pointer"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      <span>Editar Orden</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setCurrentOrder(dashboardPreviewOrder);
                        setTimeout(() => {
                          window.print();
                        }, 150);
                      }}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/25 text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer"
                    >
                      <Printer className="w-4 h-4" />
                      <span>Imprimir Recibo A4</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDashboardPreviewOrder(null)}
                      className="w-10 h-10 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Cuerpo de la Ventana: Resumen Lotes (Izquierda) + Hoja A4 en Vivo (Derecha) */}
                <div className="p-6 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 gap-6 bg-[#F8FAFC]">
                  {/* Columna Izquierda: Desglose de Lotes, Prendas y Procesos */}
                  <div className="lg:col-span-5 space-y-4">
                    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 space-y-3">
                      <span className="text-[10.5px] font-extrabold uppercase tracking-wider text-blue-600 block">
                        DATOS DEL CLIENTE Y ENTREGA
                      </span>
                      <div className="text-sm font-extrabold text-slate-900 uppercase">
                        {dashboardPreviewOrder.cliente.nombre}
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
                        <div>
                          <span className="text-[10px] font-bold uppercase text-slate-400 block">
                            RUC / CÉDULA
                          </span>
                          <span className="font-mono font-bold text-slate-800">
                            {dashboardPreviewOrder.cliente.rucCedula}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold uppercase text-slate-400 block">
                            TELÉFONO
                          </span>
                          <span className="font-mono font-semibold text-slate-800">
                            {dashboardPreviewOrder.cliente.telefono}
                          </span>
                        </div>
                        <div className="col-span-2">
                          <span className="text-[10px] font-bold uppercase text-slate-400 block">
                            DIRECCIÓN
                          </span>
                          <span className="font-semibold text-slate-700">
                            {dashboardPreviewOrder.cliente.direccion}
                          </span>
                        </div>
                      </div>
                      {dashboardPreviewOrder.observaciones && (
                        <div className="pt-2 border-t border-slate-100">
                          <span className="text-[10px] font-bold uppercase text-slate-400 block">
                            OBSERVACIONES DE CALIDAD
                          </span>
                          <p className="text-xs text-slate-600 mt-0.5">
                            {dashboardPreviewOrder.observaciones}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Lista de Lotes de la Orden */}
                    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10.5px] font-extrabold uppercase tracking-wider text-slate-400">
                          LOTES DESPACHADOS (
                          {dashboardPreviewOrder.items.length})
                        </span>
                        <span className="px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-600 font-extrabold text-[11px]">
                          {dashboardPreviewOrder.items
                            .reduce(
                              (sum, i) => sum + (Number(i.cantidad) || 0),
                              0
                            )
                            .toLocaleString("es-EC")}{" "}
                          PRENDAS
                        </span>
                      </div>

                      <div className="space-y-3">
                        {dashboardPreviewOrder.items.map((item, iIdx) => (
                          <div
                            key={item.id}
                            className="p-3.5 rounded-2xl bg-[#F8FAFC] border border-slate-200/70 space-y-2"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <span className="w-6 h-6 rounded-lg bg-blue-600 text-white font-mono text-[10px] font-extrabold flex items-center justify-center">
                                  #{iIdx + 1}
                                </span>
                                <span className="text-xs font-extrabold text-slate-900 uppercase">
                                  {item.tipoPrenda}
                                </span>
                              </div>
                              <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-600 font-mono font-extrabold text-[10.5px]">
                                {item.lote} &bull; {item.cantidad} UDS
                              </span>
                            </div>

                            {item.procesos.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {item.procesos.map((p) => (
                                  <span
                                    key={p}
                                    className="px-2 py-0.5 rounded-md bg-blue-600/10 text-blue-700 font-bold text-[9.5px] uppercase"
                                  >
                                    {p}
                                  </span>
                                ))}
                              </div>
                            )}

                            {item.manualidades.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {item.manualidades.map((m) => (
                                  <span
                                    key={m}
                                    className="px-2 py-0.5 rounded-md bg-indigo-600/10 text-indigo-700 font-bold text-[9.5px] uppercase"
                                  >
                                    {m}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Columna Derecha: Vista Previa Hoja A4 (Original y Copia) */}
                  <div className="lg:col-span-7 bg-white rounded-2xl p-4 border border-slate-200/80 flex flex-col items-center justify-start overflow-x-auto">
                    <div className="w-full flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                        VISTA PREVIA DE IMPRESIÓN A4 (ORIGINAL Y COPIA)
                      </span>
                      <span className="text-[10px] font-bold text-slate-400">
                        210mm &times; 297mm
                      </span>
                    </div>
                    <div className="origin-top scale-[0.55] sm:scale-[0.66] md:scale-[0.72] h-[175mm] sm:h-[205mm] md:h-[220mm]">
                      <ReceiptA4View
                        order={dashboardPreviewOrder}
                        company={company}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 6B. VENTANA EMERGENTE: FICHA EJECUTIVA DEL CLIENTE Y SUS DESPACHOS */}
          {dashboardSelectedClient && (
            <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
              <div className="bg-white rounded-[32px] max-w-[780px] w-full p-7 shadow-2xl border border-slate-100 space-y-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-amber-500 shadow-lg shadow-amber-500/25 flex items-center justify-center text-white shrink-0">
                      <Building2 className="w-7 h-7" />
                    </div>
                    <div>
                      <span className="px-2.5 py-0.5 rounded-md bg-amber-50 text-amber-600 font-extrabold text-[10px] uppercase tracking-wider">
                        FICHA EJECUTIVA DE CLIENTE
                      </span>
                      <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight mt-1">
                        {dashboardSelectedClient.nombre}
                      </h3>
                      <p className="text-xs text-slate-500 font-semibold">
                        RUC: {dashboardSelectedClient.rucCedula} &bull; Tel:{" "}
                        {dashboardSelectedClient.telefono} &bull;{" "}
                        {dashboardSelectedClient.direccion}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setDashboardSelectedClient(null)}
                    className="w-9 h-9 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {(() => {
                  const clientOrders = savedOrders.filter(
                    (o) =>
                      o.cliente.rucCedula ===
                        dashboardSelectedClient.rucCedula ||
                      o.cliente.nombre === dashboardSelectedClient.nombre
                  );
                  const totalPrendasCli = clientOrders.reduce(
                    (acc, o) =>
                      acc +
                      o.items.reduce(
                        (s, i) => s + (Number(i.cantidad) || 0),
                        0
                      ),
                    0
                  );
                  const totalLotesCli = clientOrders.reduce(
                    (acc, o) => acc + o.items.length,
                    0
                  );

                  return (
                    <>
                      {/* 3 Mini KPIs del Cliente */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-slate-200/70">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                            VOLUMEN ACUMULADO
                          </span>
                          <span className="text-xl font-black text-slate-900 mt-1 block">
                            {totalPrendasCli.toLocaleString("es-EC")} UDS
                          </span>
                        </div>
                        <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-slate-200/70">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                            ÓRDENES EMITIDAS
                          </span>
                          <span className="text-xl font-black text-blue-600 mt-1 block">
                            {clientOrders.length} ÓRDENES
                          </span>
                        </div>
                        <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-slate-200/70">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                            LOTES PROCESADOS
                          </span>
                          <span className="text-xl font-black text-emerald-600 mt-1 block">
                            {totalLotesCli} LOTES
                          </span>
                        </div>
                      </div>

                      {/* Historial de Órdenes de este Cliente */}
                      <div className="border border-slate-200/80 rounded-2xl overflow-hidden">
                        <div className="px-5 py-3 bg-slate-50 border-b border-slate-200/70 flex items-center justify-between">
                          <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-600">
                            HISTORIAL DE DESPACHOS DEL CLIENTE
                          </span>
                          <span className="text-[10.5px] font-bold text-slate-400">
                            {clientOrders.length} registros
                          </span>
                        </div>
                        <div className="max-h-64 overflow-y-auto divide-y divide-slate-100">
                          {clientOrders.length === 0 ? (
                            <div className="p-6 text-center text-xs text-slate-400 font-semibold">
                              Este cliente aún no registra órdenes de despacho.
                            </div>
                          ) : (
                            clientOrders.map((ord) => {
                              const qty = ord.items.reduce(
                                (s, i) => s + (Number(i.cantidad) || 0),
                                0
                              );
                              return (
                                <div
                                  key={ord.id}
                                  className="px-5 py-3.5 flex items-center justify-between gap-3 hover:bg-slate-50"
                                >
                                  <div>
                                    <span className="text-xs font-extrabold text-slate-900 uppercase block">
                                      {ord.numeroOrden} &bull; {ord.fecha}
                                    </span>
                                    <span className="text-[10.5px] font-semibold text-slate-500">
                                      Encargado:{" "}
                                      {ord.despachadoPor || "ENCARGADO"}{" "}
                                      &bull; {ord.items.length} lotes
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-600 font-extrabold text-[10.5px]">
                                      {qty.toLocaleString("es-EC")} UDS
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setDashboardSelectedClient(null);
                                        setDashboardPreviewOrder(ord);
                                      }}
                                      className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-600 text-blue-600 hover:text-white font-bold text-[10.5px] transition-colors cursor-pointer"
                                    >
                                      Ver A4
                                    </button>
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                        <button
                          type="button"
                          onClick={() => {
                            const cli = dashboardSelectedClient;
                            setDashboardSelectedClient(null);
                            handleEditDirectoryClient(cli);
                          }}
                          className="px-4 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-extrabold uppercase tracking-wider cursor-pointer"
                        >
                          Editar Datos del Cliente
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            const cli = dashboardSelectedClient;
                            setDashboardSelectedClient(null);
                            handleNewBlankOrder(cli);
                          }}
                          className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/25 text-xs font-extrabold uppercase tracking-wider cursor-pointer"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Nuevo Despacho para este Cliente</span>
                        </button>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
          )}

          {/* 6C. VENTANA EMERGENTE: ANALÍTICA AMPLIADA DEL DASHBOARD */}
          {dashboardExpandedModal && (
            <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
              <div className="bg-white rounded-[32px] max-w-[760px] w-full p-7 shadow-2xl border border-slate-100 space-y-5">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-600/25">
                      <BarChart3 className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">
                        {dashboardExpandedModal === "procesos" &&
                          "Ranking Completo de Procesos Despachados"}
                        {dashboardExpandedModal === "manualidades" &&
                          "Ranking Completo de Manualidades y Acabados"}
                        {dashboardExpandedModal === "prendas" &&
                          "Ranking Completo de Tipos de Prenda"}
                        {dashboardExpandedModal === "encargados" &&
                          "Rendimiento Completo por Encargado de Despacho"}
                        {dashboardExpandedModal === "clientes" &&
                          "Ranking Completo de Clientes Activos"}
                      </h3>
                      <p className="text-xs text-slate-400 font-semibold">
                        Ventana analítica detallada del Dashboard Principal
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setDashboardExpandedModal(null)}
                    className="w-9 h-9 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Buscador interno de la ventana */}
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Filtrar dentro de esta ventana..."
                    value={dashboardModalSearch}
                    onChange={(e) => setDashboardModalSearch(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 rounded-2xl bg-[#F8FAFC] border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:bg-white focus:border-blue-600"
                  />
                </div>

                {/* Lista dinámica según el módulo seleccionado */}
                <div className="max-h-[52vh] overflow-y-auto divide-y divide-slate-100 border border-slate-100 rounded-2xl">
                  {dashboardExpandedModal === "procesos" &&
                    dashboardAnalytics.topProcesses
                      .filter(
                        (p) =>
                          !dashboardModalSearch.trim() ||
                          p.label
                            .toLowerCase()
                            .includes(dashboardModalSearch.toLowerCase()) ||
                          p.category
                            .toLowerCase()
                            .includes(dashboardModalSearch.toLowerCase())
                      )
                      .map((proc, i) => (
                        <div
                          key={proc.label}
                          className="px-5 py-3.5 flex items-center justify-between gap-3 hover:bg-slate-50"
                        >
                          <div className="flex items-center gap-3">
                            <span className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 font-mono text-xs font-extrabold flex items-center justify-center">
                              {i + 1}
                            </span>
                            <div>
                              <span className="text-xs font-extrabold text-slate-900 uppercase block">
                                {proc.label}
                              </span>
                              <span className="text-[10px] font-bold uppercase text-slate-400">
                                {proc.category} &bull; {proc.lotes} LOTES
                              </span>
                            </div>
                          </div>
                          <span className="px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-600 font-extrabold text-xs">
                            {proc.prendas.toLocaleString("es-EC")} UDS
                          </span>
                        </div>
                      ))}

                  {dashboardExpandedModal === "manualidades" &&
                    dashboardAnalytics.topFinishes
                      .filter(
                        (f) =>
                          !dashboardModalSearch.trim() ||
                          f.label
                            .toLowerCase()
                            .includes(dashboardModalSearch.toLowerCase())
                      )
                      .map((fin, i) => (
                        <div
                          key={fin.label}
                          className="px-5 py-3.5 flex items-center justify-between gap-3 hover:bg-slate-50"
                        >
                          <div className="flex items-center gap-3">
                            <span className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 font-mono text-xs font-extrabold flex items-center justify-center">
                              {i + 1}
                            </span>
                            <div>
                              <span className="text-xs font-extrabold text-slate-900 uppercase block">
                                {fin.label}
                              </span>
                              <span className="text-[10px] font-bold uppercase text-slate-400">
                                {fin.tipoPrenda} &bull; {fin.lotes} LOTES
                              </span>
                            </div>
                          </div>
                          <span className="px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-600 font-extrabold text-xs">
                            {fin.prendas.toLocaleString("es-EC")} UDS
                          </span>
                        </div>
                      ))}

                  {dashboardExpandedModal === "prendas" &&
                    dashboardAnalytics.topGarments
                      .filter(
                        (g) =>
                          !dashboardModalSearch.trim() ||
                          g.label
                            .toLowerCase()
                            .includes(dashboardModalSearch.toLowerCase())
                      )
                      .map((gar, i) => (
                        <div
                          key={gar.label}
                          className="px-5 py-3.5 flex items-center justify-between gap-3 hover:bg-slate-50"
                        >
                          <div className="flex items-center gap-3">
                            <span className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 font-mono text-xs font-extrabold flex items-center justify-center">
                              {i + 1}
                            </span>
                            <div>
                              <span className="text-xs font-extrabold text-slate-900 uppercase block">
                                {gar.label}
                              </span>
                              <span className="text-[10px] font-bold uppercase text-slate-400">
                                {gar.lotes} LOTES PROCESADOS
                              </span>
                            </div>
                          </div>
                          <span className="px-2.5 py-1 rounded-md bg-blue-50 text-blue-600 font-extrabold text-xs">
                            {gar.prendas.toLocaleString("es-EC")} UDS
                          </span>
                        </div>
                      ))}

                  {dashboardExpandedModal === "encargados" &&
                    dashboardAnalytics.topDispatchers
                      .filter(
                        (d) =>
                          !dashboardModalSearch.trim() ||
                          d.nombre
                            .toLowerCase()
                            .includes(dashboardModalSearch.toLowerCase()) ||
                          d.cargo
                            .toLowerCase()
                            .includes(dashboardModalSearch.toLowerCase())
                      )
                      .map((disp, i) => (
                        <div
                          key={disp.nombre}
                          className="px-5 py-3.5 flex items-center justify-between gap-3 hover:bg-slate-50"
                        >
                          <div className="flex items-center gap-3">
                            <span className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 font-mono text-xs font-extrabold flex items-center justify-center">
                              {i + 1}
                            </span>
                            <div>
                              <span className="text-xs font-extrabold text-slate-900 uppercase block">
                                {disp.nombre}
                              </span>
                              <span className="text-[10px] font-bold uppercase text-slate-400">
                                {disp.cargo} &bull; {disp.ordenes} ÓRDENES
                              </span>
                            </div>
                          </div>
                          <span className="px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-600 font-extrabold text-xs">
                            {disp.prendas.toLocaleString("es-EC")} UDS
                          </span>
                        </div>
                      ))}

                  {dashboardExpandedModal === "clientes" &&
                    dashboardAnalytics.topClients
                      .filter(
                        (c) =>
                          !dashboardModalSearch.trim() ||
                          c.nombre
                            .toLowerCase()
                            .includes(dashboardModalSearch.toLowerCase()) ||
                          c.rucCedula
                            .toLowerCase()
                            .includes(dashboardModalSearch.toLowerCase())
                      )
                      .map((cli, i) => (
                        <div
                          key={cli.rucCedula + i}
                          className="px-5 py-3.5 flex items-center justify-between gap-3 hover:bg-slate-50"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 font-mono text-xs font-extrabold flex items-center justify-center shrink-0">
                              {i + 1}
                            </span>
                            <div className="min-w-0">
                              <span className="text-xs font-extrabold text-slate-900 uppercase block truncate">
                                {cli.nombre}
                              </span>
                              <span className="text-[10px] font-bold uppercase text-slate-400">
                                RUC: {cli.rucCedula} &bull; {cli.ordenes}{" "}
                                ÓRDENES ({cli.lotes} LOTES)
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-600 font-extrabold text-xs">
                              {cli.prendas.toLocaleString("es-EC")} UDS
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setDashboardExpandedModal(null);
                                handleNewBlankOrder({
                                  id: cli.id,
                                  nombre: cli.nombre,
                                  rucCedula: cli.rucCedula,
                                  telefono: cli.telefono,
                                  direccion: cli.direccion,
                                });
                              }}
                              className="px-2.5 py-1 rounded-lg bg-blue-600 text-white font-bold text-[10.5px] cursor-pointer"
                            >
                              + Despachar
                            </button>
                          </div>
                        </div>
                      ))}
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      const target = dashboardExpandedModal;
                      setDashboardExpandedModal(null);
                      if (target === "procesos")
                        setActiveSection("procesos-despacho");
                      if (target === "manualidades")
                        setActiveSection("manualidades");
                      if (target === "prendas")
                        setActiveSection("tipos-prenda");
                      if (target === "encargados")
                        setActiveSection("encargados");
                      if (target === "clientes") setActiveSection("clientes");
                    }}
                    className="text-xs font-extrabold text-blue-600 hover:text-blue-700 uppercase tracking-wider cursor-pointer"
                  >
                    Ir al Módulo Completo &rarr;
                  </button>
                  <button
                    type="button"
                    onClick={() => setDashboardExpandedModal(null)}
                    className="px-5 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-xs font-extrabold uppercase tracking-wider text-slate-600 cursor-pointer"
                  >
                    Cerrar Ventana
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Datalist global para autocompletar Tipo de Prenda en los modales */}
          <datalist id="modal-garments-datalist">
            {garmentCatalog.map((g) => (
              <option key={g.id} value={g.label} />
            ))}
          </datalist>
        </div>
      </div>

      {/* =====================================================================
          2. CONTENEDOR EXCLUSIVO DE IMPRESIÓN (@media print)
          Imprime exclusivamente la hoja A4 vertical dividida en ORIGINAL y COPIA.
         ===================================================================== */}
      <div className="hidden print:block print:w-[210mm] print:h-[297mm] print:m-0 print:p-0 print:overflow-hidden">
        <ReceiptA4View
          order={dashboardPreviewOrder || currentOrder}
          company={company}
        />
      </div>

      {/* =====================================================================
          3. CONTENEDOR OFF-SCREEN PARA EXPORTACIÓN DIRECTA DE PDF A4
         ===================================================================== */}
      <div
        id="pdf-export-container"
        style={{
          position: "fixed",
          left: "-9999px",
          top: 0,
          width: "210mm",
          height: "297mm",
          backgroundColor: "#ffffff",
          zIndex: -9999,
          pointerEvents: "none",
        }}
      >
        <ReceiptA4View
          order={pdfTargetOrder || dashboardPreviewOrder || currentOrder}
          company={company}
        />
      </div>
    </div>
  );
}
