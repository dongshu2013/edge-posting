import {
  PublicClient,
  checksumAddress,
  zeroAddress
} from "viem";
import { createSiweMessage, generateSiweNonce } from "viem/siwe";
import { Config } from "wagmi";
import { SignMessageMutateAsync, WriteContractMutateAsync } from "wagmi/query";
import { sleep } from "./commonUtils";

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
