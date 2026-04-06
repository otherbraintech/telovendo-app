import { getSession } from "@/lib/auth-utils";
import { redirect } from "next/navigation";
import { getUsers } from "@/lib/actions/users";
import UsersClient from "./UsersClient";

export default async function UsersPage() {
  const session = await getSession();
  
  if (!session || session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const users = await getUsers();

  return (
    <div className="container mx-auto py-8">
      <UsersClient initialUsers={users} currentUser={session.user} />
    </div>
  );
}
