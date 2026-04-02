import { getProjects } from "@/lib/actions/projects"
import { getTotalOrdersCount } from "@/lib/actions/orders"
import DashboardClient from "./DashboardClient"

export default async function DashboardPage() {
  const projects = await getProjects()
  const publicationsCount = await getTotalOrdersCount()

  return <DashboardClient initialProjects={projects} initialPublicationsCount={publicationsCount} />
}
