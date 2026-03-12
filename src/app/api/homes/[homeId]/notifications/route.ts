import { NextRequest } from "next/server";
import { z } from "zod";
import { withApiHandler, requireJson } from "@/common/api/handler";
import { readHomeId } from "@/common/utils/route";
import { buildRequestContext } from "@/common/types/context";
import { enqueueNotification } from "@/modules/notifications/notifications.service";
import { ValidationError } from "@/common/errors/app-error";

const enqueueSchema = z.object({
  channel: z.enum(["email", "push", "sms"]),
  template: z.string().min(1),
  payload: z.record(z.unknown()),
  scheduledAt: z.coerce.date().optional()
});

export async function POST(request: NextRequest, { params }: { params: Promise<{ homeId: string }> }) {
  return withApiHandler(async () => {
    requireJson(request);

    const { homeId } = await params;
    const context = await buildRequestContext(request, readHomeId({ homeId }));

    const parsed = enqueueSchema.safeParse(await request.json());
    if (!parsed.success) {
      throw new ValidationError("VAL_INVALID_PAYLOAD", "Invalid notification payload", parsed.error.flatten());
    }

    const notification = await enqueueNotification(
      context,
      parsed.data.channel,
      parsed.data.template,
      parsed.data.payload,
      parsed.data.scheduledAt
    );

    return { notification };
  });
}
