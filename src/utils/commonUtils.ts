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
