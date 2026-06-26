import { randomUUID } from "node:crypto";
import { getUserById } from "./data.js";
import type { User } from "./types.js";

const tokenToUserId = new Map<string, string>();

export function issueToken(userId: string): string {
  const token = randomUUID();
  tokenToUserId.set(token, userId);
  return token;
}

export function getUserByToken(token: string): User | null {
  const userId = tokenToUserId.get(token);
  if (!userId) return null;
  return getUserById(userId);
}
