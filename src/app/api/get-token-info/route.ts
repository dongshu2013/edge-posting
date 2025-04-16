import { prisma } from "@/lib/prisma";
import { getDexScreenerInfo } from "@/utils/commonUtils";
import { getTokenExplorerUrl, getTokenMetadata } from "@/utils/evmUtils";
import { NextRequest } from "next/server";
import { bscTestnet } from "viem/chains";
export interface ITokenInfo {
  id: string;
  chainId: number;
  tokenAddress: string;
  symbol: string;
  decimals: number;
  price: number;
  url: string;
  logo: string;
}

export async function GET(request: NextRequest) {
  const tokenAddress = request.nextUrl.searchParams.get("tokenAddress");

  if (!tokenAddress) {
    return Response.json({
      code: 1,
      message: "Invalid request",
    });
  }

  const chainId = Number(process.env.NEXT_PUBLIC_ETHEREUM_CHAIN_ID);
  const tokenInfo = await prisma.tokenInfo.findUnique({
    where: {
      chainId_tokenAddress: {
        chainId,
        tokenAddress,
      },
    },
  });

  if (tokenInfo) {
    return Response.json({
      code: 0,
      data: { tokenInfo },
    });
  }

  const tokenMetadata = await getTokenMetadata(tokenAddress);
  if (!tokenMetadata) {
    return Response.json({
      code: -1,
      message: "Get token metadata failed",
    });
  }

  const dexScreenerInfo = await getDexScreenerInfo(tokenAddress);
  const url = dexScreenerInfo?.url || getTokenExplorerUrl(tokenAddress);
  const logo = dexScreenerInfo?.info?.imageUrl || "";
  let price = Number(dexScreenerInfo?.priceUsd || 0);

  if (
    Number(process.env.NEXT_PUBLIC_ETHEREUM_CHAIN_ID) === bscTestnet.id &&
    !price
  ) {
    price = 0.015;
  }

  const newTokenInfo = await prisma.tokenInfo
    .create({
      data: {
        chainId,
        tokenAddress,
        symbol: tokenMetadata.symbol || "Unknown",
        decimals: tokenMetadata.decimals,
        price: price,
        url: url,
        logo: logo,
      },
    })
    .catch((err: any) => {
      console.log("err", err);
    });

  if (!newTokenInfo) {
    return Response.json({
      code: -1,
      message: "Create token info failed",
    });
  }

  return Response.json({
    code: 0,
    data: { tokenInfo: newTokenInfo },
  });
}
