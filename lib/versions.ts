export interface Feature {
  text: string;
  audience: "user" | "admin" | "all";
}

export interface ReleaseVersion {
  version: string;
  date: string;
  title: string;
  description: string;
  features: Feature[];
  type: "major" | "minor" | "patch";
}

export const CURRENT_VERSION = "1.3.0";

export const RELEASES: ReleaseVersion[] = [
  {
    version: "1.3.0",
    date: "2026-04-10",
    title: "Eco-sistema n8n & Contacto Directo",
    description: "Integración bidireccional con n8n para sincronización de estados y optimización del flujo de ventas público.",
    type: "minor",
    features: [
      { text: "WhatsApp Direct: Nuevo botón de contacto rápido en la página pública del Marketplace.", audience: "user" },
      { text: "Mensajería Contextual: Tus links de WhatsApp ahora incluyen el ID del producto automáticamente.", audience: "user" },
      { text: "Trazabilidad Marketplace: Almacenamiento y visualización de URLs reales de tus anuncios en Facebook.", audience: "user" },
      { text: "API Bridge para n8n: Sincronización automática de estados de publicación.", audience: "admin" },
      { text: "Búsqueda Inteligente: Endpoint de API mejorado con filtros avanzados.", audience: "admin" },
      { text: "Liberación de Recursos: Optimización inmediata de dispositivos tras completar tareas.", audience: "admin" }
    ]
  },
  {
    version: "1.2.0",
    date: "2026-04-10",
    title: "Optimización de IA & Asignación Segura",
    description: "Actualización principal centrada en la estabilidad de la IA, asignación evitando bots repetidos y contacto automatizado.",
    type: "minor",
    features: [
      { text: "Inyección automatizada de tu número de WhatsApp en las descripciones generadas.", audience: "user" },
      { text: "Lógica estricta de asignación: Evita que se repita el mismo WhatsApp en una publicación.", audience: "user" },
      { text: "Manejo robusto de errores de IA para una navegación más fluida.", audience: "all" },
      { text: "Patrón de respuesta estructurada para dar mejor feedback ante la moderación.", audience: "admin" },
      { text: "Tiempos de espera extendidos para generación de imágenes pesadas.", audience: "admin" }
    ]
  },
  {
    version: "1.1.0",
    date: "2026-04-05",
    title: "Mejoras de Funcionalidad UI",
    description: "Optimizaciones de la interfaz y soluciones a la gestión de bots y panel.",
    type: "minor",
    features: [
      { text: "Mejora en la ordenación de imágenes mediante Drag-and-Drop.", audience: "user" },
      { text: "Filtros de pedidos y publicaciones optimizados por proyecto.", audience: "user" },
      { text: "Monitorización del estado de bot en tiempo real (Versión inicial).", audience: "user" },
      { text: "Solventados problemas visuales detectados en el modo oscuro.", audience: "all" }
    ]
  },
  {
    version: "1.0.0",
    date: "2026-03-29",
    title: "Lanzamiento Inicial TeloVendo",
    description: "La plataforma base para la gestión de bot orchestrator en redes sociales.",
    type: "major",
    features: [
      { text: "Sistema de conexión multicliente y gestión base de la granja de bots.", audience: "admin" },
      { text: "Generación de publicaciones y envíos al feed de Marketplace.", audience: "user" },
      { text: "Caja de herramientas IA para mejorar descripciones y títulos de listados.", audience: "user" },
      { text: "Integración genérica de generación de fotos adaptadas usando Gemini 1.5 Flash.", audience: "all" }
    ]
  }
];
