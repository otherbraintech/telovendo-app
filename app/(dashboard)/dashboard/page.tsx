import { getDashboardStats } from "@/lib/actions/dashboard"
import DashboardClient from "./DashboardClient"

export default async function DashboardPage() {
  const stats = await getDashboardStats()

  if (!stats) return null;

  return <DashboardClient stats={stats} />
}
