import { getSession } from "@/lib/auth-utils";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import ProfileClient from "@/components/profile-client";

export default async function ProfilePage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const [projectCount, orderCount] = await Promise.all([
    prisma.project.count({ where: { userId: session.user.id, deletedAt: null } }),
    prisma.botOrder.count({ where: { userId: session.user.id } }),
  ]);

  return <ProfileClient user={session.user} stats={{ projectCount, orderCount }} />;
}
