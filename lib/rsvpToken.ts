import { createHmac, timingSafeEqual } from "crypto";

// A token encodes {sessionId, userId, action, exp} and is signed with a
// server-only secret. Anyone with a valid token can register exactly that
// RSVP for exactly that person on exactly that session — nothing else —
// so it's safe to let it work without a full login.

export type RsvpAction = "in" | "maybe" | "out";

type TokenPayload = {
  sessionId: string;
  userId: string;
  action: RsvpAction;
  exp: number; // unix seconds
};

function getSecret(): string {
  const secret = process.env.RSVP_TOKEN_SECRET;
  if (!secret) {
    throw new Error("RSVP_TOKEN_SECRET is not set");
  }
  return secret;
}

function base64url(input: Buffer | string) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function fromBase64url(input: string) {
  const padded = input.replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(padded, "base64");
}

export function createRsvpToken(
  sessionId: string,
  userId: string,
  action: RsvpAction,
  ttlSeconds = 60 * 60 * 24 * 14 // 14 days
): string {
  const payload: TokenPayload = {
    sessionId,
    userId,
    action,
    exp: Math.floor(Date.now() / 1000) + ttlSeconds,
  };
  const payloadEncoded = base64url(JSON.stringify(payload));
  const signature = base64url(
    createHmac("sha256", getSecret()).update(payloadEncoded).digest()
  );
  return `${payloadEncoded}.${signature}`;
}

export function verifyRsvpToken(token: string): TokenPayload | null {
  const [payloadEncoded, signature] = token.split(".");
  if (!payloadEncoded || !signature) return null;

  const expectedSignature = base64url(
    createHmac("sha256", getSecret()).update(payloadEncoded).digest()
  );

  const a = fromBase64url(signature);
  const b = fromBase64url(expectedSignature);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  try {
    const payload: TokenPayload = JSON.parse(
      fromBase64url(payloadEncoded).toString("utf8")
    );
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}
