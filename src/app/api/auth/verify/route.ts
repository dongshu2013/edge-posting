import { NextResponse } from "next/server";
import { SiweMessage } from "siwe";

export async function POST(req: Request) {
  try {
    const { message, signature } = await req.json();
    const siweMessage = new SiweMessage(message);

    const fields = await siweMessage.verify({ signature });

    if (!fields.success) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 422 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to verify signature" },
      { status: 500 }
    );
  }
}
