import { getAuthUser } from "@/lib/auth-helpers";
import { kolList } from "@/lib/kol-list";
import { prisma } from "@/lib/prisma";
import { sleep } from "@/utils/commonUtils";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    processKolList(kolList);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to init kol" },
      { status: 500 }
    );
  }
}

const processKolList = async (kolList: any[]) => {
  const testKols = kolList.slice(0, 10000);

  for (const kol of testKols) {
    console.log(`Processing ${JSON.stringify(kol)}`);
    try {
      const infoResponse = await fetch(
        `https://api.tweetscout.io/v2/info/${kol.twitterUsername}`,
        {
          headers: {
            Accept: "application/json",
            ApiKey: `${process.env.TWEETSCOUT_API_KEY}`,
          },
        }
      );
      const tweetscoutInfo = await infoResponse.json();

      const scoreResponse = await fetch(
        `https://api.tweetscout.io/v2/score/${kol.twitterUsername}`,
        {
          headers: {
            Accept: "application/json",
            ApiKey: `${process.env.TWEETSCOUT_API_KEY}`,
          },
        }
      );
      const scoreData = await scoreResponse.json();

      await prisma.kol.create({
        data: {
          twitterUsername: kol.twitterUsername,
          area: kol.area,
          avatar: tweetscoutInfo.avatar,
          nickname: tweetscoutInfo.name || tweetscoutInfo.screen_name,
          followers: tweetscoutInfo.followers_count,
          description: tweetscoutInfo.description || "",
          score: scoreData?.score || 1,
          status: "confirmed",
        },
      });
    } catch (err: any) {
      console.log(`Error processing ${JSON.stringify(kol)}`, err);
    }

    await sleep(2000);
  }
};
