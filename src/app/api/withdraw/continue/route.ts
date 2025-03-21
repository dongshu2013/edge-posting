import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { getPublicClient } from "@/lib/ethereum";
import { contractAbi } from "@/config/contractAbi";
import { TicketX } from "lucide-react";
import { getWithdrawSignature } from "@/utils/evmUtils";

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { uid: user.uid },
      select: {
        bindedWallet: true,
      },
    });
    if (!dbUser?.bindedWallet) {
      return NextResponse.json(
        { error: "User binded wallet not found" },
        { status: 404 }
      );
    }

    // Get user nonce on chain
    const publicClient = getPublicClient(
      Number(process.env.NEXT_PUBLIC_ETHEREUM_CHAIN_ID)
    );

    if (!publicClient) {
      return NextResponse.json(
        { error: "Failed to get public client" },
        { status: 500 }
      );
    }

    const userNonce = await publicClient?.readContract({
      address: process.env.NEXT_PUBLIC_BSC_CA as `0x${string}`,
      abi: contractAbi,
      functionName: "getNonce",
      args: [dbUser.bindedWallet as `0x${string}`],
    });
    console.log("userNonce", userNonce.toString());

    const existingWithdrawRequest = await prisma.userWithdrawRequest.findUnique(
      {
        where: {
          userId_nonceOnChain: {
            userId: user.uid,
            nonceOnChain: userNonce.toString(),
          },
        },
      }
    );

    if (!existingWithdrawRequest) {
      return NextResponse.json(
        { error: "Withdrawal request not found" },
        { status: 404 }
      );
    }

    const result = await getWithdrawSignature(
      dbUser.bindedWallet as `0x${string}`,
      BigInt(existingWithdrawRequest.nonceOnChain),
      existingWithdrawRequest.tokenAddresses as `0x${string}`[],
      existingWithdrawRequest.tokenAmountsOnChain
    );

    if (!result) {
      return NextResponse.json(
        { error: "Failed to get withdraw signature" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Withdrawal signature created successfully",
      result,
    });
  } catch (error) {
    console.error("Error processing withdrawal:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
