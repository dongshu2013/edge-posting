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

const config = getDefaultConfig({
  appName: "Edge Posting App",
  projectId,
  chains: [
    ethereumConfigs[Number(process.env.NEXT_PUBLIC_ETHEREUM_CHAIN_ID)]?.chain ||
      sepolia,
  ],
  ssr: true,
});

interface WalletProviderProps {
  children: ReactNode;
}

export function WalletProvider({ children }: WalletProviderProps) {
  // Create a new QueryClient for each request
  const [queryClient] = useState(() => new QueryClient());

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>{children}</RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
