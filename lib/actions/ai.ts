"use server";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const UPLOAD_URL = "https://otherbrain-tech-ob-files-oficial.ddt6vc.easypanel.host/api/upload";

function getApiKey(): string | null {
  return process.env.OPEN_ROUTER_TOKEN || null;
}

function getUploadToken(): string | null {
  return process.env.NEXT_PUBLIC_UPLOAD_TOKEN || null;
}

export interface AIActionResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// ─── MEJORAR TÍTULO ──────────────────────────────────────────────
export async function improveTitle(
  currentTitle: string,
  category?: string
): Promise<AIActionResult<string>> {
  const apiKey = getApiKey();
  if (!apiKey) return { success: false, error: "OPEN_ROUTER_TOKEN no configurado" };

  try {
    const systemPrompt = `Eres un experto en ventas para Facebook Marketplace en Latinoamérica. 
Tu trabajo es reescribir títulos de productos para que sean claros, directos y atractivos SIN usar formatos especiales.

REGLAS:
- Máximo 100 caracteres.
- TEXTO PLANO ÚNICAMENTE: Prohibido usar asteriscos, negritas, emojis o símbolos decorativos.
- Escribe como una persona real, no como una IA o un anuncio publicitario.
- CRÍTICO: PROHIBIDO incluir números de teléfono o cualquier dato de contacto.
- Responde SOLO con el título mejorado, sin explicaciones ni comillas.`;

    const userPrompt = `Mejora este título de producto para Facebook Marketplace:
"${currentTitle}"${category ? `\nCategoría: ${category}` : ""}`;

    const res = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "openai/gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        max_tokens: 150,
        temperature: 0.8,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      return { success: false, error: `OpenRouter error: ${err}` };
    }

    const data = await res.json();
    return { 
      success: true, 
      data: data.choices?.[0]?.message?.content?.trim() || currentTitle 
    };
  } catch (error: any) {
    console.error("Error in improveTitle:", error);
    return { success: false, error: error.message || "Error desconocido al mejorar el título" };
  }
}

// ─── MEJORAR DESCRIPCIÓN ────────────────────────────────────────
export async function improveDescription(
  currentTitle: string,
  currentDescription: string,
  category?: string,
  botPhone?: string
): Promise<AIActionResult<string>> {
  const apiKey = getApiKey();
  if (!apiKey) return { success: false, error: "OPEN_ROUTER_TOKEN no configurado" };

  try {
    const systemPrompt = `Eres un experto en ventas para Facebook Marketplace en Latinoamérica. 
Tu trabajo es reescribir descripciones de productos para que suenen como un vendedor REAL y DIRECTO en Facebook.

ESTILO REQUERIDO:
- TEXTO PLANO ÚNICAMENTE: Prohibido usar emojis, asteriscos (**), negritas o formatos especiales.
- Escribe de forma natural, como una persona normal publicando un anuncio rápido.
- Usa lenguaje directo: describe qué es, qué hace y cuánto cuesta.

REGLAS DE CONTENIDO:
1. MANTÉN DATOS TÉCNICOS: Si hay modelos (ej: T10, T11), tallas o precios de variantes, inclúyelos siempre.
2. CONSERVA LAS VARIANTES: Si hay varios modelos con precios distintos, lístalos claramente en líneas separadas sin usar símbolos especiales.
${botPhone ? `3. INCLUYE ESTE CONTACTO: Al final de la descripción, agrega "📲 WhatsApp para consultas: ${botPhone}". Es el único contacto permitido.` : "3. ELIMINA EL CONTACTO: Nada de teléfonos, WhatsApp, enlaces o redes sociales. Indica que pregunten por inbox."}
4. Nada de mayúsculas excesivas o lenguaje publicitario rebuscado.

Responde SOLO con el texto de la descripción, sin explicaciones ni comillas.`;

    const userPrompt = `Mejora esta descripción para Facebook Marketplace:
Título: "${currentTitle}"
Descripción actual: "${currentDescription}"${category ? `\nCategoría: ${category}` : ""}`;

    const res = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "openai/gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        max_tokens: 600,
        temperature: 0.8,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      return { success: false, error: `OpenRouter error: ${err}` };
    }

    const data = await res.json();
    return { 
      success: true, 
      data: data.choices?.[0]?.message?.content?.trim() || currentDescription 
    };
  } catch (error: any) {
    console.error("Error in improveDescription:", error);
    return { success: false, error: error.message || "Error desconocido al mejorar la descripción" };
  }
}

// ─── ANALIZAR SEGURIDAD DE IMAGEN ──────────────────────────────
export async function analyzeImageSecurity(imageSource: string): Promise<{ safe: boolean; reason?: string }> {
  const apiKey = getApiKey();

  const prompt = `Analiza esta imagen para una publicación de Marketplace en BOLIVIA de forma ULTRA-PERMISIVA y FLEXIBLE.
  Tu ÚNICA misión es bloquear publicidad DELIBERADA o métodos de pago directo.

  Marca como NO SEGURA (safe: false) ÚNICAMENTE si detectas con ALTA CERTEZA:
  1. Números de teléfono de BOLIVIA (8 dígitos que empiecen con 6 o 7) que hayan sido AÑADIDOS DIGITALMENTE sobre la foto o escritos en carteles GRANDES y CLAROS con el fin obvio de evadir el sistema para contacto directo.
  2. Códigos QR de BANCOS o PAGOS (ej: QR de Banco Unión, BNB, Mercantil, BCP o Simple) destinados claramente a transacciones de cobro.
  3. Enlaces web (.com, .bo) añadidos artificialmente sobre la foto.

  IGNORA TOTALMENTE (safe: true) y NO BLOQUEES por:
  - TEXTO EN PANTALLAS DE FONDO (monitores, TVs, laptops encendidas). Es normal que aparezcan textos o números aleatorios en pantallas de fondo.
  - CARTELES, AFICHES o DECORACIÓN DE FONDO que no sean el objeto principal.
  - CUALQUIER texto que sea pequeño, borroso, inclinado o que sea parte natural del entorno (etiquetas, manuales, teclados, s/n).
  - Si tienes la mínima duda de si un número es un teléfono o simplemente ruido visual del fondo, marca como SEGURO (safe: true).

  Responde EXCLUSIVAMENTE con un objeto JSON:
  {
    "safe": true | false,
    "reason": "Solo explica brevemente si detectaste con TOTAL CERTEZA un teléfono de contacto o un QR de banco"
  }`;

  let imageContent: Record<string, unknown>;
  if (imageSource.startsWith("data:")) {
    imageContent = { type: "image_url", image_url: { url: imageSource } };
  } else {
    const imgRes = await fetch(imageSource);
    const arrayBuffer = await imgRes.arrayBuffer();
    const contentType = imgRes.headers.get("content-type") || "image/jpeg";
    const base64 = Buffer.from(arrayBuffer).toString("base64");
    imageContent = { type: "image_url", image_url: { url: `data:${contentType};base64,${base64}` } };
  }

  try {
    const res = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.0-flash-001",
        messages: [{
          role: "user",
          content: [{ type: "text", text: prompt }, imageContent],
        }],
        max_tokens: 150,
        temperature: 0.1,
      }),
    });

    if (!res.ok) return { safe: true }; // Fallback a seguro si falla la IA

    const data = await res.json();
    const raw = data.choices?.[0]?.message?.content?.trim() || "{}";
    const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    return JSON.parse(cleaned);
  } catch (error) {
    console.error("Error en analyzeImageSecurity:", error);
    return { safe: true };
  }
}

// ─── ANALIZAR IMAGEN DE PRODUCTO GENERAL ───────────────────────
export async function analyzeProductImage(imageSource: string): Promise<any> {
  const apiKey = getApiKey();

  const prompt = `Analiza esta imagen de un producto y extrae información para una publicación de Facebook Marketplace en Latinoamérica.
  Responde EXCLUSIVAMENTE con un objeto JSON (sin markdown, sin backticks, sin caracteres extra) con esta estructura:
  {
    "listingTitle": "Título atractivo y directo del producto en español (máx 100 caracteres)",
    "listingDescription": "Descripción detallada en español: qué es, características visibles, estado aparente, material, color, tamaño si aplica (máx 400 caracteres)",
    "listingCategory": "Una de: ELECTRONICA | ROPA_Y_ACCESORIOS | HOGAR_Y_JARDIN | JUGUETES_Y_JUEGOS | DEPORTES | INSTRUMENTOS_MUSICALES | MUEBLES | ELECTRODOMESTICOS | VARIOS",
    "listingCondition": "Una de: NUEVO | USADO_COMO_NUEVO | USADO_BUENO | USADO_REGULAR"
  }
  
  Reglas:
  1. TODO el texto debe estar en ESPAÑOL.
  2. PROHIBIDO incluir números de teléfono, precios, WhatsApp o datos de contacto.
  3. El título debe ser claro y específico: "Samsung Galaxy A54 128GB Negro" en lugar de "Teléfono".
  4. Si el producto se ve nuevo en el empaque, usa "NUEVO". Si tiene uso visible, usa "USADO_BUENO".
  5. Sé específico con la categoría basándote en lo que ves en la imagen.`;

  let imageContent: Record<string, unknown>;

  if (imageSource.startsWith("data:")) {
    imageContent = { type: "image_url", image_url: { url: imageSource } };
  } else {
    const imgRes = await fetch(imageSource);
    const arrayBuffer = await imgRes.arrayBuffer();
    const contentType = imgRes.headers.get("content-type") || "image/jpeg";
    const base64 = Buffer.from(arrayBuffer).toString("base64");
    imageContent = { type: "image_url", image_url: { url: `data:${contentType};base64,${base64}` } };
  }

  try {
    const res = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.0-flash-001",
        messages: [{
          role: "user",
          content: [{ type: "text", text: prompt }, imageContent],
        }],
        max_tokens: 500,
        temperature: 0.2,
      }),
    });

    if (!res.ok) throw new Error("Error analizando imagen con IA");

    const data = await res.json();
    const raw = data.choices?.[0]?.message?.content?.trim() || "{}";
    const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    return JSON.parse(cleaned);
  } catch (error) {
    console.error("Error en analyzeProductImage:", error);
    return null;
  }
}

// ─── ANALIZAR IMAGEN DE VEHÍCULO ───────────────────────────────
export async function analyzeVehicleImage(imageSource: string): Promise<any> {
  const apiKey = getApiKey();

  const prompt = `Analiza detalladamente esta foto de un vehículo y extrae la información técnica para una publicación de venta profesional EN ESPAÑOL.
  Responde EXCLUSIVAMENTE con un objeto JSON (sin markdown, sin bloques de código, sin caracteres extra) con esta estructura:
  {
    "listingTitle": "Título atractivo y profesional en español",
    "vehicleYear": 2024,
    "vehicleMake": "Marca",
    "vehicleModel": "Modelo",
    "listingCategory": "AUTOS_Y_CAMIONETAS" | "MOTOS" | "CAMIONES_Y_MAQUINARIA",
    "listingDescription": "Descripción detallada EN ESPAÑOL basada en lo que ves (estado, color, accesorios visibles, etc.)"
  }
  
  Reglas críticas:
  1. TODO EL TEXTO DEBE ESTAR EN ESPAÑOL.
  2. PROHIBIDO incluir números de teléfono, WhatsApp o bloques de "Contacto" en la descripción.
  3. Solo describe el vehículo y sus características técnicas.
  4. Si no estás seguro de algún dato técnico, deja el campo con un valor genérico razonable.`;

  let imageContent: Record<string, unknown>;

  if (imageSource.startsWith("data:")) {
    imageContent = { type: "image_url", image_url: { url: imageSource } };
  } else {
    const imgRes = await fetch(imageSource);
    const arrayBuffer = await imgRes.arrayBuffer();
    const contentType = imgRes.headers.get("content-type") || "image/jpeg";
    const base64 = Buffer.from(arrayBuffer).toString("base64");
    imageContent = { type: "image_url", image_url: { url: `data:${contentType};base64,${base64}` } };
  }

  const res = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "google/gemini-2.0-flash-001",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            imageContent,
          ],
        },
      ],
      max_tokens: 500,
      temperature: 0.2, // Baja temperatura para mayor precisión técnica
    }),
  });

  if (!res.ok) throw new Error("Error analizando imagen con IA");

  const data = await res.json();
  const raw = data.choices?.[0]?.message?.content?.trim() || "{}";
  
  try {
    const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    return JSON.parse(cleaned);
  } catch {
    return null;
  }
}

// ─── GENERAR IMAGEN ALTERNATIVA ─────────────────────────────────
// ─── GENERAR IMAGEN ALTERNATIVA ─────────────────────────────────
export async function generateProductImage(
  title: string,
  description: string
): Promise<AIActionResult<string>> {
  const apiKey = getApiKey();
  const uploadToken = getUploadToken();
  if (!apiKey) return { success: false, error: "OPEN_ROUTER_TOKEN no configurado" };
  if (!uploadToken) return { success: false, error: "NEXT_PUBLIC_UPLOAD_TOKEN no configurado" };

  try {
    const prompt = `Generate a professional, clean product photo for a Facebook Marketplace listing.
Product: ${title}
Details: ${description || "No additional details"}
Style: Professional product photography on a clean white/light background, well-lit, high quality. CRITICAL: NO TEXT, NO LETTERS, NO WORDS, NO OVERLAYS, NO WATERMARKS. ONLY THE PRODUCT.`;

    const res = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-3.1-flash-image-preview",
        messages: [{ role: "user", content: prompt }],
        modalities: ["image", "text"],
        max_tokens: 4000,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      return { success: false, error: `OpenRouter error: ${err}` };
    }

    const data = await res.json();
    const images = data.choices?.[0]?.message?.images;
    let base64Image: string | null = null;
    let mimeType = "image/png";

    if (Array.isArray(images) && images.length > 0) {
      for (const img of images) {
        if (img.image_url?.url) {
          const dataUrl = img.image_url.url as string;
          if (dataUrl.startsWith("data:")) {
            const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
            if (match) {
              mimeType = match[1];
              base64Image = match[2];
              break;
            }
          }
        }
      }
    }

    if (!base64Image) {
      return { success: false, error: "La IA no devolvió ninguna imagen en el formato esperado." };
    }

    const uploadRes = await fetch(UPLOAD_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token_project: uploadToken,
        filename: `ai_gen_${Date.now()}.png`,
        file: base64Image,
        mimeType,
      }),
    });

    const uploadData = await uploadRes.json();
    if (!uploadData.success || (!uploadData.nanobanana && !uploadData.url)) {
      return { success: false, error: "Error subiendo la imagen al servidor de archivos." };
    }

    return { 
      success: true, 
      data: uploadData.nanobanana ?? uploadData.url 
    };
  } catch (error: any) {
    console.error("Error in generateProductImage:", error);
    return { success: false, error: error.message || "Error desconocido al generar la imagen" };
  }
}

export type ImproveType = "CLEAN" | "PERSPECTIVE" | "STUDIO";

// ─── MEJORAR IMAGEN EXISTENTE ───────────────────────────────────
// Acepta imageUrl (URL pública) o base64Data (datos base64 directos con mimeType)
export async function improveProductImage(
  imageSource: string, // URL pública o data URL base64 (data:image/...;base64,...)
  title: string,
  description: string,
  improveType: ImproveType = "CLEAN"
): Promise<AIActionResult<string>> {
  const apiKey = getApiKey();
  const uploadToken = getUploadToken();
  if (!apiKey) return { success: false, error: "OPEN_ROUTER_TOKEN no configurado" };
  if (!uploadToken) return { success: false, error: "NEXT_PUBLIC_UPLOAD_TOKEN no configurado" };

  try {
    let typePrompt = "";
    if (improveType === "CLEAN") {
      typePrompt = `
      1. Keep the EXACT same product and position shown in the original image. Do not change its core design, shape, or colors.
      2. Place the product on a simple, clean, solid white background.
      3. Remove all background noise, clutter, or distracting elements.
      4. Focus on clarity and sharp details.
      5. CRITICAL: NO TEXT, NO LETTERS, NO WORDS, NO OVERLAYS. ONLY THE PRODUCT.`;
    } else if (improveType === "PERSPECTIVE") {
      typePrompt = `
      1. Keep the EXACT same product shown in the original image.
      2. Change the camera angle and perspective to a dynamic, professional 3/4 view or a different interesting angle to appreciate the product better.
      3. Place the product in a clean, minimalist context (like a wooden table or a marble surface if appropriate) or a solid professional background.
      4. Improve lighting to show texture and depth.
      5. CRITICAL: NO TEXT, NO LETTERS, NO WORDS, NO OVERLAYS. ONLY THE PRODUCT.`;
    } else if (improveType === "STUDIO") {
      typePrompt = `
      1. Keep the EXACT same product shown in the original image.
      2. Create a "Studio/Lifestyle" shot. Place the product in a high-end, aesthetically pleasing environment (e.g., a modern living room for home items, a tech desk for electronics).
      3. The lighting should be cinematic and premium.
      4. Use a shallow depth of field (bokeh effect) to make the product stand out.
      5. CRITICAL: NO TEXT, NO LETTERS, NO WORDS, NO OVERLAYS. ONLY THE PRODUCT.`;
    }

    const prompt = `Based on the provided image, generate an improved product photo for "${title}".
Product: ${title}
Details: ${description || "No additional details"}
Style strict rules: ${typePrompt}
The goal is to focus 100% on the product and make it look premium and professional for a marketplace listing. 
CRITICAL RULE: DO NOT INCLUDE ANY TEXT, LETTERS, NUMBERS, WORDS, OR TITLES IN THE IMAGE.`;

    // Determinar si es una data URL o una URL externa
    let imageContent: Record<string, unknown>;

    if (imageSource.startsWith("data:")) {
      imageContent = {
        type: "image_url",
        image_url: { url: imageSource },
      };
    } else {
      // URL externa: descargar y convertir a base64
      const imgRes = await fetch(imageSource);
      if (!imgRes.ok) return { success: false, error: "No se pudo descargar la imagen original" };
      const arrayBuffer = await imgRes.arrayBuffer();
      const contentType = imgRes.headers.get("content-type") || "image/jpeg";
      const base64 = Buffer.from(arrayBuffer).toString("base64");
      const dataUrl = `data:${contentType};base64,${base64}`;
      imageContent = {
        type: "image_url",
        image_url: { url: dataUrl },
      };
    }

    const res = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-3.1-flash-image-preview",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              imageContent,
            ],
          },
        ],
        modalities: ["image", "text"],
        max_tokens: 4000,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      return { success: false, error: `OpenRouter error: ${err}` };
    }

    const data = await res.json();
    const images = data.choices?.[0]?.message?.images;
    let base64Image: string | null = null;
    let mimeType = "image/png";

    if (Array.isArray(images) && images.length > 0) {
      for (const img of images) {
        if (img.image_url?.url) {
          const dataUrl = img.image_url.url as string;
          if (dataUrl.startsWith("data:")) {
            const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
            if (match) {
              mimeType = match[1];
              base64Image = match[2];
              break;
            }
          }
        }
      }
    }

    if (!base64Image) {
      return { success: false, error: "La IA no pudo procesar o mejorar la imagen." };
    }

    const uploadRes = await fetch(UPLOAD_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token_project: uploadToken,
        filename: `ai_improve_${Date.now()}.png`,
        file: base64Image,
        mimeType,
      }),
    });

    const uploadData = await uploadRes.json();
    if (!uploadData.success || (!uploadData.nanobanana && !uploadData.url)) {
      return { success: false, error: "Error subiendo la imagen mejorada al servidor de archivos." };
    }

    return { 
      success: true, 
      data: uploadData.nanobanana ?? uploadData.url 
    };
  } catch (error: any) {
    console.error("Error in improveProductImage:", error);
    return { success: false, error: error.message || "Error desconocido al mejorar la imagen" };
  }
}

// ─── GENERAR VARIANTES PARA BOTS ────────────────────────────────
export async function generateBotVariants(
  title: string,
  description: string,
  botCount: number,
  category?: string
): Promise<AIActionResult<Array<{ title: string; description: string }>>> {
  const apiKey = getApiKey();
  if (!apiKey) return { success: false, error: "OPEN_ROUTER_TOKEN no configurado" };

  try {
    const systemPrompt = `Eres un experto en ventas para Facebook Marketplace en Latinoamérica.
Genera variantes ÚNICAS de un título y descripción de un producto. Cada variante debe parecer escrita por una persona diferente.
Reglas:
- Cada título máximo 100 caracteres
- Cada descripción máximo 500 caracteres  
- Varía el tono: informal, profesional, entusiasta, directo, etc.
- PROHIBIDO USAR EMOJIS O ICONOS en el título o en la descripción. Deben estar completamente limpios de emojis.
- Mantén la información del producto pero con diferentes palabras
- Responde en formato JSON PURO (sin markdown, sin backticks), un array de objetos: [{"title":"...","description":"..."},...]`;

    const userPrompt = `Genera ${botCount} variantes para este producto:
Título original: "${title}"
Descripción original: "${description}"${category ? `\nCategoría: ${category}` : ""}

Responde SOLO con el JSON array, nada más.`;

    const res = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "openai/gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        max_tokens: botCount * 400,
        temperature: 0.9,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      return { success: false, error: `OpenRouter error: ${err}` };
    }

    const data = await res.json();
    const raw = data.choices?.[0]?.message?.content?.trim() || "[]";

    // Limpiar posible markdown wrapper
    const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const parsed = JSON.parse(cleaned) as Array<{ title: string; description: string }>;
    
    return { 
      success: true, 
      data: parsed.slice(0, botCount) 
    };
  } catch (error: any) {
    console.error("Error generating AI variants:", error);
    // Fallback integrado en el resultado exitoso para no romper el flujo de publicación
    const fallback = Array.from({ length: botCount }, (_, i) => ({
      title: `${title} - Opción ${i + 1}`,
      description: description,
    }));
    return { success: true, data: fallback, error: "Usando variantes de seguridad por error técnico" };
  }
}
