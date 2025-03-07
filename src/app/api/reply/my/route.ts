import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');

    if (!address) {
      return NextResponse.json(
        { error: 'Address is required' },
        { status: 400 }
      );
    }

    const replies = await prisma.reply.findMany({
      where: {
        createdBy: address,
      },
      include: {
        buzz: {
          select: {
            id: true,
            createdBy: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(replies);
  } catch (error) {
    console.error('Error fetching replies:', error);
    return NextResponse.json(
      { error: 'Failed to fetch replies' },
      { status: 500 }
    );
  }
} 