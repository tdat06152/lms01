import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/server";

export default async function AdminPage() {
  await requireAdmin();
  redirect("/admin/users");
}
