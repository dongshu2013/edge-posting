import {
  Chain,
  createPublicClient,
  http,
  PublicClient
} from "viem";
import { base, baseSepolia, bsc, bscTestnet } from "viem/chains";

export const ethereumConfigs: {
  [key: number]: {
    chain: Chain;
  };
} = {
  84532: {
    chain: baseSepolia,
  },
  8453: {
    chain: base,
  },
  97: {
    chain: bscTestnet,
  },
  56: {
    chain: bsc,
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
