import * as math from "mathjs";

export function formatChainAmount(
  value: number | bigint | string,
  decimals: number
) {
  return math.bignumber(value).div(math.bignumber(10).pow(decimals)).toString();
}

export function formatFollowers(followers: number) {
  if (followers >= 1000000) {
    return (followers / 1000000).toFixed(1) + "M";
  } else if (followers >= 1000) {
    return (followers / 1000).toFixed(1) + "K";
  }
  return followers;
}
