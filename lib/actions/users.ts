"use server";

import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth-utils";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";

export async function getUsers() {
    const session = await getSession();
    if (!session || session.user.role !== "ADMIN") throw new Error("Unauthorized");

    const users = await prisma.user.findMany({
        orderBy: { createdAt: "desc" },
        select: {
            id: true,
            username: true,
            name: true,
            role: true,
            createdAt: true,
            updatedAt: true,
            // We don't select passwordHash here for basic list
        }
    });

    return JSON.parse(JSON.stringify(users));
}

export async function createUser(data: {
    username: string;
    name: string;
    password: string;
    role: "ADMIN" | "USUARIO";
}) {
    const session = await getSession();
    if (!session || session.user.role !== "ADMIN") throw new Error("Unauthorized");

    const passwordHash = await bcrypt.hash(data.password, 12);

    const user = await prisma.user.create({
        data: {
            username: data.username,
            usernameLower: data.username.toLowerCase(),
            name: data.name,
            passwordHash,
            role: data.role,
        },
    });

    revalidatePath("/users");
    return JSON.parse(JSON.stringify(user));
}

export async function updateUser(id: string, data: {
    username?: string;
    name?: string;
    password?: string;
    role?: "ADMIN" | "USUARIO";
}) {
    const session = await getSession();
    if (!session || session.user.role !== "ADMIN") throw new Error("Unauthorized");

    const updateData: any = { ...data };
    
    if (data.username) {
        updateData.usernameLower = data.username.toLowerCase();
    }

    if (data.password) {
        updateData.passwordHash = await bcrypt.hash(data.password, 12);
        delete updateData.password;
    }

    const user = await prisma.user.update({
        where: { id },
        data: updateData,
    });

    revalidatePath("/users");
    return JSON.parse(JSON.stringify(user));
}

export async function deleteUser(id: string) {
    const session = await getSession();
    if (!session || session.user.role !== "ADMIN") throw new Error("Unauthorized");
    
    // Prevent deleting self
    if (session.user.id === id) throw new Error("No puedes eliminar tu propio usuario");

    const user = await prisma.user.delete({
        where: { id },
    });

    revalidatePath("/users");
    return JSON.parse(JSON.stringify(user));
}

export async function getUserPassword(id: string) {
    const session = await getSession();
    if (!session || session.user.role !== "ADMIN") throw new Error("Unauthorized");

    // NOTE: We cannot "see" the password because it's hashed.
    // We can only reset it.
    throw new Error("Las contraseñas están encriptadas y no se pueden visualizar por seguridad.");
}
