import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { uid, username } = await request.json();

    const user = await prisma.user.upsert({
      where: { uid },
      update: {},
      create: {
        uid,
        username,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?`,
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
