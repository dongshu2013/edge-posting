import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth-helpers";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = await params;

  if (!id) {
    return NextResponse.json({ error: "Missing buzz ID" }, { status: 400 });
  }

  const authedUser = await getAuthUser();

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
                avatar: true,
                twitterUsername: true,
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
            avatar: true,
            twitterUsername: true,
            nickname: true,
            kolInfo: {
              select: {
                status: true,
              },
            },
          },
        },
      },
    });

    if (!buzz) {
      return NextResponse.json({ error: "Buzz not found" }, { status: 404 });
    }

    // If there's an authenticated user, sort their replies to the top
    if (authedUser && buzz.replies.length > 0) {
      buzz.replies.sort((a, b) => {
        if (a.createdBy === authedUser.uid && b.createdBy !== authedUser.uid) {
          return -1;
        }
        if (a.createdBy !== authedUser.uid && b.createdBy === authedUser.uid) {
          return 1;
        }
        // If both are from the same user (or neither is from the auth user), maintain the date sort
        return 0;
      });
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
