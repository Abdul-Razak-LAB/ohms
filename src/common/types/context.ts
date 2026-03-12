import { NextRequest } from "next/server";
import { getCurrentUser } from "@/modules/auth/auth.service";
import { requireHomeMembership } from "@/modules/tenancy/tenant-guard";

export async function buildRequestContext(request: NextRequest, homeId: string) {
  const user = await getCurrentUser();
  requireHomeMembership(homeId, user);

  return {
    requestId: request.headers.get("x-request-id") || crypto.randomUUID(),
    homeId,
    ip: request.headers.get("x-forwarded-for") || "unknown",
    user
  };
}
