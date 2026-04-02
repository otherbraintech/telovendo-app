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
  quantity: number;
  imageUrls?: string[];
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
  imageUrls?: string[];
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

  const order = await prisma.botOrder.update({
    where: { 
      id: orderId,
      userId: session.user.id
    },
    data: {
      status: "GENERANDO"
    },
  });

  revalidatePath("/dashboard/orders");
  return JSON.parse(JSON.stringify(order));
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

