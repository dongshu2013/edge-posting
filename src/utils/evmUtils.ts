import {
  PublicClient,
  checksumAddress,
  encodeAbiParameters,
  zeroAddress,
  keccak256,
  erc20Abi,
} from "viem";
import { createSiweMessage, generateSiweNonce } from "viem/siwe";
import { Config } from "wagmi";
import { SignMessageMutateAsync, WriteContractMutateAsync } from "wagmi/query";
import { getUserIdInt, sleep } from "./commonUtils";
import { getPublicClient } from "@/lib/ethereum";
import { WithdrawSignatureResult } from "@/types/user";
import { ITokenMetadata } from "@/types/common";
import { contractAbi } from "@/config/contractAbi";
import { signMessage, toEthSignedMessageHash } from "@/lib/server/kms";
import { utils } from "ethers";

export function getSiweMessage(address: `0x${string}`, chainId?: number) {
  var current = new Date();

  return createSiweMessage({
    address: address,
    chainId: chainId || 1,
    domain: window.location.host,
    nonce: generateSiweNonce(),
    uri: window.location.href,
    version: "1",
    // expire after 3 days
    expirationTime: new Date(current.getTime() + 86400000 * 3),
  });
}

export async function fetchTransactionReceipt(
  publicClient: PublicClient | undefined,
  hash: `0x${string}`
) {
  if (!hash || !publicClient) {
    return undefined;
  }
  for (let i = 0; i < 10; i++) {
    let transactionReceipt;
    try {
      transactionReceipt = await publicClient.waitForTransactionReceipt({
        hash,
      });
    } catch {}

    if (transactionReceipt) {
      return transactionReceipt;
    } else {
      await sleep(6000);
    }
  }

  return undefined;
}

export function isEvmZeroAddress(address: `0x${string}`) {
  return checksumAddress(address) === checksumAddress(zeroAddress);
}

export function isEvmAddressEqual(
  address1: `0x${string}`,
  address2: `0x${string}`
) {
  try {
    return checksumAddress(address1) === checksumAddress(address2);
  } catch {}
  return false;
}

export async function signEvmMessage(
  isOkx: boolean,
  signMessageAsync: SignMessageMutateAsync | undefined,
  message: string,
  userAddress: string | undefined
): Promise<[`0x${string}` | undefined, string]> {
  let signature: `0x${string}` | undefined = undefined;
  let errorMessage = "";
  // const hash = hashMessage(message);

  signature =
    (await signMessageAsync?.({
      message: message,
    }).catch((err: any) => {
      console.log({ err });
      errorMessage = err.message;
    })) || undefined;

  return [signature, errorMessage];
}

export async function sendEvmTransaction(
  isOkx: boolean,
  userAddress: string | undefined,
  writeContractAsync: WriteContractMutateAsync<Config, unknown>,
  config: {
    abi: any;
    address: `0x${string}`;
    functionName: string;
    args: any[];
    value?: bigint;
    maxFeePerGas?: bigint;
  }
): Promise<[`0x${string}` | undefined, string]> {
  let hash: `0x${string}` | undefined = undefined;
  let errorMessage = "";

  hash =
    (await writeContractAsync({
      abi: config.abi,
      address: config.address,
      functionName: config.functionName,
      args: config.args,
      ...(config.value ? { value: config.value } : {}),
      value: config.value,
      // maxFeePerGas: maxFeePerGas,
    }).catch((err: any) => {
      errorMessage = err.message;
    })) || undefined;

  return [hash, errorMessage];
}

export async function getWithdrawSignature(
  userId: string,
  recipient: `0x${string}`,
  nonceOnChain: bigint,
  tokenAddresses: `0x${string}`[],
  tokenAmountsOnChain: bigint[]
): Promise<WithdrawSignatureResult | undefined> {
  const publicClient = getPublicClient(
    Number(process.env.NEXT_PUBLIC_ETHEREUM_CHAIN_ID)
  );
  if (!publicClient) {
    return undefined;
  }

  const currentBlock = await publicClient.getBlock();
  const expirationBlock = currentBlock.number + BigInt(1000000);

  // const message = `Withdrawal request for ${nonceOnChain}`;
  const message = await solidityKeccak256Encode(
    tokenAddresses,
    tokenAmountsOnChain,
    recipient,
    nonceOnChain,
    expirationBlock
  );
  // const signature = await toEthSignedMessageHash(message);
  const signature = await signMessage(message);

  // const signature = await signMessage({
  //   message: message,
  //   privateKey: process.env.ETHEREUM_PRIVATE_KEY as `0x${string}`,
  // });
  return {
    expirationBlock: expirationBlock.toString(),
    tokenAddresses,
    tokenAmountsOnChain: tokenAmountsOnChain.map((amount) => amount.toString()),
    recipient,
    signature,
  };
}

async function solidityKeccak256Encode(
  tokens: `0x${string}`[],
  amounts: bigint[],
  recipient: `0x${string}`,
  nonce: bigint,
  expirationBlock: bigint
) {
  // const encoded = encodeAbiParameters(
  //   [
  //     { type: "address[]" },
  //     { type: "uint256[]" },
  //     { type: "address" },
  //     { type: "uint256" },
  //     { type: "uint256" },
  //   ],
  //   [tokens, amounts, recipient, nonce, expirationBlock]
  // );
  // const hash = keccak256(encoded);
  // return hash;

  console.log("sign signature params:", {
    tokens,
    amounts,
    recipient,
    nonce,
    expirationBlock,
  });

  const hash = utils.keccak256(
    utils.defaultAbiCoder.encode(
      ["address[]", "uint256[]", "address", "uint256", "uint256"],
      [tokens, amounts, recipient, nonce, expirationBlock]
    )
  );
  const messageHash = await toEthSignedMessageHash(hash as `0x${string}`);
  return messageHash as `0x${string}`;
}

export const getTokenMetadata = async (
  tokenAddress: string
): Promise<ITokenMetadata | undefined> => {
  if (tokenAddress === zeroAddress) {
    return {
      decimals: 18,
      name: "BNB",
      symbol: "BNB",
    };
  }
  const publicClient = getPublicClient(
    Number(process.env.NEXT_PUBLIC_ETHEREUM_CHAIN_ID)
  );
  if (!publicClient) {
    return undefined;
  }
  try {
    const [decimals, name, symbol] = await Promise.all([
      publicClient.readContract({
        address: tokenAddress as `0x${string}`,
        abi: erc20Abi,
        functionName: "decimals",
      }),
      publicClient.readContract({
        address: tokenAddress as `0x${string}`,
        abi: erc20Abi,
        functionName: "name",
      }),
      publicClient.readContract({
        address: tokenAddress as `0x${string}`,
        abi: erc20Abi,
        functionName: "symbol",
      }),
    ]);

    console.log(decimals, name, symbol);
    return {
      decimals: Number(decimals),
      name: String(name),
      symbol: String(symbol),
    };
  } catch (err) {}
  return undefined;
};

export async function getUserNonce(userId: string, publicClient: PublicClient) {
  const userIdInt = await getUserIdInt(userId);

  const nonce = await publicClient.readContract({
    address: process.env.NEXT_PUBLIC_BSC_CA as `0x${string}`,
    abi: contractAbi,
    functionName: "getNonce",
    args: [userIdInt],
  });
  return nonce;
}
