"use server";

import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth-utils";
import { revalidatePath } from "next/cache";

export async function getDevices() {
  const session = await getSession();
  if (!session || session.user.role !== "ADMIN") return [];

  const devices = await prisma.device.findMany({
    orderBy: { createdAt: "desc" },
  });
  
  return JSON.parse(JSON.stringify(devices));
}

export async function createDevice(data: {
  deviceName: string;
  personName?: string;
  label?: string;
  status?: any;
}) {
  const session = await getSession();
  if (!session || session.user.role !== "ADMIN") throw new Error("Unauthorized");

  const device = await prisma.device.create({
    data,
  });

  revalidatePath("/dashboard/devices");
  return JSON.parse(JSON.stringify(device));
}

export async function updateDevice(id: string, data: {
  deviceName: string;
  personName?: string;
  label?: string;
  status?: any;
}) {
  const session = await getSession();
  if (!session || session.user.role !== "ADMIN") throw new Error("Unauthorized");

  const device = await prisma.device.update({
    where: { id },
    data,
  });

  revalidatePath("/dashboard/devices");
  return JSON.parse(JSON.stringify(device));
}

export async function deleteDevice(id: string) {
  const session = await getSession();
  if (!session || session.user.role !== "ADMIN") throw new Error("Unauthorized");

  const device = await prisma.device.delete({
    where: { id },
  });

  revalidatePath("/dashboard/devices");
  return JSON.parse(JSON.stringify(device));
}
