"use server";

import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth-utils";
import { revalidatePath } from "next/cache";

export async function createBotOrder(data: {
  projectId: string;
  orderName: string;
  listingTitle: string;
  listingPrice: number;
  listingCategory: any;
  listingCondition: any;
  listingDescription: string;
  listingAvailability: any;
  listingType?: any;
  quantity: number;
  imageUrls?: string[];
  // Campos extra
  vehicleYear?: number;
  vehicleMake?: string;
  vehicleModel?: string;
  vehicleMileage?: number;
  propRooms?: number;
  propBathrooms?: number;
  propArea?: number;
}) {
  const session = await getSession();
  if (!session) throw new Error("No session");

  const order = await prisma.botOrder.create({
    data: {
      projectId: data.projectId,
      userId: session.user.id,
      orderName: data.orderName,
      listingTitle: data.listingTitle,
      listingPrice: data.listingPrice,
      listingCategory: data.listingCategory,
      listingCondition: data.listingCondition,
      listingDescription: data.listingDescription,
      listingAvailability: data.listingAvailability,
      listingType: data.listingType || "ARTICULO",
      vehicleYear: data.vehicleYear,
      vehicleMake: data.vehicleMake,
      vehicleModel: data.vehicleModel,
      vehicleMileage: data.vehicleMileage,
      propRooms: data.propRooms,
      propBathrooms: data.propBathrooms,
      propArea: data.propArea,
      socialNetwork: "FACEBOOK",
      quantity: data.quantity,
      status: "LISTA",
      imageUrls: data.imageUrls || [],
    },
  });

  revalidatePath("/dashboard/orders");
  return JSON.parse(JSON.stringify(order));
}

export async function getOrdersByProject(projectId: string) {
  const session = await getSession();
  if (!session) return [];

  const orders = await prisma.botOrder.findMany({
    where: { 
      projectId,
      userId: session.user.id 
    },
    orderBy: { createdAt: "desc" },
  });
  
  return JSON.parse(JSON.stringify(orders));
}

export async function updateBotOrder(orderId: string, data: {
  listingTitle: string;
  listingPrice: number;
  listingCondition: any;
  listingCategory: any;
  listingDescription: string;
  listingType?: any;
  quantity: number;
  imageUrls?: string[];
  // Campos extra
  vehicleYear?: number;
  vehicleMake?: string;
  vehicleModel?: string;
  vehicleMileage?: number;
  propRooms?: number;
  propBathrooms?: number;
  propArea?: number;
}) {
  const session = await getSession();
  if (!session) throw new Error("No session");

  const updateData: any = {
    listingTitle: data.listingTitle,
    orderName: data.listingTitle,
    listingPrice: data.listingPrice,
    listingCondition: data.listingCondition,
    listingCategory: data.listingCategory,
    listingDescription: data.listingDescription,
    listingType: data.listingType,
    vehicleYear: data.vehicleYear,
    vehicleMake: data.vehicleMake,
    vehicleModel: data.vehicleModel,
    vehicleMileage: data.vehicleMileage,
    propRooms: data.propRooms,
    propBathrooms: data.propBathrooms,
    propArea: data.propArea,
    quantity: data.quantity,
  };

  if (data.imageUrls && data.imageUrls.length > 0) {
    updateData.imageUrls = data.imageUrls;
  }

  const order = await prisma.botOrder.update({
    where: { 
      id: orderId,
      userId: session.user.id // Ensure they own it
    },
    data: updateData,
  });

  revalidatePath("/dashboard/orders");
  return JSON.parse(JSON.stringify(order));
}

export async function sendOrderToBots(orderId: string) {
  const session = await getSession();
  if (!session) throw new Error("No session");

  // 1. Obtener la orden completa
  const order = await prisma.botOrder.findUnique({
    where: { id: orderId, userId: session.user.id },
  });
  if (!order) throw new Error("Orden no encontrada");

  const botCount = order.quantity || 1;

  // 2. Buscar devices libres
  const freeDevices = await prisma.device.findMany({
    where: { status: "LIBRE" },
    take: botCount,
  });

  if (freeDevices.length === 0) {
    throw new Error("No hay dispositivos disponibles");
  }

  const assignCount = Math.min(botCount, freeDevices.length);

  // 3. Generar variantes IA de título y descripción
  let variants: Array<{ title: string; description: string }>;
  try {
    const { generateBotVariants } = await import("@/lib/actions/ai");
    variants = await generateBotVariants(
      order.listingTitle || order.orderName,
      order.listingDescription || "",
      assignCount,
      order.listingCategory
    );
  } catch (err) {
    console.error("Error generating AI variants, using fallback:", err);
    // Fallback: variantes simples
    variants = Array.from({ length: assignCount }, (_, i) => ({
      title: `${order.listingTitle || order.orderName} ${["✨", "🔥", "⭐", "💎", "🎯"][i % 5]}`,
      description: order.listingDescription || "",
    }));
  }

  // 4. Crear GenMarketplace para cada device y marcarlos como OCUPADO
  const devicesToAssign = freeDevices.slice(0, assignCount);

  await prisma.$transaction(async (tx) => {
    for (let i = 0; i < devicesToAssign.length; i++) {
      const device = devicesToAssign[i];
      
      // El primer dispositivo usa los datos originales
      // Los demás usan las variantes generadas por IA
      const title = i === 0 ? (order.listingTitle || order.orderName) : (variants[i-1]?.title || variants[0]?.title);
      const description = i === 0 ? (order.listingDescription || "") : (variants[i-1]?.description || variants[0]?.description);

      await tx.genMarketplace.create({
        data: {
          orderId: order.id,
          userId: session.user.id,
          deviceId: device.id,
          genTitle: title,
          genDescription: description,
          imageUrls: order.imageUrls, // Las imágenes son las mismas para todos
          status: "PENDIENTE",
        },
      });

      await tx.device.update({
        where: { id: device.id },
        data: { status: "OCUPADO" },
      });
    }

    // 5. Actualizar orden a LISTA (Ya está lista para que el genFarmer la tome)
    await tx.botOrder.update({
      where: { id: orderId },
      data: { status: "LISTA" },
    });
  });

  const updated = await prisma.botOrder.findUnique({
    where: { id: orderId },
    include: { genMarketplaces: { include: { device: true } } },
  });

  revalidatePath("/dashboard/orders");
  return JSON.parse(JSON.stringify(updated));
}

export async function cancelBotOrder(orderId: string) {
  const session = await getSession();
  if (!session) throw new Error("No session");

  const order = await prisma.botOrder.update({
    where: { id: orderId, userId: session.user.id },
    data: { status: "CANCELADA" },
  });

  revalidatePath("/dashboard/orders");
  return JSON.parse(JSON.stringify(order));
}

export async function deleteBotOrder(orderId: string) {
  const session = await getSession();
  if (!session) throw new Error("No session");

  const order = await prisma.botOrder.delete({
    where: { id: orderId, userId: session.user.id },
  });

  revalidatePath("/dashboard/orders");
  return JSON.parse(JSON.stringify(order));
}

export async function getTotalOrdersCount() {
  const session = await getSession();
  if (!session) return 0;

  const count = await prisma.botOrder.count({
    where: { userId: session.user.id },
  });
  
  return count;
}
