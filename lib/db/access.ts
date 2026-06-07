// Server-only: the user's role, read from their membership. This is the source
// of truth for authorization in real mode (the client RoleProvider only gates
// the UI). Do NOT import from a client component (uses `pg`).
import { getPool } from "@/server/db";
import { isRole, type Role } from "@/lib/roles";

export async function getUserRole(userId: string): Promise<Role | null> {
  const pool = getPool();
  const r = await pool.query<{ role: string }>(
    `select role from memberships where user_id = $1 order by created_at asc limit 1`,
    [userId]
  );
  const role = r.rows[0]?.role;
  return isRole(role) ? role : null;
}
