import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth-utils";

export async function getDashboardStats() {
  const session = await getSession();
  if (!session) return null;

  const userId = session.user.id;

  // 1. Proyectos
  const totalProjects = await prisma.project.count({
    where: { userId, deletedAt: null }
  });

  const recentProjects = await prisma.project.findMany({
    where: { userId, deletedAt: null },
    orderBy: { createdAt: 'desc' },
    take: 5
  });

  // 2. Publicaciones (BotOrder)
  const totalOrders = await prisma.botOrder.count({
    where: { userId }
  });

  const ordersByStatus = await prisma.botOrder.groupBy({
    by: ['status'],
    where: { userId },
    _count: true
  });

  const activeOrders = await prisma.botOrder.count({
    where: { 
      userId, 
      status: { in: ['LISTA', 'GENERANDO', 'GENERADA', 'REINTENTAR', 'PAUSADA'] } 
    }
  });

  // 3. Ejecuciones de Bot (GenMarketplace)
  const totalGens = await prisma.genMarketplace.count({
    where: { userId }
  });

  const publishedGens = await prisma.genMarketplace.count({
    where: { userId, status: 'PUBLICADO' }
  });

  // 4. Publicaciones Efectivas (Basado exclusivo en Completadas)
  const effectivePublications = await prisma.botOrder.count({
    where: { 
      userId, 
      status: 'COMPLETADA' 
    }
  });

  // 5. Dispositivos
  const totalDevices = await prisma.device.count();
  const freeDevices = await prisma.device.count({
    where: { status: 'LIBRE' }
  });

  // 6. Categoría más usada
  const topCategory = await prisma.botOrder.groupBy({
    by: ['listingCategory'],
    where: { userId },
    _count: {
      listingCategory: true
    },
    orderBy: {
      _count: {
        listingCategory: 'desc'
      }
    },
    take: 1
  });

  return {
    projects: {
      total: totalProjects,
      recent: recentProjects
    },
    orders: {
      total: totalOrders,
      active: activeOrders,
      stats: ordersByStatus
    },
    bots: {
      totalExecutions: totalGens,
      published: effectivePublications, // Usamos las publicaciones reales aquí
      successRate: totalGens > 0 ? Math.round((publishedGens / totalGens) * 100) : 0
    },
    devices: {
      total: totalDevices,
      free: freeDevices
    },
    insights: {
      topCategory: topCategory[0]?.listingCategory || "N/A"
    }
  };
}
