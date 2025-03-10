import {
  Chain,
  createPublicClient,
  createWalletClient,
  erc20Abi,
  formatUnits,
  http,
  PublicClient,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { base, baseSepolia } from "viem/chains";

const ethereumConfigs: {
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

export async function transferERC20(data: {
  chainId: number;
  recipient: string;
  amount: string;
  decimals: number;
}) {
  try {
    const ethereumConfig = ethereumConfigs[data.chainId];
    if (!ethereumConfig) {
      return undefined;
    }

    const publicClient = getPublicClient(data.chainId);
    if (!publicClient) {
      return undefined;
    }

    // console.log("settleERC20Reward", data, minAmount);
    if (!data.recipient || !data.amount) {
      // console.log("data invalid");
      return undefined;
    }

    const walletClient = createWalletClient({
      account: privateKeyToAccount(
        process.env.ETHEREUM_PRIVATE_KEY as `0x${string}`
      ),
      chain: ethereumConfig.chain,
      transport: http(),
    });

    const chainAmount = BigInt(
      Number(data.amount) * 10 ** ethereumConfig.tokenDecimals
    );
    let errorMessage = "";
    const { request: txRequest, result: txResult } = await publicClient
      .simulateContract({
        account: walletClient.account,
        address: ethereumConfig.tokenAddress as `0x${string}`,
        abi: erc20Abi,
        functionName: "transfer",
        args: [data.recipient as `0x${string}`, chainAmount],
      })
      .catch((err) => (errorMessage = err.message));

    // console.log("txRequest", txRequest);
    // console.log("txResult", txResult);
    // console.log("errorMessage", errorMessage);

    if (!txRequest || !txResult) {
      return undefined;
    }

    const txHash = await walletClient
      .writeContract(txRequest)
      .catch((err) => (errorMessage = err.message));

    // console.log("txHash", txHash);

    return txHash;
  } catch (err) {
    console.error("settleERC20Reward error:", err);
  }

  return undefined;
}
