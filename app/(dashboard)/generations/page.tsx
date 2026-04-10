import { getGenerations } from "@/lib/actions/generations";
import GenerationsClient from "./GenerationsClient";

export const maxDuration = 60;

export default async function GenerationsPage() {
  const initialGenerations = await getGenerations();

  return <GenerationsClient initialGenerations={initialGenerations} />;
}
