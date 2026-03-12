import { NextRequest } from "next/server";
import { withApiHandler, requireJson } from "@/common/api/handler";
import { readHomeId } from "@/common/utils/route";
import { buildRequestContext } from "@/common/types/context";
import { ValidationError } from "@/common/errors/app-error";
import { verifyDocumentSchema } from "@/modules/documents/documents.schema";
import { verifyDocument } from "@/modules/documents/documents.service";

export async function POST(request: NextRequest, { params }: { params: Promise<{ homeId: string }> }) {
  return withApiHandler(async () => {
    requireJson(request);

    const { homeId } = await params;
    const context = await buildRequestContext(request, readHomeId({ homeId }));

    const parsed = verifyDocumentSchema.safeParse(await request.json());
    if (!parsed.success) {
      throw new ValidationError("VAL_INVALID_PAYLOAD", "Invalid document verification payload", parsed.error.flatten());
    }

    const childDocument = await verifyDocument(parsed.data, context);
    return { childDocument };
  });
}
