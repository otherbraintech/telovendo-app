export interface ReleaseVersion {
  version: string;
  date: string;
  title: string;
  description: string;
  features: string[];
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
      "API Bridge para n8n: Actualización de estados automática mediante webhooks.",
      "Trazabilidad de Publicaciones: Almacenamiento de URLs reales de Facebook Marketplace enviadas por n8n.",
      "WhatsApp Direct: Refactorización total del marketplace público para contacto directo via WhatsApp.",
      "Mensajería Contextual: Inyección automática de ID de producto y referencia en chats de WhatsApp.",
      "Búsqueda Inteligente: Endpoint de API mejorado con filtros avanzados (Título + Descripción).",
      "Liberación Autómata de Recursos: Los dispositivos se liberan instantáneamente al completarse la publicación en n8n."
    ]
  },
  {
    version: "1.2.0",
    date: "2026-04-10",
    title: "Optimización de IA & Asignación Segura",
    description: "Actualización principal centrada en la estabilidad de la IA, asignación evitando bots repetidos y contacto automatizado.",
    type: "minor",
    features: [
      "Inyección automatizada de número de WhatsApp en las descripciones.",
      "Manejo robusto de errores de IA para evitar cierres o pantallas de caída en producción.",
      "Tiempos de espera extendidos y estables para la generación de diseño e imágenes en Vercel.",
      "Patrón de respuesta estructurada para dar mejor feedback ante la moderación de la IA.",
      "Lógica estricta de asignación de bots: bloquea idénticos WhatsApp/Facebook en la misma publicación.",
      "Mantenimiento visual: la imagen original de la IA ya no se sobreescribe y se añade a la cola."
    ]
  },
  {
    version: "1.1.0",
    date: "2026-04-05",
    title: "Mejoras de Funcionalidad UI",
    description: "Optimizaciones de la interfaz y soluciones a la gestión de bots y panel.",
    type: "minor",
    features: [
      "Mejora en la ordenación de imágenes mediante Drag-and-Drop.",
      "Filtros de pedidos y publicaciones optimizados por proyecto.",
      "Monitorización del estado de bot en tiempo real (Versión inicial).",
      "Solventados problemas visuales detectados en el modo oscuro."
    ]
  },
  {
    version: "1.0.0",
    date: "2026-03-29",
    title: "Lanzamiento Inicial TeloVendo",
    description: "La plataforma base para la gestión de bot orchestrator en redes sociales.",
    type: "major",
    features: [
      "Sistema de conexión multicliente y gestión base de la granja de bots.",
      "Generación de publicaciones y envíos al feed de Marketplace.",
      "Caja de herramientas IA para mejorar descripciones y títulos de listados.",
      "Integración genérica de generación de fotos adaptadas usando Gemini 1.5 Flash."
    ]
  }
];
