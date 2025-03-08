import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { address } = await request.json();

    const user = await prisma.user.upsert({
      where: { address },
      update: {},
      create: {
        address,
        username: `User_${address.slice(0, 6)}`,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${address}`,
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
