import crypto from "crypto";

const DEFAULT_SECRET = "lector_manga_secure_session_secret_2026_default_key_at_least_32";
const SECRET = process.env.SESSION_SECRET || DEFAULT_SECRET;

export interface SessionPayload {
  userId: string;
  username: string;
  exp: number;
}

/**
 * Generates a cryptographic salt and scrypt hash for the password.
 */
export function hashPassword(password: string): { hash: string; salt: string } {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return { hash, salt };
}

/**
 * Securely verifies the password using timing-safe comparison.
 */
export function verifyPassword(password: string, expectedHash: string, salt: string): boolean {
  try {
    const computedHash = crypto.scryptSync(password, salt, 64).toString("hex");
    const a = Buffer.from(computedHash, "hex");
    const b = Buffer.from(expectedHash, "hex");
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

/**
 * Creates a signed session token valid for 30 days.
 */
export function createSessionToken(payload: { userId: string; username: string }): string {
  const session: SessionPayload = {
    userId: payload.userId,
    username: payload.username,
    exp: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days
  };

  const data = Buffer.from(JSON.stringify(session)).toString("base64url");
  const signature = crypto.createHmac("sha256", SECRET).update(data).digest("base64url");
  return `${data}.${signature}`;
}

/**
 * Verifies a signed session token. Returns null if expired or invalid signature.
 */
export function verifySessionToken(token: string): { userId: string; username: string } | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 2) return null;

    const [data, signature] = parts;
    const expectedSignature = crypto.createHmac("sha256", SECRET).update(data).digest("base64url");

    const a = Buffer.from(signature);
    const b = Buffer.from(expectedSignature);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
      return null;
    }

    const payload: SessionPayload = JSON.parse(Buffer.from(data, "base64url").toString("utf8"));
    if (typeof payload.exp !== "number" || Date.now() > payload.exp) {
      return null;
    }

    return {
      userId: payload.userId,
      username: payload.username,
    };
  } catch {
    return null;
  }
}
