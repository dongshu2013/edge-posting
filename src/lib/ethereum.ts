import { Chain, createPublicClient, http, PublicClient } from "viem";
import { base, baseSepolia, bsc, bscTestnet } from "viem/chains";

export const ethereumConfigs: {
  [key: number]: {
    chain: Chain;
    rpcUrl: string;
  };
} = {
  97: {
    chain: bscTestnet,
    rpcUrl: `https://bnb-testnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`,
  },
  56: {
    chain: bsc,
    rpcUrl: `https://bnb-mainnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`,
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
    transport: http(ethereumConfig.rpcUrl),
  });

  publicClientCache[chainId] = publicClient;
  return publicClient;
}
