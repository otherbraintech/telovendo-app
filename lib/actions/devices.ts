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
  serial: string;
  model?: string;
  personName?: string;
  label?: string;
  triggerId?: string;
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
  serial: string;
  model?: string;
  personName?: string;
  label?: string;
  triggerId?: string;
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

export async function syncDevices() {
  const session = await getSession();
  if (!session || session.user.role !== "ADMIN") throw new Error("Unauthorized");

  const url = 'http://46.202.146.166:8080/devices';
  const apiKey = 'genfarmer-secret-key-2024';

  try {
    const response = await fetch(url, {
      headers: {
        'x-api-key': apiKey
      },
      next: { revalidate: 0 }
    });

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    
    const { devices: apiDevices } = await response.json();

    if (!Array.isArray(apiDevices)) throw new Error("Invalid API response structure");

    for (const apiDev of apiDevices) {
      await prisma.device.upsert({
        where: { serial: apiDev.serial },
        update: {
          model: apiDev.model,
          triggerId: apiDev.trigger_id,
          status: "LIBRE",
        },
        create: {
          serial: apiDev.serial,
          model: apiDev.model,
          triggerId: apiDev.trigger_id,
          status: "LIBRE",
        },
      });
    }

    revalidatePath("/dashboard/devices");
    const updatedDevices = await prisma.device.findMany({
      orderBy: { createdAt: "desc" },
    });

    return JSON.parse(JSON.stringify(updatedDevices));
  } catch (error) {
    console.error("Error in syncDevices:", error);
    throw error;
  }
}
