import { getGenerationsByOrder } from "@/lib/actions/generations";
import GenerationsClient from "../GenerationsClient";
import { notFound } from "next/navigation";

export default async function OrderGenerationsPage({ params }: { params: { id: string } }) {
  const { id } = await params;
  const generations = await getGenerationsByOrder(id);

  if (generations.length === 0) {
    // Si no hay ejecuciones, podríamos mostrar un estado vacío o redirigir
    // Pero es mejor pasar el array vacío al cliente
  }

  return <GenerationsClient initialGenerations={generations} mode="detail" />;
}
