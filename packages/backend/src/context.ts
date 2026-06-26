import { getUserByToken } from "./auth.js";
import type { Context } from "./types.js";

function extractToken(request: Request): string | null {
  const header = request.headers.get("authorization") ?? "";
  if (header.startsWith("Bearer ")) return header.slice(7).trim();
  return header.trim() || null;
}

export function createContext({ request }: { request: Request }): Context {
  const token = extractToken(request);
  const currentUser = token ? getUserByToken(token) : null;
  return { currentUser };
}
