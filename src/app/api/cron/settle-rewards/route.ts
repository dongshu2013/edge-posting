import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Buzz, Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";
export const maxDuration = 300; // 5 minutes

interface Reply {
  id: string;
  createdBy: string;
}

type BuzzWithReplies = Buzz & {
  replies: Reply[];
};

export async function POST(request: Request) {
  try {
    // Verify the request is from a trusted source (e.g., cron job service)
    const authHeader = request.headers.get("authorization");
    console.log("Received auth header:", authHeader);
    console.log("Expected auth:", `Bearer ${process.env.CRON_SECRET}`);

    // More robust auth check
    if (
      !authHeader ||
      !process.env.CRON_SECRET ||
      authHeader.trim() !== `Bearer ${process.env.CRON_SECRET}`.trim()
    ) {
      console.log("Auth failed:", {
        hasHeader: !!authHeader,
        hasSecret: !!process.env.CRON_SECRET,
      });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await prisma.buzz.updateMany({
      where: {
        isActive: true,
        deadline: {
          lte: new Date(),
        },
      },
      data: {
        isActive: false,
      },
    });

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
        const eligibleReplies = buzz.replies.slice(0, buzz.totalReplies);
        const remainingSlots = buzz.totalReplies - eligibleReplies.length;

        try {
          // Add transaction timeout and retry configuration
          const result = await prisma.$transaction(
            async (tx) => {
              // Mark all eligible replies as APPROVED
              await tx.reply.updateMany({
                where: {
                  id: { in: eligibleReplies.map((reply) => reply.id) },
                },
                data: {
                  status: "APPROVED",
                },
              });

              // Create reward transactions for approved replies
              const rewardTransactions = eligibleReplies.map(
                (reply: Reply) => ({
                  amount: buzz.price,
                  type: "REWARD" as const,
                  status: "PENDING" as const,
                  fromAddress: buzz.createdBy,
                  toAddress: reply.createdBy,
                  buzzId: buzz.id,
                  replyId: reply.id,
                })
              );

              if (rewardTransactions.length > 0) {
                await tx.transaction.createMany({
                  data: rewardTransactions,
                });
              }

              // If there are remaining slots, create BURN transactions
              if (remainingSlots > 0) {
                await tx.transaction.create({
                  data: {
                    amount: buzz.price * remainingSlots,
                    type: "BURN",
                    status: "PENDING",
                    fromAddress: buzz.createdBy,
                    toAddress: process.env.NEXT_PUBLIC_SERVICE_ADDRESS || "", // Burn address
                    buzzId: buzz.id,
                  },
                });
              }

              // Mark the buzz as settled
              await tx.buzz.update({
                where: { id: buzz.id },
                data: { isSettled: true },
              });

              return {
                buzzId: buzz.id,
                approvedReplies: eligibleReplies.length,
                burnedSlots: remainingSlots,
              };
            },
            {
              timeout: 20000, // 20 seconds timeout
              maxWait: 25000, // maximum wait time for transaction
              isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted, // less strict isolation level
            }
          );

          return result;
        } catch (txError) {
          console.error(`Transaction failed for buzz ${buzz.id}:`, txError);
          throw txError;
        }
      })
    );

    return NextResponse.json({
      message: "Settlement completed",
      settledBuzzes: results,
    });
  } catch (error) {
    console.error("Error in settle rewards job:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
