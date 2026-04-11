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

export const CURRENT_VERSION = "1.3.5";

export const RELEASES: ReleaseVersion[] = [
  {
    version: "1.3.5",
    date: "2026-04-11",
    title: "Panel de Gestión & Estabilidad Visual",
    description: "Nuevas herramientas administrativas y optimización de la interfaz para una navegación sin interrupciones.",
    type: "patch",
    features: [
      { text: "Gestión Global (Admin): Nuevo panel maestro para supervisar todas las publicaciones del ecosistema en tiempo real.", audience: "admin" },
      { text: "Optimización Responsiva: Eliminado el scroll horizontal en las tablas; ahora tus proyectos se adaptan perfectamente a cualquier pantalla.", audience: "user" },
      { text: "Lectura Rápida: Las descripciones largas ahora se resumen automáticamente para que puedas gestionar tus bots más rápido.", audience: "user" },
      { text: "Control Individual: Ahora puedes pausar o reanudar cada bot de forma independiente por variante.", audience: "user" },
      { text: "Filtro de Relevancia: La página de novedades ahora solo te muestra lo que realmente impacta en tu flujo de trabajo.", audience: "user" }
    ]
  },
  {
    version: "1.3.0",
    date: "2026-04-10",
    title: "Eco-sistema Marketplace & Contacto Directo",
    description: "Optimizaciones en la web pública y nuevas herramientas para mejorar tus ventas directas por WhatsApp.",
    type: "minor",
    features: [
      { text: "WhatsApp Direct: Nuevo botón de contacto rápido en la página pública del Marketplace.", audience: "user" },
      { text: "Mensajería Contextual: Tus links de WhatsApp ahora incluyen el ID del producto automáticamente.", audience: "user" },
      { text: "Market Explorer: Historial de precios y visualización de URLs reales de tus anuncios en Facebook.", audience: "user" },
      { text: "Sincronización Inteligente: Mejora en la actualización de estados entre tus bots y el panel central.", audience: "all" }
    ]
  },
  {
    version: "1.2.0",
    date: "2026-04-10",
    title: "Optimización de IA para tus Ventas",
    description: "Actualización centrada en facilitar el contacto automatizado y la calidad de tus publicaciones generadas.",
    type: "minor",
    features: [
      { text: "Inyección inteligente de tu número de WhatsApp en las descripciones generadas por la IA.", audience: "user" },
      { text: "Lógica de Variantes: Evita que se repitan títulos o números de contacto en una misma campaña.", audience: "user" },
      { text: "IA Visual: Mejoras en la generación de imágenes adaptadas para que tus productos luzcan mejor.", audience: "user" },
      { text: "Navegación Fluida: Correcciones en la interfaz para una carga más rápida de tus proyectos.", audience: "all" }
    ]
  },
  {
    version: "1.1.0",
    date: "2026-04-05",
    title: "Mejoras de Funcionalidad y Diseño",
    description: "Optimizaciones de la interfaz y nuevas herramientas para la organización de tus fotos y pedidos.",
    type: "minor",
    features: [
      { text: "Organización Multimedia: Mejora en la ordenación de imágenes mediante Drag-and-Drop.", audience: "user" },
      { text: "Filtros Avanzados: Localiza tus publicaciones y proyectos más rápido con el nuevo buscador por categorías.", audience: "user" },
      { text: "Mis Bots en Vivo: Monitorización del estado de cada bot en tiempo real con mayor precisión.", audience: "user" },
      { text: "Modo Oscuro Personalizado: Mejoras visuales en los contrastes para una mejor lectura nocturna.", audience: "all" }
    ]
  },
  {
    version: "1.0.0",
    date: "2026-03-29",
    title: "Lanzamiento Oficial TeloVendo",
    description: "Tu nueva plataforma integral para automatizar tus ventas en redes sociales.",
    type: "major",
    features: [
      { text: "Generación de Publicaciones: Crea cientos de variantes de tus productos en segundos.", audience: "user" },
      { text: "Marketplace Integrado: Sincroniza tus productos directamente con nuestro Market Explorer.", audience: "user" },
      { text: "Caja de herramientas IA: Mejora títulos y descripciones para SEO usando inteligencia artificial.", audience: "user" },
      { text: "Panel de Gestión: Control total sobre tus proyectos, publicaciones y bots asignados.", audience: "user" }
    ]
  }
];
