import { getDevices } from "@/lib/actions/devices";
import DevicesClient from "./DevicesClient";
import { getSession } from "@/lib/auth-utils";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Dispositivos | TeloVendo",
};

export default async function DevicesPage() {
  const session = await getSession();
  
  if (!session || session.user.role !== "ADMIN") {
    redirect("/dashboard"); // Evita acceso si no es ADMIN
  }

  const devices = await getDevices();
  return <DevicesClient initialDevices={devices} />;
}
