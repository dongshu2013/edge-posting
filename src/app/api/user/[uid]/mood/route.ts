import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth-helpers";

export async function POST(
  request: Request,
  { params }: { params: { uid: string } }
) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (authUser.uid !== (await params.uid)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { mood } = await request.json();
    if (!mood || typeof mood !== "string") {
      return NextResponse.json({ error: "Invalid mood" }, { status: 400 });
    }

    const user = await prisma.user.update({
      where: { uid: params.uid },
      data: { mood },
    });

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Error updating user mood:", error);
    return NextResponse.json(
      { error: "Failed to update mood" },
      { status: 500 }
    );
  }
}
