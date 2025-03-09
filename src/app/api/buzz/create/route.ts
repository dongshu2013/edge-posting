import { getAuthUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      tweetLink,
      instructions,
      price,
      deadline,
      numberOfReplies = 100,
    } = body;

    // 验证必填字段
    if (!tweetLink || !instructions || !price || !deadline) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // 计算所需总金额
    const totalAmount = parseFloat(price) * numberOfReplies;

    // 检查用户余额
    const userBalance = await prisma.user.findUnique({
      where: { uid: user.uid },
      select: { balance: true },
    });

    if (!userBalance || userBalance.balance < totalAmount) {
      return NextResponse.json(
        { error: "Insufficient balance" },
        { status: 400 }
      );
    }

    // 创建 buzz、扣除余额并创建交易记录
    const result = await prisma.$transaction(async (tx) => {
      // 扣除用户余额
      await tx.user.update({
        where: { uid: user.uid },
        data: { balance: { decrement: totalAmount } },
      });

      // 创建 buzz
      const buzz = await tx.buzz.create({
        data: {
          tweetLink,
          instructions,
          price: parseFloat(price),
          createdBy: user.uid,
          deadline: new Date(deadline),
          totalReplies: numberOfReplies,
        },
      });

      // 创建交易记录
      const transaction = await tx.transaction.create({
        data: {
          amount: totalAmount,
          type: "BURN",
          status: "COMPLETED",
          fromAddress: user.uid,
          toAddress: "SYSTEM",
          buzzId: buzz.id,
          settledAt: new Date(),
        },
      });

      return { buzz, transaction };
    });

    return NextResponse.json(result.buzz);
  } catch (error) {
    console.error("Failed to create buzz:", error);
    return NextResponse.json(
      { error: "Failed to create buzz" },
      { status: 500 }
    );
  }
}
