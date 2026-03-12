import { cookies } from "next/headers";
import { createHash } from "node:crypto";
import { HomeMembership } from "@prisma/client";
import { UnauthorizedError } from "@/common/errors/app-error";
import { CurrentUser } from "@/common/types/auth";
import { env } from "@/platform/config/env";
import { prisma } from "@/platform/db/prisma";

function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export async function getCurrentUser(): Promise<CurrentUser> {
  const cookieStore = await cookies();
  const token = cookieStore.get(env.SESSION_COOKIE_NAME)?.value;
  if (!token) {
    throw new UnauthorizedError("AUTH_INVALID_SESSION", "Missing session");
  }

  const session = await prisma.session.findUnique({
    where: { tokenHash: sha256(token) },
    include: { user: { include: { memberships: true } } }
  });

  if (!session || session.revokedAt || session.expiresAt < new Date()) {
    throw new UnauthorizedError("AUTH_SESSION_EXPIRED", "Session expired");
  }

  const rolesByHome = session.user.memberships.reduce<Record<string, string[]>>((acc: Record<string, string[]>, m: HomeMembership) => {
    if (!m.isActive) return acc;
    if (!acc[m.homeId]) acc[m.homeId] = [];
    acc[m.homeId].push(m.role);
    return acc;
  }, {});

  return {
    id: session.user.id,
    email: session.user.email,
    rolesByHome
  };
}
