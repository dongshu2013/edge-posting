export interface ITokenMetadata {
  name?: string;
  symbol?: string;
  decimals: number;
}

export interface IBadge {
  type: "kol" | "task_published" | "task_done";
}
