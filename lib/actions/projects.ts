"use server";

import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth-utils";

export async function getProjects() {
  const session = await getSession();
  if (!session) return [];

  return await prisma.project.findMany({
    where: { 
      userId: session.user.id,
      deletedAt: null 
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function createProject(name: string) {
  const session = await getSession();
  if (!session) throw new Error("No session");

  const project = await prisma.project.create({
    data: {
      name,
      nameLower: name.toLowerCase(),
      userId: session.user.id,
    },
  });

  return project;
}

export async function deleteProject(id: string) {
  const session = await getSession();
  if (!session) throw new Error("No session");

  return await prisma.project.update({
    where: { id, userId: session.user.id },
    data: { deletedAt: new Date() },
  });
}

export async function duplicateProject(id: string) {
  const session = await getSession();
  if (!session) throw new Error("No session");

  const original = await prisma.project.findUnique({ where: { id } });
  if (!original) throw new Error("Project not found");

  return await prisma.project.create({
    data: {
      name: `${original.name} (copia)`,
      nameLower: `${original.name} (copia)`.toLowerCase(),
      userId: session.user.id,
    },
  });
}

export async function updateProject(id: string, name: string) {
  const session = await getSession();
  if (!session) throw new Error("No session");

  return await prisma.project.update({
    where: { id, userId: session.user.id },
    data: {
      name,
      nameLower: name.toLowerCase(),
    },
  });
}

export async function publishProjectOrders(projectId: string) {
  const session = await getSession();
  if (!session) throw new Error("No session");

  // Actualizar todas las órdenes LISTA a GENERANDO para este proyecto
  return await prisma.botOrder.updateMany({
    where: {
      projectId,
      userId: session.user.id,
      status: "LISTA"
    },
    data: {
      status: "GENERANDO"
    }
  });
}

