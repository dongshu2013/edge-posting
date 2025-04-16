export interface ITokenMetadata {
  name?: string;
  symbol?: string;
  decimals: number;
}

export interface IBadge {
  type: "kol" | "task_published" | "task_done";
}

export interface DexScreenerTokenInfo {
  priceUsd: number;
  url: string;
  baseToken: {
    address: string;
    name: string;
    symbol: string;
  };
  info?: {
    imageUrl: string;
  };
}
