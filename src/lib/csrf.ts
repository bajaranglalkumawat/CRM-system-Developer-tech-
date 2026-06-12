import { randomBytes } from "crypto";

const csrfTokens = new Set<string>();

export function generateCsrfToken(): string {
  const token = randomBytes(32).toString("hex");
  csrfTokens.add(token);
  return token;
}

export function validateCsrfToken(token: string | null): boolean {
  if (!token) return false;
  if (csrfTokens.has(token)) {
    csrfTokens.delete(token);
    return true;
  }
  return false;
}
