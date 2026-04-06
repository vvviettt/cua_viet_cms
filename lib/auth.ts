import { cookies } from "next/headers";
import { SESSION_COOKIE } from "./constants";
import { parseSessionPayload, type SessionPayload } from "./session-cookie";

export type { SessionPayload };

export async function getSession(): Promise<SessionPayload | null> {
  const jar = await cookies();
  return parseSessionPayload(jar.get(SESSION_COOKIE)?.value);
}
