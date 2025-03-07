import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type Props = {
  params: { id: string };
};

export async function GET(
  request: NextRequest,
  { params }: Props
) {
  const id = params?.id;
  
  if (!id) {
    return NextResponse.json(
      { error: 'Missing buzz ID' },
      { status: 400 }
    );
  }

  try {
    const buzz = await prisma.buzz.findUnique({
      where: { id },
      include: {
        replies: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!buzz) {
      return NextResponse.json(
        { error: 'Buzz not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(buzz);
  } catch (error) {
    console.error('Error fetching buzz:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 