import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { getPublicClient } from "@/lib/ethereum";
import { contractAbi } from "@/config/contractAbi";
import { getUserNonce, getWithdrawSignature } from "@/utils/evmUtils";

export interface WithdrawRequest {
  tokens: {
    tokenAddress: string;
  }[];
}

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

    const body: WithdrawRequest = await request.json();
    const { tokens } = body;

    if (!tokens || tokens.length === 0) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
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

    const userNonce = await getUserNonce(user.uid, publicClient);
    console.log("userNonce", userNonce.toString());

    const userBalances = await prisma.userBalance.findMany({
      where: {
        userId: user.uid,
        tokenAddress: { in: tokens.map((token) => token.tokenAddress) },
        tokenAmountOnChain: { gt: 0 },
      },
    });

    const withdrawTokens = userBalances.map((balance) => ({
      tokenAddress: balance.tokenAddress,
      tokenAmountOnChain: balance.tokenAmountOnChain,
    }));
    console.log("withdrawTokens", withdrawTokens);

    if (withdrawTokens.length === 0) {
      return NextResponse.json(
        { error: "No tokens to withdraw" },
        { status: 400 }
      );
    }

    const createdWithdrawRequest = await prisma.$transaction(
      async (tx: any) => {
        // Create withdraw request
        const withdrawRequest = await tx.userWithdrawRequest.create({
          data: {
            userId: user.uid,
            nonceOnChain: userNonce.toString(),
            tokenAddresses: userBalances.map((balance) => balance.tokenAddress),
            tokenAmountsOnChain: userBalances.map(
              (balance) => balance.tokenAmountOnChain
            ),
            tokenDecimals: userBalances.map((balance) => balance.tokenDecimals),
          },
        });

        // Use Promise.all instead of forEach
        await Promise.all(
          withdrawTokens.map(async (token) => {
            const updateResult = await tx.userBalance.update({
              where: {
                userId_tokenAddress: {
                  userId: user.uid,
                  tokenAddress: token.tokenAddress,
                },
                tokenAmountOnChain: {
                  gte: token.tokenAmountOnChain,
                },
              },
              data: {
                tokenAmountOnChain: {
                  decrement: token.tokenAmountOnChain,
                },
              },
            });

            if (!updateResult) {
              throw new Error("User balance not found");
            }
          })
        );

        // Transaction completes only after all updates finish
        return withdrawRequest;
      }
    );

    if (!createdWithdrawRequest) {
      return NextResponse.json(
        { error: "Failed to create withdraw request" },
        { status: 500 }
      );
    }

    const result = await getWithdrawSignature(
      user.uid,
      dbUser.bindedWallet as `0x${string}`,
      createdWithdrawRequest.nonceOnChain,
      createdWithdrawRequest.tokenAddresses,
      createdWithdrawRequest.tokenAmountsOnChain
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
