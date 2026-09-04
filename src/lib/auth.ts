import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { ApprovalStatus, Role } from "@prisma/client";
import { prisma } from "./prisma";

const JWT_SECRET = process.env.JWT_SECRET ?? "dev-insecure-secret";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? "7d";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  approvalStatus?: ApprovalStatus;
  homeDepartmentId?: string | null;
  phone?: string | null;
  address?: string | null;
  profileCompleted?: boolean;
};

export type JwtPayload = {
  userId: string;
  role: Role;
};

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export function signToken(payload: JwtPayload) {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"],
  });
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, JWT_SECRET) as JwtPayload;
}

function extractBearerToken(request: NextRequest): string | null {
  const header = request.headers.get("authorization");
  if (header?.startsWith("Bearer ")) {
    return header.slice(7).trim();
  }
  return null;
}

export async function authenticate(request: NextRequest): Promise<AuthUser> {
  const token =
    extractBearerToken(request) ??
    (await cookies()).get("token")?.value ??
    null;

  if (!token) {
    throw new Error("UNAUTHORIZED");
  }

  let payload: JwtPayload;
  try {
    payload = verifyToken(token);
  } catch {
    throw new Error("UNAUTHORIZED");
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      approvalStatus: true,
      homeDepartmentId: true,
      profileCompleted: true,
    },
  });

  if (!user || user.approvalStatus !== ApprovalStatus.APPROVED) {
    throw new Error("UNAUTHORIZED");
  }

  return user;
}

export async function requireAuth(request: NextRequest): Promise<AuthUser> {
  return authenticate(request);
}

export async function requireRole(
  request: NextRequest,
  roles: Role[],
): Promise<AuthUser> {
  const user = await authenticate(request);
  if (!roles.includes(user.role)) {
    throw new Error("FORBIDDEN");
  }
  return user;
}
