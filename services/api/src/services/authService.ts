import bcrypt from "bcryptjs";
import { createHash } from "crypto";
import type { LoginInput, RegisterInput } from "@locaguide/contracts";
import { AppError, UnauthorizedError } from "@locaguide/shared";
import { prisma } from "@locaguide/db";
import { signAccessToken, signRefreshToken, verifyToken } from "../middleware/auth";

const BCRYPT_ROUNDS = 12;

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function register(input: RegisterInput) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) {
    throw new AppError("EMAIL_ALREADY_REGISTERED", "An account with this email already exists.", 409);
  }
  const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);
  const user = await prisma.user.create({
    data: {
      email: input.email,
      passwordHash,
      displayName: input.displayName,
      preference: { create: { preferredLanguage: input.preferredLanguage } },
    },
  });
  return issueTokens(user.id, user.role, user.tenantId);
}

export async function login(input: LoginInput) {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  if (!user || user.deletedAt) throw new UnauthorizedError("Invalid email or password.");
  const valid = await bcrypt.compare(input.password, user.passwordHash);
  if (!valid) throw new UnauthorizedError("Invalid email or password.");
  return issueTokens(user.id, user.role, user.tenantId);
}

export async function refresh(refreshToken: string) {
  let claims: { sub: string; type: string };
  try {
    claims = verifyToken(refreshToken);
  } catch {
    throw new UnauthorizedError("Invalid or expired refresh token.");
  }
  if (claims.type !== "refresh") throw new UnauthorizedError("Invalid token type.");

  const tokenHash = hashToken(refreshToken);
  const stored = await prisma.refreshToken.findFirst({
    where: { userId: claims.sub, tokenHash, revokedAt: null, expiresAt: { gt: new Date() } },
  });
  if (!stored) throw new UnauthorizedError("Refresh token not recognized or already used.");

  await prisma.refreshToken.update({ where: { id: stored.id }, data: { revokedAt: new Date() } });

  const user = await prisma.user.findUniqueOrThrow({ where: { id: claims.sub } });
  return issueTokens(user.id, user.role, user.tenantId);
}

async function issueTokens(userId: string, role: import("@locaguide/contracts").Role, tenantId: string | null) {
  const accessToken = signAccessToken({ sub: userId, role, tenantId });
  const refreshToken = signRefreshToken(userId);
  await prisma.refreshToken.create({
    data: {
      userId,
      tokenHash: hashToken(refreshToken),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });
  return { accessToken, refreshToken, userId };
}
