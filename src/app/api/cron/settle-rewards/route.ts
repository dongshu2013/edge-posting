import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Buzz } from '@prisma/client';

export const dynamic = 'force-dynamic';
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
    const body = await request.json();
    const cronSecret = body.cronSecret;

    if (cronSecret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find all expired, unsettled buzzes
    const expiredBuzzes = await prisma.buzz.findMany({
      where: {
        isSettled: false,
        OR: [
          { deadline: { lte: new Date() } },
          { isActive: false },
        ],
      },
      include: {
        replies: {
          orderBy: { createdAt: 'asc' },
          where: { status: 'PENDING' },
        },
      },
    });

    const results = await Promise.all(
      expiredBuzzes.map(async (buzz: BuzzWithReplies) => {
        // Get the top N non-rejected replies, where N is totalReplies
        const eligibleReplies = buzz.replies.slice(0, buzz.totalReplies);
        const remainingSlots = buzz.totalReplies - eligibleReplies.length;

        // Create transactions in a single transaction
        const result = await prisma.$transaction(async (tx) => {
          // Mark all eligible replies as APPROVED
          await tx.reply.updateMany({
            where: {
              id: { in: eligibleReplies.map(reply => reply.id) },
            },
            data: {
              status: 'APPROVED',
            },
          });

          // Create reward transactions for approved replies
          const rewardTransactions = eligibleReplies.map((reply: Reply) => ({
            amount: buzz.price,
            type: 'REWARD' as const,
            status: 'PENDING' as const,
            fromAddress: buzz.createdBy,
            toAddress: reply.createdBy,
            buzzId: buzz.id,
            replyId: reply.id,
          }));

          // Increase the balance of the user who replied
          rewardTransactions.forEach(async (transaction) => {
            await prisma.user.update({
              where: { uid: transaction.toAddress },
              data: {
                balance: { increment: transaction.amount },
                totalEarned: { increment: transaction.amount },
              },
            });
          });

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
                type: 'BURN',
                status: 'PENDING',
                fromAddress: buzz.createdBy,
                toAddress: '0x000000000000000000000000000000000000dEaD', // Burn address
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
        });

        return result;
      })
    );

    return NextResponse.json({
      message: 'Settlement completed',
      settledBuzzes: results,
    });
  } catch (error) {
    console.error('Error in settle rewards job:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 