"use server";

import prisma from "@/lib/prisma";
import { cookies } from "next/headers";
import { decrypt } from "@/lib/auth-utils";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

export async function getRealActivity() {
  const cookieStore = await cookies();
  const sessionString = cookieStore.get("session")?.value;
  
  if (!sessionString) return [];

  const session = await decrypt(sessionString);
  const userId = session.user.id;

  try {
    // 1. Obtener Proyectos recientes
    const projects = await prisma.project.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    // 2. Obtener Publicaciones (BotOrders) recientes
    const orders = await prisma.botOrder.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    // 3. Obtener Generaciones (GenMarketplace) recientes
    const generations = await prisma.genMarketplace.findMany({
      where: { userId },
      include: { botOrder: true },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    // Combinar y mapear a un formato común
    const activity: any[] = [];

    projects.forEach(p => {
      activity.push({
        id: `project-${p.id}`,
        type: "SUCCESS",
        category: "PROYECTO",
        event: "Proyecto Inicializado",
        rawTime: p.createdAt,
        time: formatDistanceToNow(p.createdAt, { addSuffix: true, locale: es }),
        details: `Se creó el proyecto '${p.name}'.`,
        status: "ACTIVE"
      });
    });

    orders.forEach(o => {
      activity.push({
        id: `order-${o.id}`,
        type: "INFO",
        category: "PUBLICACIÓN",
        event: "Orden de Publicación Creada",
        rawTime: o.createdAt,
        time: formatDistanceToNow(o.createdAt, { addSuffix: true, locale: es }),
        details: `Cargada publicación '${o.listingTitle || o.orderName}' con ${o.quantity} artículo(s).`,
        status: o.status
      });
    });

    generations.forEach(g => {
      activity.push({
        id: `gen-${g.id}`,
        type: g.status === "PUBLICADO" ? "SUCCESS" : "INFO",
        category: "BOT",
        event: g.status === "PUBLICADO" ? "Publicación Completada" : "Ciclo en Progreso",
        rawTime: g.createdAt,
        time: formatDistanceToNow(g.createdAt, { addSuffix: true, locale: es }),
        details: `El bot procesó la orden #${g.botOrder.id.slice(-6)} en el dispositivo ${g.deviceId || 'desconocido'}.`,
        status: g.status
      });
    });

    // Ordenar por tiempo descendente
    return activity.sort((a, b) => b.rawTime.getTime() - a.rawTime.getTime());

  } catch (error) {
    console.error("Error fetching activity:", error);
    return [];
  }
}
