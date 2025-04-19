import { Buzz, Reply } from "@prisma/client";
import * as math from "mathjs";
import { prisma } from "./prisma";

type BuzzWithReplies = Buzz & {
  replies: Reply[];
};

class BuzzHandler {
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning: boolean = false;

  constructor(private intervalMs: number = 10000) {}

  public start(): void {
    if (this.isRunning) {
      console.log("BuzzHandler: Interval handler is already running");
      return;
    }

    this.isRunning = true;
    this.intervalId = setInterval(() => {
      this.processWork();
    }, this.intervalMs);

    console.log("BuzzHandler: Interval handler started");
  }

  public stop(): void {
    if (!this.isRunning) {
      console.log("BuzzHandler: Interval handler is not running");
      return;
    }

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log("BuzzHandler: Interval handler stopped");
  }

  private async processWork(): Promise<void> {
    try {
      // Find all expired, unsettled buzzes
      const expiredBuzzes = await prisma.buzz.findMany({
        where: {
          isSettled: false,
          OR: [{ deadline: { lte: new Date() } }, { isActive: false }],
        },
        include: {
          replies: {
            orderBy: { createdAt: "asc" },
            where: { status: "PENDING" },
          },
        },
      });

      const results = await Promise.all(
        expiredBuzzes.map(async (buzz: BuzzWithReplies) => {
          if (buzz.rewardSettleType === "fixed") {
          } else {
            await settleDefaultTypeRewards(buzz);
          }
        })
      );
    } catch (error) {
      console.error("Error in background processing:", error);
    }
  }
}

export const buzzHandler = new BuzzHandler();

const settleDefaultTypeRewards = async (buzz: any) => {
  const replyUserIds = buzz.replies.map((reply: any) => reply.createdBy);

  const totalTokenAmountOnChain = math
    .bignumber(buzz.tokenAmount)
    .times(math.bignumber(10).pow(buzz.tokenDecimals));

  const kolUserIds = buzz.replies
    .filter((reply: any) => reply.userRole === "kol")
    .map((reply: any) => reply.createdBy);
  const holderUserIds = buzz.replies
    .filter((reply: any) => reply.userRole === "holder")
    .map((reply: any) => reply.createdBy);
  const normalUserIds = buzz.replies
    .filter((reply: any) => reply.userRole === "normal")
    .map((reply: any) => reply.createdBy);

  // const hasBalanceWeights = userWeights
  //   .filter((weight: number) => weight > 0)
  //   // Filter out kols
  //   .filter((weight: number) => {
  //     const kol = kols.find((kol: any) => kol.userId === weight);
  //     return !kol;
  //   });
  // const emptyBalanceWeights = userWeights
  //   .filter((weight: number) => weight === 0)
  //   // Filter out kols
  //   .filter((weight: number) => {
  //     const kol = kols.find((kol: any) => kol.userId === weight);
  //     return !kol;
  //   });

  // 40%
  const hasBalanceRewardTokenAmount =
    holderUserIds.length > 0
      ? totalTokenAmountOnChain
          .mul(math.bignumber(buzz.shareOfHolders))
          .div(math.bignumber(100))
      : math.bignumber(0);
  // 10%
  const emptyBalanceRewardTokenAmount =
    normalUserIds.length > 0
      ? totalTokenAmountOnChain
          .mul(math.bignumber(buzz.shareOfOthers))
          .div(math.bignumber(100))
      : math.bignumber(0);

  // 50%
  const kolRewardTokenAmount =
    kolUserIds.length > 0
      ? totalTokenAmountOnChain
          .mul(math.bignumber(buzz.shareOfKols))
          .div(math.bignumber(100))
      : math.bignumber(0);

  const remainingRewardTokenAmount = totalTokenAmountOnChain
    .minus(kolRewardTokenAmount)
    .minus(emptyBalanceRewardTokenAmount)
    .minus(hasBalanceRewardTokenAmount);

  // console.log("totalTokenAmountOnChain", totalTokenAmountOnChain);
  // console.log("kolRewardTokenAmount", kolRewardTokenAmount);
  // console.log("hasBalanceRewardTokenAmount", hasBalanceRewardTokenAmount);
  // console.log("emptyBalanceRewardTokenAmount", emptyBalanceRewardTokenAmount);
  // console.log("remainingRewardTokenAmount", remainingRewardTokenAmount);

  const settleHistories: any[] = [];

  const addUserBalancesResult = await prisma.$transaction(async (tx: any) => {
    buzz.replies.forEach(async (reply: Reply, index: number) => {
      let amountOnChain = "0";
      if (reply.userRole === "kol") {
        amountOnChain = kolRewardTokenAmount
          .div(math.bignumber(kolUserIds.length))
          .floor()
          .toString();
      } else if (reply.userRole === "holder") {
        amountOnChain = hasBalanceRewardTokenAmount
          .div(math.bignumber(holderUserIds.length))
          .floor()
          .toString();
      } else {
        amountOnChain = emptyBalanceRewardTokenAmount
          .div(math.bignumber(normalUserIds.length))
          .floor()
          .toString();
      }

      await addUserBalance(buzz, tx, reply.createdBy, amountOnChain);
      if (math.bignumber(amountOnChain).gt(0)) {
        settleHistories.push({
          userId: reply.createdBy,
          buzzId: buzz.id,
          settleAmount: amountOnChain,
          type: reply.userRole,
        });
      }
    });

    // Return fund to creator
    if (remainingRewardTokenAmount.gt(0)) {
      await addUserBalance(
        buzz,
        tx,
        buzz.createdBy,
        remainingRewardTokenAmount.toString()
      );
      settleHistories.push({
        userId: buzz.createdBy,
        buzzId: buzz.id,
        settleAmount: remainingRewardTokenAmount.toString(),
        type: "refund",
      });
    }

    await tx.settleHistory.createMany({
      data: settleHistories,
    });

    // Mark the buzz as settled
    await tx.buzz.update({
      where: { id: buzz.id },
      data: { isSettled: true },
    });
  });
};

const addUserBalance = async (
  buzz: any,
  tx: any,
  userId: string,
  amountOnChain: string
) => {
  if (math.bignumber(amountOnChain).lte(0)) {
    return;
  }

  const updatedBalance = await tx.userBalance
    .upsert({
      where: {
        // Use the unique constraint we defined in the schema
        userId_tokenAddress: {
          userId: userId,
          tokenAddress: buzz.customTokenAddress,
        },
      },
      // If no record exists, create a new one
      create: {
        userId,
        tokenAddress: buzz.customTokenAddress,
        tokenName: buzz.paymentToken,
        tokenAmountOnChain: amountOnChain,
        tokenDecimals: buzz.tokenDecimals,
      },
      // If a record exists, update the tokenAmount
      update: {
        tokenAmountOnChain: {
          // Increment the existing amount
          increment: amountOnChain,
        },
      },
    })
    .catch((err: any) => {
      console.error("Error adding user balance:", err);
    });

  return updatedBalance;
};
