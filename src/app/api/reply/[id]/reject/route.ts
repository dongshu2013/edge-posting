import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const replyId = params.id;

    // Get the reply and associated buzz
    const reply = await prisma.reply.findUnique({
      where: { id: replyId },
      include: {
        buzz: {
          select: {
            createdBy: true,
            isSettled: true,
          },
        },
      },
    });

    if (!reply) {
      return NextResponse.json(
        { error: 'Reply not found' },
        { status: 404 }
      );
    }

    // Check if the user is the buzz owner
    if (session.address?.toLowerCase() !== reply.buzz.createdBy.toLowerCase()) {
      return NextResponse.json(
        { error: 'Only the buzz owner can reject replies' },
        { status: 403 }
      );
    }

    // Check if the buzz is already settled
    if (reply.buzz.isSettled) {
      return NextResponse.json(
        { error: 'Cannot reject replies for a settled buzz' },
        { status: 400 }
      );
    }

    // Update the reply status to REJECTED
    const updatedReply = await prisma.reply.update({
      where: { id: replyId },
      data: {
        status: 'REJECTED',
      },
    });

    return NextResponse.json(updatedReply);
  } catch (error) {
    console.error('Error in reject reply API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 