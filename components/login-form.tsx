"use client";

import { useActionState } from "react";
import { login } from "@/lib/actions/auth";
import Link from "next/link";
import { ArrowRight, Lock, User } from "lucide-react";

export function LoginForm() {
  const [state, action, isPending] = useActionState(login, null);

  return (
    <div className="w-full space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="space-y-2 text-center">
        <p className="text-[10px] text-neutral-500 font-mono tracking-widest uppercase">
          Ingresa tus credenciales de acceso
        </p>
      </div>

      <form action={action} className="space-y-4">
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 px-1">
              Usuario o Correo
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600" />
              <input
                name="account"
                type="text"
                placeholder="usuario o correo@ejemplo.com"
                required
                className="w-full bg-background border border-border p-4 pl-10 text-sm focus:border-blue-500 outline-none transition-colors font-mono"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center px-1">
              <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">
                Contraseña
              </label>
              <a href="#" className="text-[9px] uppercase tracking-widest text-neutral-600 hover:text-blue-500 transition-colors">
                ¿Olvidaste tu clave?
              </a>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600" />
              <input
                name="password"
                type="password"
                placeholder="********"
                required
                className="w-full bg-background border border-border p-4 pl-10 text-sm focus:border-blue-500 outline-none transition-colors font-mono"
              />
            </div>
          </div>
        </div>

        {state?.error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] uppercase font-bold tracking-widest text-center">
            {state.error}
          </div>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="w-full h-14 rounded-none border border-blue-500/50 bg-transparent text-blue-500 hover:bg-blue-500 hover:text-black font-black text-xs uppercase tracking-[0.2em] transition-all duration-150 hover:shadow-[0_0_30px_rgba(59,130,246,0.3)] flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed group cursor-pointer"
        >
          {isPending ? "PROCESANDO..." : "ENTRAR AL SISTEMA"}
          {!isPending && <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />}
        </button>
      </form>

      <div className="pt-6 border-t border-border text-center">
        <p className="text-[10px] text-neutral-600 uppercase tracking-widest font-bold">
          ¿No tienes cuenta?{" "}
          <Link href="/signup" className="text-blue-500 hover:text-blue-400 transition-colors ml-1">
            CREAR ACCESO →
          </Link>
        </p>
      </div>
    </div>
  );
}
