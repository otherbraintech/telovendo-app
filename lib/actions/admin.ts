"use server";

import prisma from "@/lib/prisma";
import { OrderStatus } from "@prisma/client";
import { getSession } from "@/lib/auth-utils";
import { revalidatePath } from "next/cache";

async function checkAdmin() {
  const session = await getSession();
  if (!session || session.user.role !== "ADMIN") {
    throw new Error("No autorizado. Se requiere rol de administrador.");
  }
  return session;
}

export async function getAllGenerationsAdmin() {
  await checkAdmin();

  const generations = await prisma.genMarketplace.findMany({
    include: {
      botOrder: {
        include: {
          user: {
            select: {
              name: true,
              username: true
            }
          }
        }
      },
      device: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return JSON.parse(JSON.stringify(generations));
}

export async function updateGenMarketplaceAdmin(id: number, data: { genTitle?: string, genDescription?: string, imageUrls?: string[], status?: any }) {
  await checkAdmin();

  const updated = await prisma.genMarketplace.update({
    where: { id },
    data,
  });

  revalidatePath("/admin/publications");
  return JSON.parse(JSON.stringify(updated));
}

export async function deleteGenMarketplaceAdmin(id: number) {
  await checkAdmin();

  await prisma.genMarketplace.delete({
    where: { id },
  });

  revalidatePath("/admin/publications");
  return { success: true };
}

export async function updateBotOrderStatusAdmin(orderId: string, status: any) {
  await checkAdmin();

  const updated = await prisma.$transaction(async (tx) => {
    if (status === "PAUSADA") {
      await tx.genMarketplace.updateMany({
        where: { orderId, status: "PENDIENTE" },
        data: { status: "PAUSADO" }
      });
    } else if (status === "LISTA") {
      await tx.genMarketplace.updateMany({
        where: { orderId, status: "PAUSADO" },
        data: { status: "PENDIENTE" }
      });
    }

    return await tx.botOrder.update({
      where: { id: orderId },
      data: { status },
    });
  });

  revalidatePath("/admin/publications");
  return JSON.parse(JSON.stringify(updated));
}

export async function updateOnlyOrderStatusAdmin(orderId: string, status: OrderStatus) {
  await checkAdmin();

  const updated = await prisma.botOrder.update({
    where: { id: orderId },
    data: { status },
  });

  revalidatePath("/admin/publications");
  return JSON.parse(JSON.stringify(updated));
}

export async function deleteBotOrderAdmin(orderId: string) {
  await checkAdmin();

  await prisma.botOrder.delete({
    where: { id: orderId },
  });

  revalidatePath("/admin/publications");
  return { success: true };
}
