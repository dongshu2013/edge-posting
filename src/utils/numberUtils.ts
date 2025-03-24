import * as math from "mathjs";

export function formatChainAmount(
  value: number | bigint | string,
  decimals: number
) {
  return math.bignumber(value).div(math.bignumber(10).pow(decimals)).toString();
}
