import { revalidatePath } from "next/cache";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { envServer } from "@/lib/env.server";

type ProfileRow = {
  id: string;
  email: string | null;
  role: "user" | "admin" | "member";
  is_pro: boolean;
  expires_at: string | null;
  created_at: string;
};

function asDateInputValue(expiresAt: string | null) {
  if (!expiresAt) return "";
  const d = new Date(expiresAt);
  if (Number.isNaN(d.getTime())) return "";
  // Use UTC date to stay stable across environments.
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function displayExpiry(expiresAt: string | null) {
  if (!expiresAt) return "Vĩnh viễn";
  const d = new Date(expiresAt);
  if (Number.isNaN(d.getTime())) return expiresAt;
  const dd = String(d.getUTCDate()).padStart(2, "0");
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const yyyy = d.getUTCFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function displayPermission(p: Pick<ProfileRow, "role" | "is_pro">) {
  if (p.role === "admin") return "ADMIN";
  if (p.role === "member") return "MEMBER";
  if (p.is_pro) return "PRO";
  return "USER";
}

function badgeClass(label: ReturnType<typeof displayPermission>) {
  switch (label) {
    case "ADMIN":
      return "badge danger";
    case "MEMBER":
      return "badge warn";
    case "PRO":
      return "badge pro";
    default:
      return "badge";
  }
}

type Permission = "user" | "pro" | "member" | "admin";

function mapPermission(permission: Permission): Pick<ProfileRow, "role" | "is_pro"> {
  switch (permission) {
    case "admin":
      return { role: "admin", is_pro: true };
    case "member":
      return { role: "member", is_pro: false };
    case "pro":
      return { role: "user", is_pro: true };
    default:
      return { role: "user", is_pro: false };
  }
}

async function updateUser(formData: FormData) {
  "use server";

  const supabase = envServer.supabaseServiceRoleKey ? createSupabaseAdminClient() : await createSupabaseServerClient();
  const id = String(formData.get("id") ?? "");
  const permission = String(formData.get("permission") ?? "user") as Permission;
  const { role, is_pro } = mapPermission(permission);
  const expiresDate = String(formData.get("expires_date") ?? "").trim();

  const expires_at =
    expiresDate === ""
      ? null
      : // Store "end of day" in +07:00 to match VN usage.
        `${expiresDate}T23:59:59.999+07:00`;

  if (!id) return;

  const { error } = await supabase
    .from("profiles")
    .update({ role, is_pro, expires_at })
    .eq("id", id);
  if (error) throw error;

  revalidatePath("/admin/users");
}

async function revokeUser(formData: FormData) {
  "use server";

  const supabase = envServer.supabaseServiceRoleKey ? createSupabaseAdminClient() : await createSupabaseServerClient();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const { error } = await supabase
    .from("profiles")
    .update({ role: "user", is_pro: false, expires_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;

  revalidatePath("/admin/users");
}

export default async function AdminUsersPage() {
  const { user } = await requireAdmin();
  const supabase = envServer.supabaseServiceRoleKey ? createSupabaseAdminClient() : await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, role, is_pro, expires_at, created_at")
    .order("created_at", { ascending: false });

  if (error) throw error;

  const profiles = (data ?? []) as ProfileRow[];

  return (
    <main className="container">
      <div className="card">
        <div className="row" style={{ justifyContent: "space-between" }}>
          <div>
            <h1 style={{ margin: 0 }}>Users & Quyền</h1>
            <p className="muted" style={{ margin: "8px 0 0" }}>
              Admin: {user.email}
            </p>
          </div>
          <div className="row">
            <Link className="btn secondary" href="/admin">
              Admin
            </Link>
            <Link className="btn secondary" href="/">
              Trang chủ
            </Link>
          </div>
        </div>
      </div>

      <div style={{ height: 14 }} />

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--border)" }}>
          <div className="row" style={{ justifyContent: "space-between" }}>
            <div>
              <div style={{ fontWeight: 800 }}>Danh sách người dùng</div>
              <div className="muted" style={{ fontSize: 12 }}>
                Quyền = User / Pro / Member / Admin; Hết hạn để trống = vĩnh viễn.
              </div>
            </div>
          </div>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table className="dataTable">
            <thead>
              <tr>
                <th>EMAIL</th>
                <th>QUYỀN</th>
                <th>HẾT HẠN</th>
                <th style={{ textAlign: "right" }}>HÀNH ĐỘNG</th>
              </tr>
            </thead>
            <tbody>
              {profiles.map((p) => {
                const label = displayPermission(p);
                const permission: Permission =
                  p.role === "admin" ? "admin" : p.role === "member" ? "member" : p.is_pro ? "pro" : "user";
                return (
                  <tr key={p.id}>
                    <td>
                      <div style={{ fontWeight: 800 }}>{p.email ?? "(no email)"}</div>
                      <div className="muted" style={{ fontSize: 12 }}>
                        {p.id}
                      </div>
                    </td>
                    <td>
                      <div className="row" style={{ gap: 10 }}>
                        <span className={badgeClass(label)}>{label}</span>
                        <span className="muted" style={{ fontSize: 12 }}>
                          (chọn: User / Pro / Member / Admin)
                        </span>
                      </div>
                    </td>
                    <td>
                      <div className="row" style={{ gap: 10 }}>
                        <input form={`u-${p.id}`} type="date" name="expires_date" defaultValue={asDateInputValue(p.expires_at)} className="input compact" />
                        <span className="muted" style={{ fontSize: 12 }}>
                          {displayExpiry(p.expires_at)}
                        </span>
                      </div>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <div className="row" style={{ justifyContent: "flex-end" }}>
                        <form id={`u-${p.id}`} action={updateUser} className="row" style={{ gap: 10, justifyContent: "flex-end" }}>
                          <input type="hidden" name="id" value={p.id} />
                          <select name="permission" defaultValue={permission} className="input compact">
                            <option value="user">User</option>
                            <option value="pro">Pro</option>
                            <option value="member">Member</option>
                            <option value="admin">Admin</option>
                          </select>
                          <button className="btn secondary" type="submit">
                            Lưu
                          </button>
                        </form>

                        <form action={revokeUser} style={{ display: "inline-flex" }}>
                          <input type="hidden" name="id" value={p.id} />
                          <button className="btn secondary" type="submit">
                            Thu hồi
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {profiles.length === 0 ? (
                <tr>
                  <td colSpan={4} className="muted" style={{ padding: 16 }}>
                    Chưa có user nào.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
