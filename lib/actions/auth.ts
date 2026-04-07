"use server";

import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { encrypt, decrypt } from "@/lib/auth-utils";

const signupSchema = z.object({
  username: z.string().min(3, "El usuario debe tener al menos 3 caracteres").max(20),
  email: z.string().email("El correo electrónico no es válido"),
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
          { usernameLower: account.toLowerCase() },
          { email: account.toLowerCase() }
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

    if (user.role === "ESPECTADOR") {
      redirect("/welcome");
    }

  } catch (error: any) {
    if (error.digest?.startsWith("NEXT_REDIRECT")) throw error;
    console.error("Login error:", error);
    return { error: "Error en el servidor" };
  }

  redirect("/projects");
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

  const { username, email, name, password } = validatedFields.data;

  try {
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { usernameLower: username.toLowerCase() },
          { email: email.toLowerCase() }
        ]
      }
    });

    if (existingUser) {
      if (existingUser.email === email.toLowerCase()) {
        return { error: "El correo electrónico ya está registrado" };
      }
      return { error: "El nombre de usuario ya existe" };
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        username,
        usernameLower: username.toLowerCase(),
        email: email.toLowerCase(),
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

    if (user.role === "ESPECTADOR") {
      redirect("/welcome");
    }

  } catch (error: any) {
    if (error.digest?.startsWith("NEXT_REDIRECT")) throw error;
    console.error("Signup error:", error);
    return { error: "Error al crear la cuenta. Intente nuevamente." };
  }

  redirect("/projects");
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete("session");
  redirect("/login");
}

export async function updateProfile(data: { name?: string; username?: string; email?: string; password?: string }) {
  const sessionString = (await (await cookies()).get("session"))?.value;
  if (!sessionString) throw new Error("Unauthorized");

  const session = await decrypt(sessionString);
  const userId = session.user.id;

  const updateData: any = {};
  if (data.name) updateData.name = data.name;
  if (data.username) {
    updateData.username = data.username;
    updateData.usernameLower = data.username.toLowerCase();
  }
  if (data.email !== undefined) updateData.email = data.email ? data.email.toLowerCase() : null;
  if (data.password) {
    updateData.passwordHash = await bcrypt.hash(data.password, 12);
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: updateData
  });

  // Update session cookie with new data
  const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const updatedSession = await encrypt({ 
    ...session, 
    user: { 
      ...session.user, 
      name: updatedUser.name,
      username: updatedUser.username,
      email: updatedUser.email
    } 
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

