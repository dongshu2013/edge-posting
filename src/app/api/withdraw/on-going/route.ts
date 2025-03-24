import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { contractAbi } from "@/config/contractAbi";
import { getPublicClient } from "@/lib/ethereum";
import { getUserNonce } from "@/utils/evmUtils";

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: {
        uid: user.uid,
      },
    });
    if (!dbUser?.bindedWallet) {
      return NextResponse.json({ error: "User not binded wallet" }, { status: 404 });
    }

    const publicClient = getPublicClient(
      Number(process.env.NEXT_PUBLIC_ETHEREUM_CHAIN_ID)
    );
    if (!publicClient) {
      return NextResponse.json(
        { error: "Failed to get public client" },
        { status: 500 }
      );
    }

    const userNonce = await getUserNonce(user.uid, publicClient);

    const existingWithdrawRequest = await prisma.userWithdrawRequest.findUnique({
      where: {
        userId_nonceOnChain: {
          userId: user.uid,
          nonceOnChain: userNonce.toString(),
        },
      },
    });

    const formatedWithdrawRequest = existingWithdrawRequest
      ? {
          ...existingWithdrawRequest,
          tokenAmountsOnChain: existingWithdrawRequest.tokenAmountsOnChain.map(
            (amount: BigInt) => amount.toString()
          ),
        }
      : null;
    return NextResponse.json({ withdrawRequest: formatedWithdrawRequest });
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
