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
    const { address, amount } = body;

    if (!address || !amount) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (amount <= 0) {
      return NextResponse.json(
        { error: "Amount must be greater than 0" },
        { status: 400 }
      );
    }

    // Get user's balance
    const userBalance = await prisma.user.findUnique({
      where: { uid: user.uid },
      select: { balance: true },
    });

    if (!userBalance) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (userBalance.balance < amount) {
      return NextResponse.json(
        { error: "Insufficient balance" },
        { status: 400 }
      );
    }

    const chainId = process.env.ETHEREUM_CHAIN_ID;
    if (!chainId) {
      return NextResponse.json(
        { error: "ETHEREUM_CHAIN_ID is not set" },
        { status: 500 }
      );
    }

    // Update user's balance
    await prisma.user.update({
      where: { uid: user.uid },
      data: {
        balance: {
          decrement: amount,
        },
      },
    });

    const txHash = await transferERC20({
      chainId: Number(chainId),
      recipient: address,
      amount: amount.toString(),
      decimals: 18,
    });

    console.log("txHash", txHash);

    if (!txHash) {
      // Rollback the balance
      await prisma.user.update({
        where: { uid: user.uid },
        data: {
          balance: {
            increment: amount,
          },
        },
      });

      return NextResponse.json(
        { error: "Failed to withdraw" },
        { status: 500 }
      );
    }

    // Save withdrawal request
    const withdrawal = await prisma.withdrawal.create({
      data: {
        userId: user.uid,
        amount,
        address,
        status: "COMPLETED",
      },
    });

    return NextResponse.json({
      message: "Withdrawal request created successfully",
      txHash,
    });
  } catch (error) {
    console.error("Error processing withdrawal:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
