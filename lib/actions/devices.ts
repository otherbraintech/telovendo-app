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

// Nueva función para obtener dispositivos válidos (LIBRE y con WA + FB) para el OrdersClient
export async function getAvailableWaFbDevices() {
  const session = await getSession();
  if (!session) return [];

  const allFreeDevices = await prisma.device.findMany({
    where: { status: "LIBRE" },
  });

  const validDevices = allFreeDevices.filter((d: any) => {
    if (!Array.isArray(d.redesSociales)) return false;
    const hasWa = d.redesSociales.some((r: any) => r.red_social === 'whatsapp');
    const hasFb = d.redesSociales.some((r: any) => r.red_social === 'facebook');
    return hasWa && hasFb;
  });

  return JSON.parse(JSON.stringify(validDevices));
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
  console.log("\n[DEBUG] --- syncDevices iniciada ---");
  const session = await getSession();
  if (!session || session.user.role !== "ADMIN") {
    console.error("[DEBUG] No autorizado o sin sesión");
    throw new Error("Unauthorized");
  }

  const url = 'http://46.202.146.166:8080/devices';
  const apiKey = 'genfarmer-secret-key-2024';

  try {
    console.log("[DEBUG] Haciendo fetch a:", url);
    const response = await fetch(url, {
      headers: {
        'x-api-key': apiKey
      },
      next: { revalidate: 0 }
    });

    if (!response.ok) {
      console.error("[DEBUG] HTTP status no ok:", response.status);
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    // Obtenemos el json como objeto general
    const data = await response.json();
    console.log("\n====== ESTRUCTURA EXACTA CONSOLE.LOG ======");
    console.log(JSON.stringify(data, null, 2));
    console.log("============================================\n");

    const apiDevices = data.devices || [];

    if (!Array.isArray(apiDevices)) {
      console.error("[DEBUG] apiDevices no es array:", typeof apiDevices);
      throw new Error("Invalid API response structure");
    }

    for (const apiDev of apiDevices) {
      // Intentar extraer personName de la primera red social disponible
      let personName = null;
      if (Array.isArray(apiDev.redes_sociales)) {
         const socialContact = apiDev.redes_sociales.find((red: any) => red.user && red.user.trim() !== "");
         if (socialContact) {
            personName = socialContact.user;
         }
      }

      // Determinar el nuevo estado
      const finalStatus = (Array.isArray(apiDev.redes_sociales) && apiDev.redes_sociales.length > 0) 
        ? "LIBRE" 
        : "SIN_CUENTAS";

      await prisma.device.upsert({
        where: { serial: apiDev.serial },
        update: {
          model: apiDev.model,
          triggerId: apiDev.trigger_id,
          personName: personName, // Automatically extracted name
          alias: apiDev.alias,
          estadoDb: apiDev.estado_db,
          redesSociales: apiDev.redes_sociales,
          status: finalStatus,
        },
        create: {
          serial: apiDev.serial,
          model: apiDev.model,
          triggerId: apiDev.trigger_id,
          personName: personName,
          alias: apiDev.alias,
          estadoDb: apiDev.estado_db,
          redesSociales: apiDev.redes_sociales,
          status: finalStatus,
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
