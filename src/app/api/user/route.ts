import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { uid, email, username, nickname, avatar } = await request.json();

    if (!uid) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.upsert({
      where: { uid },
      update: {
        email,
        avatar:
          avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${uid}`,
      },
      create: {
        uid,
        email,
        username,
        nickname: nickname || username,
        avatar:
          avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${uid}`,
        totalEarned: 0,
        balance: 0,
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to create/update user" },
      { status: 500 }
    );
  }
}
