"use server";

import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth-utils";
import { revalidatePath } from "next/cache";
import { syncDevices } from "./devices";

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
  selectedDeviceIds?: string[];
  listingCurrency?: any;
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

  const project = await prisma.project.findUnique({
    where: { id: data.projectId, userId: session.user.id }
  });

  if (!project) {
    throw new Error("Proyecto no encontrado. Por favor, asegúrate de haber creado y seleccionado un proyecto válido en el menú lateral.");
  }

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
      selectedDeviceIds: data.selectedDeviceIds || [],
      listingCurrency: data.listingCurrency || "BOLIVIANO",
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
    include: {
      genMarketplaces: {
        include: { device: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Reconciliación de estados automática: 
  // Si una orden está "GENERANDO" pero todas sus sub-tareas (genMarketplace) están "PUBLICADO", 
  // entonces la orden debe pasar a "GENERADA".
  const processedOrders = await Promise.all(orders.map(async (order) => {
    if (order.status === "GENERANDO" && order.genMarketplaces.length > 0) {
      const allPublic = order.genMarketplaces.every(m => m.status === "PUBLICADO");
      if (allPublic) {
        // Actualizamos en DB (silenciosamente) para futuras lecturas
        const updated = await prisma.botOrder.update({
          where: { id: order.id },
          data: { status: "GENERADA" },
          include: { genMarketplaces: { include: { device: true } } }
        });
        return updated;
      }
    }
    return order;
  }));
  
  return JSON.parse(JSON.stringify(processedOrders));
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
  selectedDeviceIds?: string[];
  listingCurrency?: any;
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
    listingCurrency: data.listingCurrency,
  };

  if (data.imageUrls && data.imageUrls.length > 0) {
    updateData.imageUrls = data.imageUrls;
  }

  if (data.selectedDeviceIds) {
    updateData.selectedDeviceIds = data.selectedDeviceIds;
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
  // 0. Sincronizar dispositivos antes de buscar libres (Asegurar estado real)
  await syncDevices().catch(err => console.error("Sync error before sending:", err));

  // 1. Obtener la orden completa
  const order = await prisma.botOrder.findUnique({
    where: { id: orderId, userId: session.user.id },
  });
  if (!order) throw new Error("Orden no encontrada");

  let botCount = order.quantity || 1;
  let devicesToAssign: any[] = [];

  // Modo automático: buscar devices libres
  const allFreeDevices = await prisma.device.findMany({
    where: { status: "LIBRE" },
  });

  // Filtrar dispositivos que tengan cuenta de WhatsApp y Facebook
  const validDevices = allFreeDevices.filter((d: any) => {
    if (!Array.isArray(d.redesSociales)) return false;
    const hasWa = d.redesSociales.some((r: any) => r.red_social === 'whatsapp');
    const hasFb = d.redesSociales.some((r: any) => r.red_social === 'facebook');
    return hasWa && hasFb;
  });

  if (validDevices.length === 0) {
    throw new Error("No hay dispositivos LIBRES con cuentas de WhatsApp y Facebook disponibles en este momento.");
  }
  
  devicesToAssign = validDevices.slice(0, botCount);
  const assignCount = devicesToAssign.length;

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
  // devicesToAssign ya está definido arriba

  await prisma.$transaction(async (tx) => {
    for (let i = 0; i < devicesToAssign.length; i++) {
      const device = devicesToAssign[i];
      
      // El primer dispositivo usa los datos originales
      // Los demás usan las variantes generadas por IA
      const title = i === 0 ? (order.listingTitle || order.orderName) : (variants[i-1]?.title || variants[0]?.title);
      const description = i === 0 ? (order.listingDescription || "") : (variants[i-1]?.description || variants[0]?.description);
      
      // Añadir número de contacto
      const waAccount = Array.isArray(device.redesSociales) ? (device.redesSociales as any[]).find((r: any) => r.red_social === "whatsapp") : null;
      const botPhone = (waAccount?.telefono_asociado || waAccount?.user) || "";
      const descriptionWithContact = botPhone ? `${description.trim()}\n\n📲 Contacto: ${botPhone}` : description;

      await tx.genMarketplace.create({
        data: {
          orderId: order.id,
          userId: session.user.id,
          deviceId: device.id,
          genTitle: title,
          genDescription: descriptionWithContact,
          imageUrls: order.imageUrls, // Las imágenes son las mismas para todos
          status: "PAUSADO", // Se crea pausado para que el usuario inicie manualmente
        },
      });

      await tx.device.update({
        where: { id: device.id },
        data: { status: "OCUPADO" },
      });
    }

    // 5. Actualizar orden a GENERADA (Ya fue derivada a todos los bots asignados exitosamente)
    await tx.botOrder.update({
      where: { id: orderId },
      data: { status: "GENERADA" },
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

  const order = await prisma.$transaction(async (tx) => {
    // 1. Obtener generaciones pendientes para liberar sus dispositivos
    const pendingGens = await tx.genMarketplace.findMany({
      where: { orderId, status: "PENDIENTE" },
      select: { deviceId: true }
    });

    const deviceIds = pendingGens.map(g => g.deviceId).filter(Boolean) as string[];

    // 2. Liberar los dispositivos a 'LIBRE'
    if (deviceIds.length > 0) {
      await tx.device.updateMany({
        where: { id: { in: deviceIds } },
        data: { status: "LIBRE" },
      });
    }

    // 3. Cancelar las generaciones pendientes
    await tx.genMarketplace.updateMany({
      where: { orderId, status: "PENDIENTE" },
      data: { status: "CANCELADO" },
    });

    // 4. Cancelar la orden principal
    return await tx.botOrder.update({
      where: { id: orderId, userId: session.user.id },
      data: { status: "CANCELADA" },
    });
  });

  revalidatePath("/dashboard/orders");
  revalidatePath("/dashboard/generations");
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

// Nueva Action para reintentar asignar Bots faltantes a una orden
export async function retryMissingBots(orderId: string) {
  const session = await getSession();
  
  // 0. Sincronizar dispositivos
  await syncDevices().catch(err => console.error("Sync error before retry:", err));

  // 1. Obtener orden completa y cantidad actual de generaciones
  const order = await prisma.botOrder.findUnique({
    where: { id: orderId, userId: session.user.id },
    include: { genMarketplaces: true }
  });
  
  if (!order) throw new Error("Orden no encontrada");

  const currentCount = order.genMarketplaces.length;
  const targetCount = order.quantity || 1;
  const missingCount = targetCount - currentCount;

  if (missingCount <= 0) {
    throw new Error("La orden ya tiene la cantidad completa de bots asignados.");
  }

  // Modo automático: buscar devices libres con WhatsApp y Facebook
  const allFreeDevices = await prisma.device.findMany({
    where: { status: "LIBRE" },
  });

  const validDevices = allFreeDevices.filter((d: any) => {
    if (!Array.isArray(d.redesSociales)) return false;
    const hasWa = d.redesSociales.some((r: any) => r.red_social === 'whatsapp');
    const hasFb = d.redesSociales.some((r: any) => r.red_social === 'facebook');
    return hasWa && hasFb;
  });

  const freeDevices = validDevices.slice(0, missingCount);

  if (freeDevices.length === 0) {
    throw new Error("No hay dispositivos libres con WhatsApp y Facebook en este momento para completar la orden.");
  }

  const assignCount = freeDevices.length;

  // 3. Generar variantes IA para los faltantes
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
    console.error("Error generating AI variants recursively:", err);
    variants = Array.from({ length: assignCount }, (_, i) => ({
      title: `${order.listingTitle || order.orderName} ${["🔥", "⭐", "💎", "💯", "🎯"][Math.floor(Math.random() * 5)]}`,
      description: order.listingDescription || "",
    }));
  }

  // 4. Crear los GenMarketplace faltantes
  await prisma.$transaction(async (tx) => {
    for (let i = 0; i < freeDevices.length; i++) {
      const device = freeDevices[i];
      const title = variants[i]?.title || variants[0]?.title || order.listingTitle || order.orderName;
      const description = variants[i]?.description || variants[0]?.description || order.listingDescription || "";

      // Añadir número de contacto
      const waAccount = Array.isArray(device.redesSociales) ? (device.redesSociales as any[]).find((r: any) => r.red_social === "whatsapp") : null;
      const botPhone = (waAccount?.telefono_asociado || waAccount?.user) || "";
      const descriptionWithContact = botPhone ? `${description.trim()}\n\n📲 Contacto: ${botPhone}` : description;

      await tx.genMarketplace.create({
        data: {
          orderId: order.id,
          userId: session.user.id,
          deviceId: device.id,
          genTitle: title,
          genDescription: descriptionWithContact,
          imageUrls: order.imageUrls,
          status: "PAUSADO", // Se crea pausado para que el usuario inicie manualmente
        },
      });

      await tx.device.update({
        where: { id: device.id },
        data: { status: "OCUPADO" },
      });
    }
  });

  revalidatePath("/dashboard/generations");
  revalidatePath("/dashboard/orders");
  return { success: true, countAdded: assignCount, missingCount: missingCount - assignCount };
}
