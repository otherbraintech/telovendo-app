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
      },
      include: {
        genMarketplaces: {
          take: 1,
          include: {
            device: {
              select: {
                serial: true,
                personName: true,
                redesSociales: true,
              }
            }
          }
        }
      }
    });

    return JSON.parse(JSON.stringify(publications));
  } catch (error) {
    console.error("Error fetching public publications:", error);
    return [];
  }
}
