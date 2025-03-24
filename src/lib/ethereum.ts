import {
  Chain,
  createPublicClient,
  createWalletClient,
  erc20Abi,
  http,
  PublicClient,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { base, baseSepolia, bscTestnet } from "viem/chains";

export const ethereumConfigs: {
  [key: number]: {
    chain: Chain;
    tokenAddress: `0x${string}`;
    tokenDecimals: number;
  };
} = {
  84532: {
    chain: baseSepolia,
    tokenAddress: "0x3869E143da147C391258950978B16266e1711a5D",
    tokenDecimals: 6,
  },
  8453: {
    chain: base,
    tokenAddress: "0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2",
    tokenDecimals: 6,
  },
  97: {
    chain: bscTestnet,
    tokenAddress: "0x3869E143da147C391258950978B16266e1711a5D",
    tokenDecimals: 6,
  },
};

const publicClientCache: Record<number, PublicClient> = {};

export function getPublicClient(chainId: number) {
  if (publicClientCache[chainId]) {
    return publicClientCache[chainId];
  }

  const ethereumConfig = ethereumConfigs[chainId];
  if (!ethereumConfig) {
    return undefined;
  }

  const publicClient = createPublicClient({
    chain: ethereumConfig.chain,
    transport: http(),
  });

  publicClientCache[chainId] = publicClient;
  return publicClient;
}
