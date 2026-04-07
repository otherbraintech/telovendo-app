import { getSession } from "@/lib/auth-utils";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import ProfileClient from "@/components/profile-client";

export default async function ProfilePage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const [dbUser, projectCount, orderCount] = await Promise.all([
    prisma.user.findUnique({ where: { id: session.user.id } }),
    prisma.project.count({ where: { userId: session.user.id, deletedAt: null } }),
    prisma.botOrder.count({ where: { userId: session.user.id } }),
  ]);

  if (!dbUser) redirect("/login");

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 md:py-24">
      <ProfileClient user={dbUser} stats={{ projectCount, orderCount }} />
    </div>
  );
}
