import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword, createSessionToken, verifySessionToken } from "../src/lib/auth";
import { createUser, findUserByUsername, findUserById, saveUserSyncData, getUserSyncData } from "../src/lib/db";
import { getSource, sources } from "../src/lib/sources";

describe("Authentication & Crypto Utilities", () => {
  it("hashes password and verifies correctly", () => {
    const pwd = "super_secure_password_123";
    const { hash, salt } = hashPassword(pwd);

    expect(hash).toBeDefined();
    expect(salt).toBeDefined();
    expect(hash.length).toBeGreaterThan(32);

    expect(verifyPassword(pwd, hash, salt)).toBe(true);
    expect(verifyPassword("wrong_password", hash, salt)).toBe(false);
  });

  it("creates and verifies valid session tokens", () => {
    const payload = { userId: "usr_test123", username: "makizapa" };
    const token = createSessionToken(payload);

    expect(token).toBeDefined();
    expect(token).toContain(".");

    const session = verifySessionToken(token);
    expect(session).not.toBeNull();
    expect(session?.userId).toBe(payload.userId);
    expect(session?.username).toBe(payload.username);
  });

  it("rejects tampered or malformed session tokens", () => {
    const payload = { userId: "usr_test123", username: "makizapa" };
    const token = createSessionToken(payload);

    // Tampered data
    const tampered = token.replace("a", "b");
    expect(verifySessionToken(tampered)).toBeNull();

    // Malformed strings
    expect(verifySessionToken("invalid_token")).toBeNull();
    expect(verifySessionToken("")).toBeNull();
  });
});

describe("Database Storage & User Sync", () => {
  it("creates a user and retrieves by username and id", async () => {
    const username = `test_user_${Date.now()}`;
    const { hash, salt } = hashPassword("secret123");

    const created = await createUser(username, hash, salt);
    expect(created.id).toBeDefined();
    expect(created.username).toBe(username);

    const byUser = await findUserByUsername(username);
    expect(byUser).not.toBeNull();
    expect(byUser?.id).toBe(created.id);

    const byId = await findUserById(created.id);
    expect(byId).not.toBeNull();
    expect(byId?.username).toBe(username);
  });

  it("persists and retrieves user sync data", async () => {
    const username = `sync_user_${Date.now()}`;
    const { hash, salt } = hashPassword("secret123");
    const user = await createUser(username, hash, salt);

    const saved = await saveUserSyncData(user.id, {
      library: { "olympus:solo-leveling": { manga: { title: "Solo Leveling" } } },
      history: [{ chapterId: "ch-1", timestamp: Date.now() }],
      stats: { "olympus:solo-leveling": { totalSecondsRead: 300 } },
    });

    expect(saved.userId).toBe(user.id);

    const fetched = await getUserSyncData(user.id);
    expect(fetched).not.toBeNull();
    expect(fetched?.library["olympus:solo-leveling"]).toBeDefined();
    expect(fetched?.history.length).toBe(1);
  });
});

describe("Rncalation Source Registry", () => {
  it("registers rncalation source properly", () => {
    const provider = getSource("rncalation");
    expect(provider).toBeDefined();
    expect(provider.id).toBe("rncalation");
    expect(provider.name).toBe("Rncalation");
    expect(sources.rncalation).toBe(provider);
  });
});
