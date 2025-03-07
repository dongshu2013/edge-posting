import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { buzzId, replyLink, replier } = body;

    if (!buzzId || !replyLink || !replier) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate the reply link format (basic check)
    if (!replyLink.match(/^https?:\/\/(twitter\.com|x\.com)\/.+\/status\/.+$/)) {
      return NextResponse.json(
        { error: 'Invalid reply link format' },
        { status: 400 }
      );
    }

    // Get the buzz to check if it exists and is active
    const buzz = await prisma.buzz.findUnique({
      where: { id: buzzId },
      select: {
        id: true,
        isActive: true,
        deadline: true,
        totalReplies: true,
        replyCount: true,
        credit: true,
        createdBy: true,
        isSettled: true,
      },
    });

    if (!buzz) {
      return NextResponse.json(
        { error: 'Buzz not found' },
        { status: 404 }
      );
    }

    // Check if the buzz is still active
    const isExpired = !buzz.isActive || new Date() >= buzz.deadline;

    // Check if the buzz has reached its reply limit
    if (!isExpired && buzz.replyCount >= buzz.totalReplies) {
      return NextResponse.json(
        { error: 'This buzz has reached its maximum number of replies' },
        { status: 400 }
      );
    }

    // Check if the buzz is already settled
    if (buzz.isSettled) {
      return NextResponse.json(
        { error: 'This buzz has already been settled' },
        { status: 400 }
      );
    }

    // Check if the user has already replied to this buzz
    const existingReply = await prisma.reply.findFirst({
      where: {
        buzzId,
        createdBy: replier,
      },
    });

    if (existingReply) {
      return NextResponse.json(
        { error: 'You have already replied to this buzz' },
        { status: 400 }
      );
    }

    // Create the reply with PENDING status
    const reply = await prisma.reply.create({
      data: {
        replyLink,
        createdBy: replier,
        status: 'PENDING',
        buzz: {
          connect: { id: buzzId },
        },
      },
    });

    // Increment the reply count
    await prisma.buzz.update({
      where: { id: buzzId },
      data: {
        replyCount: {
          increment: 1,
        },
      },
    });

    return NextResponse.json(reply);
  } catch (error) {
    console.error('Error in reply API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 