import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { transferERC20 } from "@/lib/ethereum";

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { address } = body;

    const txHash = await transferERC20({
      chainId: 84532,
      recipient: address,
      amount: "100",
      decimals: 6,
    });

    if (!txHash) {
      return NextResponse.json(
        { error: "Failed to transfer ERC20" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Faucet successful",
    });
  } catch (error) {
    console.error("Error processing withdrawal:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
