import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const order = body.data?.order;

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 400 });
    }

    const userId = order.payer_id;
    const amount = order.original_amount_on_chain;
    const increaseBalance = amount / 10 ** 6;

    await prisma.user.update({
      where: {
        uid: userId,
      },
      data: {
        balance: {
          increment: increaseBalance,
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Payment callback processed successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error processing payment callback:", error);
    // Return an error response
    return NextResponse.json(
      {
        success: false,
        message: "Failed to process payment callback",
      },
      { status: 500 }
    );
  }
}
