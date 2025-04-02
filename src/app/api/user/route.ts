import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const {
      uid,
      email,
      username,
      nickname,
      avatar,
      bio,
      mood,
      twitterUsername,
    } = await request.json();

    if (!uid) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.upsert({
      where: { uid },
      update: {
        email,
        avatar:
          avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${uid}`,
      },
      create: {
        uid,
        email,
        username,
        nickname: nickname || username,
        avatar:
          avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${uid}`,
        totalEarned: 0,
        balance: 0,
        bio,
        mood,
        twitterUsername,
      },
    });

    // Bind kol with new user
    if (user?.twitterUsername) {
      const updatedKol = await prisma.kol
        .update({
          where: {
            userId: undefined,
            twitterUsername: user.twitterUsername,
          },
          data: {
            userId: user.uid,
          },
        })
        .catch((err) => {
          console.error("Error updating kol:", err);
        });
      console.log("bind kol with new user:", updatedKol);

      if (updatedKol) {
        // Transfer kol balance to user
        const kolBalances = await prisma.kolBalance.findMany({
          where: {
            kolId: updatedKol.id,
          },
        });

        await prisma.$transaction(async (tx: any) => {
          kolBalances.forEach(async (kolBalance: any) => {
            await addUserBalance(
              kolBalance,
              tx,
              user.uid,
              kolBalance.tokenAmountOnChain
            );

            await tx.kolBalance.delete({
              where: {
                id: kolBalance.id,
              },
            });
          });
        });
      }
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to create/update user" },
      { status: 500 }
    );
  }
}

const addUserBalance = async (
  kolBalance: any,
  tx: any,
  userId: string,
  amountOnChain: string
) => {
  const updatedBalance = await tx.userBalance.upsert({
    where: {
      // Use the unique constraint we defined in the schema
      userId_tokenAddress: {
        userId: userId,
        tokenAddress: kolBalance.customTokenAddress,
      },
    },
    // If no record exists, create a new one
    create: {
      userId,
      tokenAddress: kolBalance.customTokenAddress,
      tokenName: kolBalance.paymentToken,
      tokenAmountOnChain: amountOnChain,
      tokenDecimals: kolBalance.tokenDecimals,
    },
    // If a record exists, update the tokenAmount
    update: {
      tokenAmountOnChain: {
        // Increment the existing amount
        increment: amountOnChain,
      },
    },
  });

  return updatedBalance;
};
