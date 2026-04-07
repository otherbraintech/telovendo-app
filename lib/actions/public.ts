"use server";

import prisma from "@/lib/prisma";

export async function getPublicPublications() {
  try {
    const publications = await prisma.botOrder.findMany({
      where: {
        status: "GENERADA"
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    // Mapeamos para que la UI no se rompa (si antes esperaba genMarketplace)
    // O simplemente devolvemos BotOrders. 
    // La UI de marketplace ya está usando campos compartidos.

    return JSON.parse(JSON.stringify(publications));
  } catch (error) {
    console.error("Error fetching public publications:", error);
    return [];
  }
}
