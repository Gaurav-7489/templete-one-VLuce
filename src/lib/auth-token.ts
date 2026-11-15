import { createHash, timingSafeEqual } from "node:crypto";

/** True when the request carries `Authorization: Bearer <secret>` for a configured secret of 24+ characters. */
export function bearerMatches(request: Request, secret: string | undefined): boolean {
  const expected = secret?.trim();
  if (!expected || expected.length < 24) return false;
  const given = /^Bearer (.+)$/.exec(request.headers.get("authorization") ?? "")?.[1] ?? "";
  const a = createHash("sha256").update(given).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}
