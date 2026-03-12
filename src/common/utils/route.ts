import { AppError } from "@/common/errors/app-error";

export function readHomeId(params: { homeId?: string }): string {
  if (!params.homeId) {
    throw new AppError("VAL_HOME_ID_REQUIRED", "homeId path parameter is required", 400);
  }
  return params.homeId;
}
