import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

/**
 * GET /api/genmarketplace/pending
 *
 * Devuelve todas las entradas de GenMarketplace con estado PENDIENTE,
 * incluyendo los datos del dispositivo (serial, modelo, alias, etc.).
 *
 * Se usa desde n8n u otros sistemas externos para obtener la cola de
 * publicaciones pendientes de ser procesadas por los bots.
 *
 * Query params opcionales:
 *   - deviceId: filtrar por un device específico
 *   - limit: máximo de registros a devolver (default: 100)
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const deviceId = searchParams.get("deviceId") ?? undefined;
  const id = searchParams.get("id") ?? undefined;
  const orderId = searchParams.get("orderId") ?? undefined;
  const search = searchParams.get("search") ?? undefined;
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "100"), 500);

  const pending = await prisma.genMarketplace.findMany({
    where: {
      status: "PENDIENTE",
      ...(deviceId ? { deviceId } : {}),
      ...(id ? { id: Number(id) } : {}),
      ...(orderId ? { orderId } : {}),
      ...(search ? {
        OR: [
          { genTitle: { contains: search, mode: 'insensitive' as const } },
          { genDescription: { contains: search, mode: 'insensitive' as const } },
        ]
      } : {}),
    },
    take: limit,
    orderBy: { createdAt: "asc" },
    include: {
      botOrder: true,
      device: {
        select: {
          id: true,
          serial: true,
          model: true,
          alias: true,
          label: true,
          triggerId: true,
          personName: true,
          status: true,
          redesSociales: true,
        },
      },
    },
  });

  const data = pending.map((gen) => ({
    id: gen.id,
    orderId: gen.orderId,
    userId: gen.userId,
    status: gen.status,
    genTitle: gen.genTitle,
    genDescription: gen.genDescription,
    imageUrls: gen.imageUrls,
    createdAt: gen.createdAt,
    updatedAt: gen.updatedAt,
    // Datos de la publicación (botOrder)
    listing: {
      price: gen.botOrder.listingPrice,
      category: gen.botOrder.listingCategory,
      condition: gen.botOrder.listingCondition,
      availability: gen.botOrder.listingAvailability,
      type: gen.botOrder.listingType,
      currency: gen.botOrder.listingCurrency,
      // Si es vehículo
      vehicleYear: gen.botOrder.vehicleYear,
      vehicleMake: gen.botOrder.vehicleMake,
      vehicleModel: gen.botOrder.vehicleModel,
      vehicleMileage: gen.botOrder.vehicleMileage,
      // Si es propiedad
      propRooms: gen.botOrder.propRooms,
      propBathrooms: gen.botOrder.propBathrooms,
      propArea: gen.botOrder.propArea,
    },
    // Device info
    device: gen.device
      ? {
          id: gen.device.id,
          serial: gen.device.serial,
          model: gen.device.model,
          alias: gen.device.alias,
          label: gen.device.label,
          triggerId: gen.device.triggerId,
          personName: gen.device.personName,
          status: gen.device.status,
          redesSociales: gen.device.redesSociales,
        }
      : null,
  }));

  return NextResponse.json({
    success: true,
    total: data.length,
    data,
  });
}
