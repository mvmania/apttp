import test from "node:test";
import assert from "node:assert/strict";
import type { NextFunction, Request, Response } from "express";
import { authenticateToken } from "../middleware/authMiddleware.js";
import {
  requireAdmin,
  requireCoAdminOrAdmin,
  requireMasterAdmin,
  requireRole,
  requireVerifiedUser,
} from "../middleware/roleMiddleware.js";
import { generateAccessToken } from "../utils/jwt.js";

type MockResponse = Response & {
  statusCode: number;
  body: unknown;
};

const createMockResponse = (): MockResponse => {
  const res = {
    statusCode: 200,
    body: undefined,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: unknown) {
      this.body = payload;
      return this;
    },
  } as MockResponse;

  return res;
};

const createNext = () => {
  let called = false;
  const next: NextFunction = () => {
    called = true;
  };

  return {
    next,
    wasCalled: () => called,
  };
};

const createRequest = (overrides: Partial<Request> = {}): Request => {
  return {
    headers: {},
    ...overrides,
  } as Request;
};

const createAuthenticatedRequest = (role: string, isEmailVerified = true): Request => {
  const token = generateAccessToken({
    id: "u_test",
    email: `${role}@example.com`,
    role,
    is_email_verified: isEmailVerified,
    is_admin: role === "admin" || role === "master_admin",
  });

  return createRequest({
    headers: {
      authorization: `Bearer ${token}`,
    },
  });
};

test("authenticateToken rejects requests without a bearer token", () => {
  const req = createRequest();
  const res = createMockResponse();
  const { next, wasCalled } = createNext();

  authenticateToken(req, res, next);

  assert.equal(res.statusCode, 401);
  assert.deepEqual(res.body, { error: "Access token required" });
  assert.equal(wasCalled(), false);
});

test("authenticateToken rejects invalid bearer tokens", () => {
  const req = createRequest({
    headers: {
      authorization: "Bearer invalid-token",
    },
  });
  const res = createMockResponse();
  const { next, wasCalled } = createNext();

  authenticateToken(req, res, next);

  assert.equal(res.statusCode, 403);
  assert.deepEqual(res.body, { error: "Invalid or expired token" });
  assert.equal(wasCalled(), false);
});

test("authenticateToken attaches the decoded user for valid bearer tokens", () => {
  const req = createAuthenticatedRequest("user");
  const res = createMockResponse();
  const { next, wasCalled } = createNext();

  authenticateToken(req, res, next);

  assert.equal(res.statusCode, 200);
  assert.equal(wasCalled(), true);
  assert.equal(req.user?.role, "user");
  assert.equal(req.user?.email, "user@example.com");
});

test("requireRole allows the exact requested role and blocks others", () => {
  const allowedReq = createRequest({
    user: {
      id: "u1",
      email: "coadmin@example.com",
      role: "co_admin",
      is_email_verified: true,
      is_admin: false,
    },
  });
  const allowedRes = createMockResponse();
  const allowedNext = createNext();

  requireRole("co_admin")(allowedReq, allowedRes, allowedNext.next);

  assert.equal(allowedNext.wasCalled(), true);
  assert.equal(allowedRes.statusCode, 200);

  const blockedReq = createRequest({
    user: {
      id: "u2",
      email: "user@example.com",
      role: "user",
      is_email_verified: true,
      is_admin: false,
    },
  });
  const blockedRes = createMockResponse();
  const blockedNext = createNext();

  requireRole("co_admin")(blockedReq, blockedRes, blockedNext.next);

  assert.equal(blockedRes.statusCode, 403);
  assert.deepEqual(blockedRes.body, { error: "Insufficient permissions" });
  assert.equal(blockedNext.wasCalled(), false);
});

test("requireAdmin allows admin and master_admin but blocks co_admin and user", async (t) => {
  const allowedRoles = ["admin", "master_admin"];
  const blockedRoles = ["co_admin", "user"];

  for (const role of allowedRoles) {
    await t.test(`allows ${role}`, () => {
      const req = createRequest({
        user: {
          id: `id_${role}`,
          email: `${role}@example.com`,
          role,
          is_email_verified: true,
          is_admin: role !== "co_admin" && role !== "user",
        },
      });
      const res = createMockResponse();
      const { next, wasCalled } = createNext();

      requireAdmin(req, res, next);

      assert.equal(wasCalled(), true);
      assert.equal(res.statusCode, 200);
    });
  }

  for (const role of blockedRoles) {
    await t.test(`blocks ${role}`, () => {
      const req = createRequest({
        user: {
          id: `id_${role}`,
          email: `${role}@example.com`,
          role,
          is_email_verified: true,
          is_admin: false,
        },
      });
      const res = createMockResponse();
      const { next, wasCalled } = createNext();

      requireAdmin(req, res, next);

      assert.equal(res.statusCode, 403);
      assert.deepEqual(res.body, { error: "Admin access required" });
      assert.equal(wasCalled(), false);
    });
  }
});

test("requireMasterAdmin only allows master_admin", () => {
  const allowedReq = createRequest({
    user: {
      id: "master",
      email: "master@example.com",
      role: "master_admin",
      is_email_verified: true,
      is_admin: true,
    },
  });
  const allowedRes = createMockResponse();
  const allowedNext = createNext();

  requireMasterAdmin(allowedReq, allowedRes, allowedNext.next);

  assert.equal(allowedNext.wasCalled(), true);

  const blockedReq = createRequest({
    user: {
      id: "admin",
      email: "admin@example.com",
      role: "admin",
      is_email_verified: true,
      is_admin: true,
    },
  });
  const blockedRes = createMockResponse();
  const blockedNext = createNext();

  requireMasterAdmin(blockedReq, blockedRes, blockedNext.next);

  assert.equal(blockedRes.statusCode, 403);
  assert.deepEqual(blockedRes.body, { error: "Master admin access required" });
  assert.equal(blockedNext.wasCalled(), false);
});

test("requireCoAdminOrAdmin allows co_admin, admin, and master_admin but blocks user", async (t) => {
  const allowedRoles = ["co_admin", "admin", "master_admin"];

  for (const role of allowedRoles) {
    await t.test(`allows ${role}`, () => {
      const req = createRequest({
        user: {
          id: `id_${role}`,
          email: `${role}@example.com`,
          role,
          is_email_verified: true,
          is_admin: role === "admin" || role === "master_admin",
        },
      });
      const res = createMockResponse();
      const { next, wasCalled } = createNext();

      requireCoAdminOrAdmin(req, res, next);

      assert.equal(wasCalled(), true);
      assert.equal(res.statusCode, 200);
    });
  }

  const blockedReq = createRequest({
    user: {
      id: "user",
      email: "user@example.com",
      role: "user",
      is_email_verified: true,
      is_admin: false,
    },
  });
  const blockedRes = createMockResponse();
  const blockedNext = createNext();

  requireCoAdminOrAdmin(blockedReq, blockedRes, blockedNext.next);

  assert.equal(blockedRes.statusCode, 403);
  assert.deepEqual(blockedRes.body, { error: "Insufficient permissions" });
  assert.equal(blockedNext.wasCalled(), false);
});

test("requireVerifiedUser allows verified users and blocks unverified users", () => {
  const allowedReq = createRequest({
    user: {
      id: "verified",
      email: "verified@example.com",
      role: "user",
      is_email_verified: true,
      is_admin: false,
    },
  });
  const allowedRes = createMockResponse();
  const allowedNext = createNext();

  requireVerifiedUser(allowedReq, allowedRes, allowedNext.next);

  assert.equal(allowedNext.wasCalled(), true);

  const blockedReq = createRequest({
    user: {
      id: "pending",
      email: "pending@example.com",
      role: "user",
      is_email_verified: false,
      is_admin: false,
    },
  });
  const blockedRes = createMockResponse();
  const blockedNext = createNext();

  requireVerifiedUser(blockedReq, blockedRes, blockedNext.next);

  assert.equal(blockedRes.statusCode, 403);
  assert.deepEqual(blockedRes.body, { error: "Email verification required" });
  assert.equal(blockedNext.wasCalled(), false);
});
