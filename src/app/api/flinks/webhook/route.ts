import { NextResponse } from "next/server";
import { FlinksService } from "@/lib/flinks-service";

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    let payload: any;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
    }

    const signature = request.headers.get("x-flinks-signature") || undefined;
    const result = await FlinksService.handleWebhook(payload, signature);

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error: any) {
    console.error("Flinks webhook processing failure:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Webhook processing error",
      },
      { status: 500 }
    );
  }
}
