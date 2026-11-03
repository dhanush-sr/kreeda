import { requireRole } from "@/lib/session";
import Sidebar from "@/components/Sidebar";
import { navFor } from "@/components/nav";

export default async function AdminLayout({ children }) {
  const user = await requireRole("ADMIN");
  return (
    <div className="min-h-screen bg-court">
      <Sidebar items={navFor(user.role)} user={user} roleLabel="Admin" />
      <main className="ml-72 min-h-screen px-8 py-8">{children}</main>
    </div>
  );
}
