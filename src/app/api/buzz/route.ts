import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const createdBy = searchParams.get('createdBy');
    const cursor = searchParams.get('cursor');
    const limit = 10; // Number of items per page

    // Build the query
    const query = {
      where: {
        ...(createdBy && { createdBy }),
      },
      take: limit + 1, // Take one extra to know if there are more items
      orderBy: {
        createdAt: 'desc' as const,
      },
      select: {
        id: true,
        tweetLink: true,
        instructions: true,
        context: true,
        credit: true,
        createdAt: true,
        createdBy: true,
        deadline: true,
        replyCount: true,
        totalReplies: true,
        isActive: true,
      },
      ...(cursor && {
        cursor: {
          id: cursor,
        },
        skip: 1, // Skip the cursor
      }),
    };

    const buzzes = await prisma.buzz.findMany(query);

    // Check if there are more items
    const hasMore = buzzes.length > limit;
    const items = hasMore ? buzzes.slice(0, -1) : buzzes;
    const nextCursor = hasMore ? items[items.length - 1].id : undefined;

    return NextResponse.json({
      items,
      nextCursor,
      hasMore,
    });
  } catch (error) {
    console.error('Failed to fetch buzzes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch buzzes' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { tweetLink, instructions, context, credit, createdBy, deadline } = body;

    // Validate required fields
    if (!tweetLink || !instructions || !context || !credit || !createdBy || !deadline) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create new buzz
    const buzz = await prisma.buzz.create({
      data: {
        tweetLink,
        instructions,
        context,
        credit: parseFloat(credit),
        createdBy,
        deadline: new Date(deadline),
        totalReplies: body.numberOfReplies || 100, // Default to 100 if not specified
      },
    });

    return NextResponse.json(buzz);
  } catch (error) {
    console.error('Failed to create buzz:', error);
    return NextResponse.json(
      { error: 'Failed to create buzz' },
      { status: 500 }
    );
  }
} 