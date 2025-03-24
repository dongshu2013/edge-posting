import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth-helpers";
import { getPublicClient } from "@/lib/ethereum";
import { parseSiweMessage } from "viem/siwe";

export async function POST(
  request: NextRequest,
  { params }: { params: { uid: string } }
) {
  try {
    const userData = await getAuthUser();
    if (!userData) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { uid } = await params;
    // Only allow users to update their own profile
    if (userData?.uid !== uid) {
      console.error("User ID mismatch:", userData?.uid, "vs", uid);
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { siweMessage, siweSignature } = body;

    if (!siweSignature || !siweMessage) {
      return NextResponse.json(
        { error: "Siwe signature and message are required" },
        { status: 400 }
      );
    }

    const fields = parseSiweMessage(siweMessage || "");
    const evmAddress = fields.address?.toLowerCase();
    if (!evmAddress) {
      return NextResponse.json(
        { error: "Invalid Siwe message" },
        { status: 400 }
      );
    }

    // Check Siwe signature
    const publicClient = getPublicClient(
      Number(process.env.NEXT_PUBLIC_ETHEREUM_CHAIN_ID)
    );
    if (!publicClient) {
      return NextResponse.json(
        { error: "Failed to get public client" },
        { status: 500 }
      );
    }

    const verifySiwe = await publicClient
      .verifySiweMessage({
        message: siweMessage,
        signature: siweSignature as `0x${string}`,
      })
      .catch((err) => {});

    if (!verifySiwe) {
      return NextResponse.json(
        { error: "Invalid Siwe signature" },
        { status: 400 }
      );
    }

    // Prepare update data
    const updateData: { bindedWallet?: string } = {};
    if (evmAddress !== undefined) updateData.bindedWallet = evmAddress;
    console.log("Updating profile for user:", uid, "with data:", updateData);

    // Update user profile
    const updatedUser = await prisma.user.update({
      where: { uid: userData.uid },
      data: updateData,
    });
    console.log("Profile updated successfully:", updatedUser);
    return NextResponse.json(updatedUser);
  } catch (error: any) {
    console.error("Error updating profile:", error);
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Wallet already bound" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
