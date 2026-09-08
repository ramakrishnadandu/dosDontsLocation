import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { loadEnv } from "@locaguide/config";
import type { Role } from "@locaguide/contracts";
import { ForbiddenError, UnauthorizedError } from "@locaguide/shared";

export interface AuthenticatedUser {
  id: string;
  role: Role;
  tenantId: string | null;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export interface AccessTokenClaims {
  sub: string;
  role: Role;
  tenantId: string | null;
}

export function signAccessToken(claims: AccessTokenClaims): string {
  const env = loadEnv();
  const options: jwt.SignOptions = { expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"] };
  return jwt.sign(claims, env.JWT_SECRET, options);
}

export function signRefreshToken(userId: string): string {
  const env = loadEnv();
  const options: jwt.SignOptions = { expiresIn: env.JWT_REFRESH_EXPIRES_IN as jwt.SignOptions["expiresIn"] };
  return jwt.sign({ sub: userId, type: "refresh" }, env.JWT_SECRET, options);
}

export function verifyToken<T>(token: string): T {
  const env = loadEnv();
  return jwt.verify(token, env.JWT_SECRET) as T;
}

/** Requires a valid bearer token; attaches req.user. Never accepts tokens via query string. */
export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const header = req.header("authorization");
  if (!header?.startsWith("Bearer ")) {
    throw new UnauthorizedError();
  }
  try {
    const claims = verifyToken<AccessTokenClaims>(header.slice("Bearer ".length));
    req.user = { id: claims.sub, role: claims.role, tenantId: claims.tenantId };
    next();
  } catch {
    throw new UnauthorizedError("Invalid or expired token.");
  }
}

/** Populates req.user if a valid token is present, but does not require one. */
export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const header = req.header("authorization");
  if (header?.startsWith("Bearer ")) {
    try {
      const claims = verifyToken<AccessTokenClaims>(header.slice("Bearer ".length));
      req.user = { id: claims.sub, role: claims.role, tenantId: claims.tenantId };
    } catch {
      // ignore invalid token for optional auth
    }
  }
  next();
}

/** RBAC guard (section 20/60). Use after requireAuth. */
export function requireRole(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) throw new UnauthorizedError();
    if (!roles.includes(req.user.role)) {
      throw new ForbiddenError(`This action requires one of the following roles: ${roles.join(", ")}.`);
    }
    next();
  };
}
