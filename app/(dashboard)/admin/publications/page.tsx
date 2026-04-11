import { getAllGenerationsAdmin } from "@/lib/actions/admin";
import AdminPublicationsClient from "./AdminPublicationsClient";
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Gestión Global de Publicaciones - TeloVendo',
};

export default async function AdminPublicationsPage() {
  const initialGenerations = await getAllGenerationsAdmin();

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto py-8 px-6 space-y-12 mb-8">
      <AdminPublicationsClient initialGenerations={initialGenerations} />
    </div>
  );
}
