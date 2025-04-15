import { getPublicClient } from "@/lib/ethereum";
import { IBadge } from "@/types/common";
import { erc20Abi } from "viem";
import { Buzz, Kol, Prisma, User } from "@prisma/client";
import { formatEther } from "viem";

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const validateEmail = (email: string) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export function getShortAddress(
  address: string | null | undefined,
  displayLength: number
) {
  try {
    if (!address) {
      return address;
    }
    if (displayLength < 0 || displayLength * 2 >= address.length) {
      return address;
    }

    let sFrontPart = address.substr(0, displayLength);
    let sTailPart = address.substr(
      address.length - displayLength,
      address.length
    );

    return sFrontPart + "..." + sTailPart;
  } catch (err) {}

  return "";
}

export function parseJson<T>(jsonStr: string): T | null {
  try {
    return JSON.parse(jsonStr) as T;
  } catch (err) {
    return null;
  }
}

export async function getUserIdInt(userId: string): Promise<bigint> {
  const hash = await getSha256Hash(userId);
  return BigInt(`0x${hash}`);
}

/**
 * Generate a SHA-256 hash of a string value
 * @param value The string to hash
 * @returns The SHA-256 hash as a hexadecimal string
 */
export async function getSha256Hash(value: string): Promise<string> {
  // Convert the string to a Uint8Array
  const encoder = new TextEncoder();
  const data = encoder.encode(value);

  // Generate the hash using the Web Crypto API
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);

  // Convert the ArrayBuffer to a hex string
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return hashHex;
}

export function getDisplayArea(area: number) {
  if (area === 1) {
    return "America/Europe";
  }
  if (area === 2) {
    return "Korea";
  }
  if (area === 3) {
    return "China";
  }
  if (area === 4) {
    return "Japan";
  }
  if (area === 5) {
    return "South Asia";
  }
  return "Unknown";
}

export function getBadgeIcon(badge: IBadge) {
  if (badge.type === "kol") {
    return "/images/badge/badge_kol.jpg";
  }
  if (badge.type === "task_published") {
    return "/images/badge/badge_task_published.jpg";
  }
  if (badge.type === "task_done") {
    return "/images/badge/badge_task_done.jpg";
  }
  return "/images/badge/badge_default.jpg";
}

export const getUserFormatBalance = async (buzz: Buzz, dbUser: User) => {
  const publicClient = getPublicClient(
    Number(process.env.NEXT_PUBLIC_ETHEREUM_CHAIN_ID)
  );
  if (!publicClient) {
    throw new Error("Public client not found");
  }

  if (buzz.paymentToken === "BNB") {
    const userBalance = await publicClient.getBalance({
      address: dbUser.bindedWallet as `0x${string}`,
    });
    return Number(formatEther(userBalance));
  } else {
    const userBalance = await publicClient.readContract({
      address: buzz.customTokenAddress as `0x${string}`,
      abi: erc20Abi,
      functionName: "balanceOf",
      args: [dbUser.bindedWallet as `0x${string}`],
    });
    return Number(formatEther(userBalance));
  }
};

export async function getUserRole(
  user: Prisma.UserGetPayload<{
    include: { kolInfo: true };
  }>,
  buzz: Buzz
): Promise<"kol" | "holder" | "normal" | null> {
  let userRole: "kol" | "holder" | "normal" | null = null;
  const isKol = user.kolInfo?.status === "confirmed";
  const userBalance = await getUserFormatBalance(buzz, user);
  const isHolder = userBalance > 0;

  // Check shares of buzz
  if (
    buzz.shareOfKols > 0 &&
    buzz.shareOfHolders > 0 &&
    buzz.shareOfOthers > 0
  ) {
    if (isKol) {
      userRole = "kol";
    } else if (isHolder) {
      userRole = "holder";
    } else {
      userRole = "normal";
    }
  } else if (
    buzz.shareOfKols > 0 &&
    buzz.shareOfHolders === 0 &&
    buzz.shareOfOthers > 0
  ) {
    if (isKol) {
      userRole = "kol";
    } else if (isHolder) {
      userRole = "normal";
    } else {
      userRole = "normal";
    }
  } else if (
    buzz.shareOfKols === 0 &&
    buzz.shareOfHolders > 0 &&
    buzz.shareOfOthers > 0
  ) {
    if (isHolder) {
      userRole = "holder";
    } else {
      userRole = "normal";
    }
  } else if (
    buzz.shareOfKols > 0 &&
    buzz.shareOfHolders > 0 &&
    buzz.shareOfOthers === 0
  ) {
    if (isKol) {
      userRole = "kol";
    } else if (isHolder) {
      userRole = "holder";
    } else {
      userRole = null;
    }
  } else if (
    buzz.shareOfKols === 0 &&
    buzz.shareOfHolders === 0 &&
    buzz.shareOfOthers > 0
  ) {
    userRole = "normal";
  } else if (
    buzz.shareOfKols === 0 &&
    buzz.shareOfHolders > 0 &&
    buzz.shareOfOthers === 0
  ) {
    if (isKol) {
      userRole = null;
    } else if (isHolder) {
      userRole = "holder";
    } else {
      userRole = null;
    }
  } else if (
    buzz.shareOfKols > 0 &&
    buzz.shareOfHolders === 0 &&
    buzz.shareOfOthers === 0
  ) {
    if (isKol) {
      userRole = "kol";
    } else {
      userRole = null;
    }
  }

  return userRole;
}
