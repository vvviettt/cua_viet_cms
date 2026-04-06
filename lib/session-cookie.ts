import { isUserRole, type UserRole } from "@/lib/roles";

export type SessionPayload = {
  userId: string;
  email: string;
  role: UserRole;
  name?: string;
};

export function parseSessionPayload(raw: string | undefined): SessionPayload | null {
  if (!raw) return null;
  try {
    const o = JSON.parse(raw) as Record<string, unknown>;
    if (
      typeof o.userId !== "string" ||
      typeof o.email !== "string" ||
      typeof o.role !== "string"
    ) {
      return null;
    }
    if (!isUserRole(o.role)) {
      return null;
    }
    const name = typeof o.name === "string" ? o.name : undefined;
    return { userId: o.userId, email: o.email, role: o.role, name };
  } catch {
    return null;
  }
}
