import { getAuthUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userApiKey = await prisma.userApiKey.findUnique({
      where: {
        userId: user.uid,
      },
    });

    return NextResponse.json({ apiKey: userApiKey?.apiKey || null });
  } catch (error) {}
}

export async function POST(request: Request) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await prisma.userApiKey.deleteMany({
      where: {
        userId: user.uid,
      },
    });

    const userApiKey = await prisma.userApiKey.create({
      data: {
        userId: user.uid,
        apiKey: crypto.randomUUID(),
      },
    });

    if (!userApiKey) {
      return NextResponse.json(
        { error: "Failed to create api key" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: userApiKey.apiKey });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create api key" },
      { status: 500 }
    );
  }
}
