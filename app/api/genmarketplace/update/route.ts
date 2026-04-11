import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

/**
 * POST /api/genmarketplace/update
 * 
 * Actualiza el estado de una publicación específica (GenMarketplace)
 * y realiza transiciones de estado automáticas en la orden y el dispositivo.
 * 
 * Body: { "id": number, "status": "PUBLICADO" | "CANCELADO" | "PENDIENTE" | "PAUSADO" }
 */
export async function POST(request: Request) {
  try {
    const { id, status } = await request.json();

    if (!id || !status) {
      return NextResponse.json(
        { success: false, error: "ID y status son requeridos" },
        { status: 400 }
      );
    }

    // 1. Obtener la publicación actual para saber qué orden y dispositivo afectará
    const currentGen = await prisma.genMarketplace.findUnique({
      where: { id: Number(id) },
      include: {
        botOrder: {
          include: {
            genMarketplaces: true
          }
        }
      }
    });

    if (!currentGen) {
      return NextResponse.json(
        { success: false, error: "Publicación no encontrada" },
        { status: 404 }
      );
    }

    // 2. Realizar la actualización en una transacción para asegurar consistencia
    const updated = await prisma.$transaction(async (tx) => {
      // A. Actualizar el estado de la publicación específica
      const updatedGen = await tx.genMarketplace.update({
        where: { id: Number(id) },
        data: { 
          status,
          updatedAt: new Date()
        }
      });

      // B. Si el estado es PUBLICADO o CANCELADO, liberar el dispositivo
      if (status === "PUBLICADO" || status === "CANCELADO") {
        if (currentGen.deviceId) {
          await tx.device.update({
            where: { id: currentGen.deviceId },
            data: { status: "LIBRE" }
          });
        }
      }

      // C. Verificar si todas las tareas de la orden están terminadas
      const orderId = currentGen.orderId;
      const allGens = await tx.genMarketplace.findMany({
        where: { orderId }
      });

      // Si todas están PUBLICADO o CANCELADO (y al menos una fue exitosa), marcar orden como COMPLETADA
      const finishedStates = ["PUBLICADO", "CANCELADO", "SINPUBLICAR"];
      const allFinished = allGens.every(g => 
        (g.id === Number(id) ? status : g.status) && finishedStates.includes(g.id === Number(id) ? status : g.status)
      );

      if (allFinished) {
        await tx.botOrder.update({
          where: { id: orderId },
          data: { status: "COMPLETADA" }
        });
      }

      return updatedGen;
    });

    return NextResponse.json({
      success: true,
      data: updated
    });

  } catch (error: any) {
    console.error("Error updating genmarketplace status:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Error interno del servidor" },
      { status: 500 }
    );
  }
}
