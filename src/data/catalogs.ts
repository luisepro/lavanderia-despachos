import {
  ArtisanFinishCatalogItem,
  Client,
  CompanyInfo,
  DispatcherCatalogItem,
  DispatchOrder,
  GarmentTypeCatalogItem,
  IndustrialProcessCatalogItem,
} from "@/types/dispatch";

export const INITIAL_DISPATCHERS: DispatcherCatalogItem[] = [
  {
    id: "enc-01",
    nombre: "CARLOS URIÑA",
    cargo: "BODEGUERO",
    telefono: "0991234501",
  },
  {
    id: "enc-02",
    nombre: "ISRAEL FLORES",
    cargo: "FROSTEADOR",
    telefono: "0991234502",
  },
  {
    id: "enc-03",
    nombre: "ANDRES URIÑA",
    cargo: "FROSTEADOR",
    telefono: "0991234503",
  },
  {
    id: "enc-04",
    nombre: "JUAN GUERRA",
    cargo: "SECADOR",
    telefono: "0991234504",
  },
  {
    id: "enc-05",
    nombre: "JUSTIN TORRES",
    cargo: "SECADOR",
    telefono: "0991234505",
  },
  {
    id: "enc-06",
    nombre: "ANGELO CASTRO",
    cargo: "OPERARIO",
    telefono: "0991234506",
  },
  {
    id: "enc-07",
    nombre: "MARIO FREIRE",
    cargo: "OPERARIO",
    telefono: "0991234507",
  },
  {
    id: "enc-08",
    nombre: "EDISON CHICAIZA",
    cargo: "OPERARIO",
    telefono: "0991234508",
  },
];

export const DEFAULT_COMPANY_INFO: CompanyInfo = {
  nombre: "PROLAVTEX LAVANDERÍA INDUSTRIAL S.A.",
  subtitulo:
    "Diseño y Gestión de Procesos Maestros en Mezclilla, Tintorería y Acabados Textiles",
  ruc: "1792845012001",
  direccion: "Parque Industrial Norte, Galpón 14B - Av. de los Textiles Km 4.5",
  telefono: "(02) 248-9100 / +593 99 841 2300",
  email: "despachos@prolavtex.com",
  planta: "PLANTA CENTRAL PROLAVTEX - LÍNEA DENIM",
};

export const INITIAL_GARMENT_TYPES: GarmentTypeCatalogItem[] = [
  {
    id: "gt-01",
    label: "Pantalón Jean Caballero",
    category: "DENIM PESADO",
    fabric: "Mezclilla Índigo 12oz - 14oz",
    description: "Mezclilla 12oz - 14oz corte clásico / slim",
  },
  {
    id: "gt-02",
    label: "Pantalón Jean Dama",
    category: "DENIM STRETCH",
    fabric: "Mezclilla Stretch 9oz - 11oz",
    description: "Mezclilla con elastano 9oz - 11oz",
  },
  {
    id: "gt-03",
    label: "Chaqueta Denim (Trucker)",
    category: "DENIM SUPERIOR",
    fabric: "Mezclilla Rígida 13oz",
    description: "Casaca / Chaqueta de mezclilla estructurada",
  },
  {
    id: "gt-04",
    label: "Short de Mezclilla",
    category: "DENIM VERANO",
    fabric: "Mezclilla Algodón 10oz",
    description: "Bermuda y short denim dama/caballero",
  },
  {
    id: "gt-05",
    label: "Falda Denim",
    category: "DENIM DAMA",
    fabric: "Mezclilla Stretch 10oz",
    description: "Falda corta o midi en tejido denim",
  },
  {
    id: "gt-06",
    label: "Overol / Enterizo Denim",
    category: "PRENDA COMPLETA",
    fabric: "Mezclilla Industrial 12oz",
    description: "Enterizo industrial o casual en mezclilla",
  },
  {
    id: "gt-07",
    label: "Camisa Denim Liviano",
    category: "DENIM LIVIANO",
    fabric: "Chambray / Denim 6oz - 8oz",
    description: "Camisería en chambray o denim 6oz - 8oz",
  },
  {
    id: "gt-08",
    label: "Pantalón Drill / Gabardina",
    category: "TEXTIL ALGODÓN",
    fabric: "Sarga Algodón 100%",
    description: "Prenda en sarga de algodón para teñido o suavizado",
  },
  {
    id: "gt-09",
    label: "Jogger Cargo Textil",
    category: "URBANO / CARGO",
    fabric: "Twill / Algodón Peinado",
    description: "Pantalón con bolsillos laterales y puño elástico",
  },
];

export const GARMENT_TYPES: string[] = INITIAL_GARMENT_TYPES.map(
  (g) => g.label
);

export const INDUSTRIAL_PROCESSES: IndustrialProcessCatalogItem[] = [
  {
    id: "lavado-enzimatico",
    label: "Lavado Enzimático",
    category: "LAVADO",
    tipoPrenda: "Pantalón Jean Caballero",
    description: "Bio-pulido y desgaste controlado en prenda de mezclilla",
  },
  {
    id: "deslavado",
    label: "Deslavado (Stone Wash)",
    category: "LAVADO PESADO",
    tipoPrenda: "Chaqueta Denim (Trucker)",
    description: "Abrasión física en tambor industrial para efecto vintage",
  },
  {
    id: "neutralizado",
    label: "Neutralizado",
    category: "QUÍMICO",
    tipoPrenda: "Todas las Prendas Denim",
    description: "Eliminación de residuales oxidantes y estabilización de pH",
  },
  {
    id: "suavizado-siliconado",
    label: "Suavizado Siliconado",
    category: "ACABADO",
    tipoPrenda: "Pantalón Jean Dama",
    description: "Aplicación de micro-emulsión para tacto extra suave",
  },
  {
    id: "desengomado",
    label: "Desengomado (Desizing)",
    category: "PREPARACIÓN",
    tipoPrenda: "Pantalón Jean Caballero",
    description: "Remoción de almidones y aprestos de tejeduría en crudo",
  },
  {
    id: "blanqueo-hipoclorito",
    label: "Blanqueo (Bleach)",
    category: "QUÍMICO",
    tipoPrenda: "Short de Mezclilla",
    description: "Degradación controlada del tono índigo hacia tonos celestes",
  },
  {
    id: "tenido",
    label: "Teñido Directo / Reactivo",
    category: "TINTORERÍA",
    tipoPrenda: "Pantalón Drill / Gabardina",
    description: "Sobre-teñido (Overdye / Dirty Tint) y coloración sólida",
  },
  {
    id: "acid-wash",
    label: "Lavado Ácido (Acid Wash)",
    category: "ESPECIAL",
    tipoPrenda: "Chaqueta Denim (Trucker)",
    description: "Efecto nevado de alto contraste por oxidación localizada",
  },
  {
    id: "fijado-color",
    label: "Fijado de Índigo",
    category: "QUÍMICO",
    tipoPrenda: "Camisa Denim Liviano",
    description: "Agente catiónico para mejorar solidez al frote húmedo y seco",
  },
  {
    id: "ozono-ecologico",
    label: "Lavado con Ozono",
    category: "SOSTENIBLE",
    tipoPrenda: "Pantalón Jean Dama",
    description: "Decoloración ecológica en frío sin descarga de agua residual",
  },
];

export const ARTISAN_FINISHES: ArtisanFinishCatalogItem[] = [
  {
    id: "bigotes",
    label: "Bigotes (Whiskers)",
    category: "MANUALIDAD SECO",
    tipoPrenda: "Pantalón Jean Caballero",
    technique: "Marcado con molde polimérico y lija grano 220",
  },
  {
    id: "lijado-localizado",
    label: "Lijado Localizado (Hand Sanding)",
    category: "MANUALIDAD SECO",
    tipoPrenda: "Pantalón Jean Dama",
    technique: "Desgaste manual en muslos y posaderas con maniquí neumático",
  },
  {
    id: "roturas-grinding",
    label: "Roturas / Grinding",
    category: "DESGASTE",
    tipoPrenda: "Short de Mezclilla",
    technique: "Esmerilado en bordes de bolsillos, bota y pretina",
  },
  {
    id: "focalizado-potasio",
    label: "Focalizado (Spray PP)",
    category: "QUÍMICO LOCAL",
    tipoPrenda: "Pantalón Jean Caballero",
    technique: "Nebulización localizada en cabina para reserva de luz",
  },
  {
    id: "raspado",
    label: "Raspado / Chevrons",
    category: "DESGASTE",
    tipoPrenda: "Chaqueta Denim (Trucker)",
    technique: "Desfibrado superficial de trama sin romper urdimbre",
  },
  {
    id: "arrugado-3d",
    label: "Arrugado 3D / Resinado",
    category: "HORNEADO",
    tipoPrenda: "Pantalón Jean Caballero",
    technique: "Prensado tridimensional en corvas y curado en horno",
  },
  {
    id: "destroyer-laser",
    label: "Destroyer / Láser",
    category: "TECNOLOGÍA",
    tipoPrenda: "Short de Mezclilla",
    technique: "Grabado y rotura de precisión por haz láser CO2",
  },
  {
    id: "salpicado-pintura",
    label: "Salpicado / Paint Splatter",
    category: "ARTESANAL",
    tipoPrenda: "Jogger Cargo Textil",
    technique: "Goteo artístico con pigmento acrílico textil termo-fijado",
  },
  {
    id: "amarrado-tie-dye",
    label: "Amarrado (Tie-Dye / Crinkle)",
    category: "ARTESANAL",
    tipoPrenda: "Camisa Denim Liviano",
    technique: "Torsión y reserva mecánica antes de proceso húmedo",
  },
];

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

export const INITIAL_CLIENTS: Client[] = [
  {
    id: "cli-001",
    nombre: "CONFECCIONES DENIM ANDINO S.A.S.",
    rucCedula: "1791402981001",
    telefono: "0998123456 / (02) 265-4312",
    direccion: "Av. Galo Plaza Lasso N52-18 y Capitán Ramón Borja",
  },
  {
    id: "cli-002",
    nombre: "TEXTILES & MODA URBANA KRONOS CIA. LTDA.",
    rucCedula: "0992837465001",
    telefono: "0987654321",
    direccion: "Zona Industrial Pelileo, Vía Principal Km 2",
  },
  {
    id: "cli-003",
    nombre: "MAQUILA BLUE THREADS INTERNACIONAL",
    rucCedula: "1890192837001",
    telefono: "0991122334",
    direccion: "Parque Industrial Ambato, Etapa 3, Manzana C",
  },
  {
    id: "cli-004",
    nombre: "GRUPO TEXTIL INDIGO PACIFIC S.A.",
    rucCedula: "0991144882001",
    telefono: "0984512390",
    direccion: "Vía a Daule Km 11.5, Parque Industrial California",
  },
];

export const SAMPLE_DISPATCH_ORDER: DispatchOrder = {
  id: "ord-sample-104",
  numeroOrden: "ORD-20261109-0104",
  fecha: "2026-11-09",
  fechaEntrega: "2026-11-12",
  despachadoPor: "CARLOS URIÑA",
  cliente: INITIAL_CLIENTS[0],
  observaciones:
    "Verificar acabado con muestra física aprobada #M-42 (STON 2 COMPLETO). Empacar por tallas en fundas individuales y rotular número de lote al exterior.",
  creadoEn: "2026-11-09T07:00:00.000Z",
  items: [
    {
      id: "item-1",
      tipoPrenda: "Pantalón Jean Caballero",
      cantidad: 320,
      lote: "LT-884-A",
      procesos: [
        "Desengomado (Desizing)",
        "Lavado Enzimático",
        "Neutralizado",
        "Suavizado Siliconado",
      ],
      manualidades: [
        "Bigotes (Whiskers)",
        "Lijado Localizado (Hand Sanding)",
        "Focalizado (Spray PP)",
      ],
    },
    {
      id: "item-2",
      tipoPrenda: "Chaqueta Denim (Trucker)",
      cantidad: 180,
      lote: "LT-885-B",
      procesos: [
        "Deslavado (Stone Wash)",
        "Blanqueo (Bleach)",
        "Neutralizado",
        "Suavizado Siliconado",
      ],
      manualidades: ["Roturas / Grinding", "Raspado / Chevrons"],
    },
  ],
};

export const INITIAL_ORDERS_HISTORY: DispatchOrder[] = [
  SAMPLE_DISPATCH_ORDER,
  {
    id: "ord-sample-103",
    numeroOrden: "ORD-20261107-0103",
    fecha: "2026-11-07",
    fechaEntrega: "2026-11-10",
    despachadoPor: "CARLOS URIÑA",
    cliente: INITIAL_CLIENTS[1],
    observaciones:
      "Acabado suave siliconado extra. Controlar medidas de largo de pierna.",
    creadoEn: "2026-11-07T14:20:00.000Z",
    items: [
      {
        id: "item-103-1",
        tipoPrenda: "Pantalón Jean Dama",
        cantidad: 410,
        lote: "LT-879-C",
        procesos: [
          "Lavado Enzimático",
          "Neutralizado",
          "Suavizado Siliconado",
        ],
        manualidades: [
          "Bigotes (Whiskers)",
          "Lijado Localizado (Hand Sanding)",
          "Arrugado 3D / Resinado",
        ],
      },
    ],
  },
  {
    id: "ord-sample-102",
    numeroOrden: "ORD-20261105-0102",
    fecha: "2026-11-05",
    fechaEntrega: "2026-11-08",
    despachadoPor: "ISRAEL FLORES",
    cliente: INITIAL_CLIENTS[0],
    observaciones: "Lote prioritario de exportación.",
    creadoEn: "2026-11-05T10:00:00.000Z",
    items: [
      {
        id: "item-102-1",
        tipoPrenda: "Pantalón Jean Caballero",
        cantidad: 290,
        lote: "LT-872-A",
        procesos: [
          "Desengomado (Desizing)",
          "Lavado Enzimático",
          "Fijado de Índigo",
          "Suavizado Siliconado",
        ],
        manualidades: ["Bigotes (Whiskers)", "Focalizado (Spray PP)"],
      },
    ],
  },
  {
    id: "ord-sample-101",
    numeroOrden: "ORD-20261103-0101",
    fecha: "2026-11-03",
    fechaEntrega: "2026-11-06",
    despachadoPor: "CARLOS URIÑA",
    cliente: INITIAL_CLIENTS[2],
    observaciones: "Verificar nivel de grinding en bolsillos delanteros.",
    creadoEn: "2026-11-03T09:15:00.000Z",
    items: [
      {
        id: "item-101-1",
        tipoPrenda: "Short de Mezclilla",
        cantidad: 260,
        lote: "LT-865-D",
        procesos: [
          "Deslavado (Stone Wash)",
          "Blanqueo (Bleach)",
          "Neutralizado",
        ],
        manualidades: [
          "Roturas / Grinding",
          "Destroyer / Láser",
          "Lijado Localizado (Hand Sanding)",
        ],
      },
    ],
  },
];
