import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { getPublicClient } from "@/lib/ethereum";
import { contractAbi } from "@/config/contractAbi";

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

    const result = await prisma.$transaction(async (tx: any) => {
      const deletedWithdrawRequest = await tx.userWithdrawRequest
        .delete({
          where: {
            userId_nonceOnChain: {
              userId: user.uid,
              nonceOnChain: userNonce.toString(),
            },
          },
        })
        .catch((err: any) => {});
      console.log("deleteResult", deletedWithdrawRequest);

      if (deletedWithdrawRequest) {
        await Promise.all(
          deletedWithdrawRequest.tokenAddresses.map(
            async (tokenAddress: string, index: number) => {
              const updateResult = await tx.userBalance.update({
                where: {
                  userId_tokenAddress: {
                    userId: user.uid,
                    tokenAddress: tokenAddress,
                  },
                },
                data: {
                  tokenAmountOnChain: {
                    increment:
                      deletedWithdrawRequest.tokenAmountsOnChain[index],
                  },
                },
              });

              if (!updateResult) {
                throw new Error("User balance not found");
              }
            }
          )
        );
      }

      // Transaction completes only after all updates finish
      return deletedWithdrawRequest;
    });

    return NextResponse.json({
      message: "Withdrawal request discarded successfully",
    });
  } catch (error) {
    console.error("Error processing withdrawal:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
