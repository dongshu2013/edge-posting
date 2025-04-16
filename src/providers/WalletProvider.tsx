"use client";

import { RainbowKitProvider, getDefaultConfig } from "@rainbow-me/rainbowkit";
import "@rainbow-me/rainbowkit/styles.css";
import { WagmiProvider } from "wagmi";
import { sepolia } from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode, useState } from "react";
import { ethereumConfigs } from "@/lib/ethereum";

// Configure chains & providers
// In a production environment, you should get a project ID from WalletConnect Cloud
// https://cloud.walletconnect.com/sign-in
// WalletConnect project IDs are 32-character hexadecimal strings
const projectId =
  process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ||
  "3a8170812b534d0ff9d794f19a901d64";

// Create a singleton instance of the config
let configInstance: ReturnType<typeof getDefaultConfig> | null = null;

const getConfig = () => {
  if (!configInstance) {
    configInstance = getDefaultConfig({
      appName: "Edge Posting App",
      projectId,
      chains: [
        ethereumConfigs[Number(process.env.NEXT_PUBLIC_ETHEREUM_CHAIN_ID)]?.chain ||
          sepolia,
      ],
      ssr: false, // Disable SSR to prevent double initialization
    });
  }
  return configInstance;
};

interface WalletProviderProps {
  children: ReactNode;
}

export function WalletProvider({ children }: WalletProviderProps) {
  // Create a new QueryClient for each request
  const [queryClient] = useState(() => new QueryClient());

  return (
    <WagmiProvider config={getConfig()}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>{children}</RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
