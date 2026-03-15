import { describe, it, expect, vi, beforeEach } from "vitest";
import crypto from "crypto";

// Mock prisma
vi.mock("@/lib/prisma", () => ({
  prisma: {
    adminSession: {
      create: vi.fn(),
      findUnique: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/prisma";
import { createSession, validateSession, deleteSession } from "../session";

const mockedPrisma = prisma as unknown as {
  adminSession: {
    create: ReturnType<typeof vi.fn>;
    findUnique: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };
};

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

describe("createSession", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("generates a 64-character hex token (32 bytes)", async () => {
    mockedPrisma.adminSession.create.mockResolvedValue({});
    const { token } = await createSession();
    expect(token).toMatch(/^[0-9a-f]{64}$/);
  });

  it("returns the sha256 hash of the token as hashedToken", async () => {
    mockedPrisma.adminSession.create.mockResolvedValue({});
    const { token, hashedToken } = await createSession();
    expect(hashedToken).toBe(hashToken(token));
  });

  it("stores the session in the database with tokenHash and expiresAt", async () => {
    mockedPrisma.adminSession.create.mockResolvedValue({});
    const before = Date.now();
    await createSession();
    const after = Date.now();

    expect(mockedPrisma.adminSession.create).toHaveBeenCalledOnce();
    const callArg = mockedPrisma.adminSession.create.mock.calls[0][0];
    expect(callArg.data.tokenHash).toMatch(/^[0-9a-f]{64}$/);

    const expiresAt = callArg.data.expiresAt.getTime();
    // expiresAt should be ~1 hour from now
    expect(expiresAt).toBeGreaterThanOrEqual(before + 3600000);
    expect(expiresAt).toBeLessThanOrEqual(after + 3600000);
  });
});

describe("validateSession", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns true for a valid, non-expired session", async () => {
    const token = crypto.randomBytes(32).toString("hex");
    const hashed = hashToken(token);

    mockedPrisma.adminSession.findUnique.mockResolvedValue({
      tokenHash: hashed,
      expiresAt: new Date(Date.now() + 3600000),
    });

    expect(await validateSession(token)).toBe(true);
    expect(mockedPrisma.adminSession.findUnique).toHaveBeenCalledWith({
      where: { tokenHash: hashed },
    });
  });

  it("returns false when no session is found", async () => {
    mockedPrisma.adminSession.findUnique.mockResolvedValue(null);
    expect(await validateSession("nonexistent")).toBe(false);
  });

  it("returns false and deletes an expired session", async () => {
    const token = crypto.randomBytes(32).toString("hex");
    const hashed = hashToken(token);

    mockedPrisma.adminSession.findUnique.mockResolvedValue({
      tokenHash: hashed,
      expiresAt: new Date(Date.now() - 1000), // expired
    });
    mockedPrisma.adminSession.delete.mockResolvedValue({});

    expect(await validateSession(token)).toBe(false);
    expect(mockedPrisma.adminSession.delete).toHaveBeenCalledWith({
      where: { tokenHash: hashed },
    });
  });
});

describe("deleteSession", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deletes the session by tokenHash", async () => {
    mockedPrisma.adminSession.delete.mockResolvedValue({});
    await deleteSession("abc123");
    expect(mockedPrisma.adminSession.delete).toHaveBeenCalledWith({
      where: { tokenHash: "abc123" },
    });
  });

  it("does not throw if session does not exist", async () => {
    mockedPrisma.adminSession.delete.mockRejectedValue(new Error("Not found"));
    await expect(deleteSession("nonexistent")).resolves.toBeUndefined();
  });
});

import * as fc from "fast-check";

// Feature: website-improvements, Property 6: Session tokens are unique and validate via round-trip
describe("Property 6: Session tokens are unique and validate via round-trip", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // **Validates: Requirements 2.5, 2.6**
  it("each created session token is at least 64 hex characters and unique", async () => {
    await fc.assert(
      fc.asyncProperty(fc.integer({ min: 2, max: 5 }), async (count) => {
        vi.clearAllMocks();
        mockedPrisma.adminSession.create.mockResolvedValue({});

        const tokens: string[] = [];
        for (let i = 0; i < count; i++) {
          const { token } = await createSession();
          tokens.push(token);
        }

        // Every token is at least 64 hex characters (32 bytes)
        for (const token of tokens) {
          expect(token.length).toBeGreaterThanOrEqual(64);
          expect(token).toMatch(/^[0-9a-f]+$/);
        }

        // All tokens are unique
        const uniqueTokens = new Set(tokens);
        expect(uniqueTokens.size).toBe(tokens.length);
      }),
      { numRuns: 100 }
    );
  });

  // **Validates: Requirements 2.5, 2.6**
  it("validateSession returns true for a created token and false for a different token", async () => {
    await fc.assert(
      fc.asyncProperty(fc.constant(null), async () => {
        vi.clearAllMocks();
        mockedPrisma.adminSession.create.mockResolvedValue({});

        const { token, hashedToken } = await createSession();

        // Mock findUnique to return a valid non-expired session for the created token
        mockedPrisma.adminSession.findUnique.mockImplementation(
          async (args: { where: { tokenHash: string } }) => {
            if (args.where.tokenHash === hashedToken) {
              return {
                tokenHash: hashedToken,
                expiresAt: new Date(Date.now() + 3600000),
              };
            }
            return null;
          }
        );

        // Original token validates successfully
        const isValid = await validateSession(token);
        expect(isValid).toBe(true);

        // A different random token does not validate
        const differentToken = crypto.randomBytes(32).toString("hex");
        const isInvalid = await validateSession(differentToken);
        expect(isInvalid).toBe(false);
      }),
      { numRuns: 100 }
    );
  });
});
