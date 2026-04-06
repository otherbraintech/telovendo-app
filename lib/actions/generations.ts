"use server";

import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth-utils";

export async function getGenerations() {
  const session = await getSession();
  if (!session) return [];

  const generations = await prisma.genMarketplace.findMany({
    where: { userId: session.user.id },
    include: {
      botOrder: true,
      device: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return JSON.parse(JSON.stringify(generations));
}

export async function updateGenMarketplace(id: number, data: { genTitle?: string, genDescription?: string, imageUrls?: string[], status?: any }) {
  const session = await getSession();
  if (!session) throw new Error("No session");

  const updated = await prisma.genMarketplace.update({
    where: { id, userId: session.user.id },
    data,
  });

  return JSON.parse(JSON.stringify(updated));
}

export async function deleteGenMarketplace(id: number) {
  const session = await getSession();
  if (!session) throw new Error("No session");

  await prisma.genMarketplace.delete({
    where: { id, userId: session.user.id },
  });

  return { success: true };
}

export async function updateBotOrderStatus(orderId: string, status: any) {
  const session = await getSession();
  if (!session) throw new Error("No session");

  const updated = await prisma.botOrder.update({
    where: { id: orderId, userId: session.user.id },
    data: { status },
  });

  return JSON.parse(JSON.stringify(updated));
}

export async function getGenerationsByOrder(orderId: string) {
  const session = await getSession();
  if (!session) return [];

  const generations = await prisma.genMarketplace.findMany({
    where: { 
      orderId,
      userId: session.user.id 
    },
    include: {
      botOrder: true,
      device: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return JSON.parse(JSON.stringify(generations));
}
