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
