import { getProjects } from "@/lib/actions/projects"
import DashboardClient from "./DashboardClient"

export default async function DashboardPage() {
  const projects = await getProjects()

  return <DashboardClient initialProjects={projects} />
}
