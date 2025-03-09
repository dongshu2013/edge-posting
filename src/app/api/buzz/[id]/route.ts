import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = await params;

  if (!id) {
    return NextResponse.json({ error: "Missing buzz ID" }, { status: 400 });
  }

  try {
    const buzz = await prisma.buzz.findUnique({
      where: { id },
      include: {
        replies: {
          select: {
            id: true,
            replyLink: true,
            text: true,
            createdBy: true,
            buzzId: true,
            status: true,
            createdAt: true,
            user: {
              select: {
                username: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
        user: {
          select: {
            username: true,
          },
        },
      },
    });

    if (!buzz) {
      return NextResponse.json({ error: "Buzz not found" }, { status: 404 });
    }

    return NextResponse.json(buzz);
  } catch (error) {
    console.error("Error fetching buzz:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
