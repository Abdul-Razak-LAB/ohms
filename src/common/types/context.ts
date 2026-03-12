import { NextRequest } from "next/server";
import { getCurrentUser } from "@/modules/auth/auth.service";
import { requireHomeMembership } from "@/modules/tenancy/tenant-guard";
import { requireSameOrigin } from "@/platform/security/same-origin";

export async function buildRequestContext(request: NextRequest, homeId: string) {
  const method = request.method.toUpperCase();
  const isMutation = ["POST", "PUT", "PATCH", "DELETE"].includes(method);
  const isBrowserRequest = Boolean(request.headers.get("sec-fetch-site") || request.headers.get("origin"));
  if (isMutation && isBrowserRequest) {
    requireSameOrigin(request);
  }

  const user = await getCurrentUser();
  requireHomeMembership(homeId, user);

  return {
    requestId: request.headers.get("x-request-id") || crypto.randomUUID(),
    homeId,
    ip: request.headers.get("x-forwarded-for") || "unknown",
    user
  };
}
