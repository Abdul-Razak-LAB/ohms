import { ForbiddenError } from "@/common/errors/app-error";
import { CurrentUser } from "@/common/types/auth";

const rolePermissionMap: Record<string, string[]> = {
  administrator: ["*"],
  finance: [
    "expense:create",
    "expense:approve",
    "donor:manage",
    "payroll:approve",
    "purchase:manage",
    "report:read",
    "notification:send"
  ],
  caregiver: [
    "child:read",
    "attendance:write",
    "caretask:write",
    "meal:write",
    "medication:write",
    "incident:create"
  ],
  case_manager: ["case:manage", "incident:review", "child:read", "document:verify", "notification:send"],
  auditor: ["audit:read", "audit:write", "report:read", "compliance:read"]
};

export function requirePermission(homeId: string, permission: string, user: CurrentUser) {
  const roles = user.rolesByHome[homeId] || [];
  const hasPermission = roles.some((role) => {
    const allowed = rolePermissionMap[role] || [];
    return allowed.includes("*") || allowed.includes(permission);
  });

  if (!hasPermission) {
    throw new ForbiddenError("PERM_HOME_SCOPE_DENIED", "User lacks permission for this home scope");
  }
}
