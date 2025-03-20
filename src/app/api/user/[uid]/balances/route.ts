import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { uid: string } }
) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { uid } = await params;
    // Only allow users to view their own transactions
    if (user.uid !== uid) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get all transactions where the user is either the sender or receiver
    const balances = await prisma.userBalance.findMany({
      where: {
        userId: user.uid,
      },
      select: {
        id: true,
        tokenAddress: true,
        tokenName: true,
        tokenAmountOnChain: true,
      },
    });

    const formattedBalances = balances.map((balance) => ({
      ...balance,
      tokenAmountOnChain: balance.tokenAmountOnChain.toString(),
    }));

    return NextResponse.json({ balances: formattedBalances });
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
