import { ForbiddenError } from "@/common/errors/app-error";
import { CurrentUser } from "@/common/types/auth";

export function requireHomeMembership(homeId: string, user: CurrentUser) {
  if (!user.rolesByHome[homeId] || user.rolesByHome[homeId].length === 0) {
    throw new ForbiddenError("PERM_HOME_SCOPE_DENIED", "User is not a member of this home");
  }
}
