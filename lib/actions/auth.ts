"use server";

import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { encrypt, decrypt } from "@/lib/auth-utils";

const signupSchema = z.object({
  username: z.string().min(3, "El usuario debe tener al menos 3 caracteres").max(20),
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

const loginSchema = z.object({
  account: z.string().min(1, "El usuario es obligatorio"),
  password: z.string().min(1, "La contraseña es obligatoria"),
});

export async function login(prevState: any, formData: FormData) {
  const validatedFields = loginSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!validatedFields.success) {
    return { error: validatedFields.error.flatten().fieldErrors.account?.[0] || 
                    validatedFields.error.flatten().fieldErrors.password?.[0] || 
                    "Datos inválidos" };
  }

  const { account, password } = validatedFields.data;

  try {
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { username: account },
          { usernameLower: account.toLowerCase() }
        ]
      }
    });

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return { error: "Credenciales inválidas" };
    }

    // Create session
    const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const session = await encrypt({ 
      user: { id: user.id, username: user.username, name: user.name, role: user.role }, 
      expires 
    });

    const cookieStore = await cookies();
    cookieStore.set("session", session, { 
      expires, 
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/"
    });

  } catch (error) {
    console.error("Login error:", error);
    return { error: "Error en el servidor" };
  }

  redirect("/dashboard");
}

export async function signup(prevState: any, formData: FormData) {
  const rawData = Object.fromEntries(formData.entries());
  const validatedFields = signupSchema.safeParse({
    ...rawData,
    confirmPassword: rawData["confirm-password"]
  });

  if (!validatedFields.success) {
    const errors = validatedFields.error.flatten().fieldErrors;
    return { error: Object.values(errors).flat()[0] || "Datos inválidos" };
  }

  const { username, name, password } = validatedFields.data;

  try {
    const existingUser = await prisma.user.findUnique({
      where: { usernameLower: username.toLowerCase() }
    });

    if (existingUser) {
      return { error: "El usuario ya existe" };
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        username,
        usernameLower: username.toLowerCase(),
        name,
        passwordHash,
      }
    });

    // Create session
    const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const session = await encrypt({ 
      user: { id: user.id, username: user.username, name: user.name, role: user.role }, 
      expires 
    });

    const cookieStore = await cookies();
    cookieStore.set("session", session, { 
      expires, 
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/"
    });

  } catch (error) {
    console.error("Signup error:", error);
    return { error: "Error al crear la cuenta. Intente nuevamente." };
  }

  redirect("/dashboard");
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete("session");
  redirect("/login");
}

export async function updateProfile({ name }: { name: string }) {
  const sessionString = (await (await cookies()).get("session"))?.value;
  if (!sessionString) throw new Error("Unauthorized");

  const session = await decrypt(sessionString);
  const userId = session.user.id;

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { name }
  });

  // Update session cookie with new name
  const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const updatedSession = await encrypt({ 
    ...session, 
    user: { ...session.user, name: updatedUser.name } 
  });

  const cookieStore = await cookies();
  cookieStore.set("session", updatedSession, { 
    expires, 
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    path: "/"
  });

  return { success: true };
}

