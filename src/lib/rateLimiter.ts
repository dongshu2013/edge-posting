import { RateLimiter } from "limiter";

const limiters = new Map<string, RateLimiter>();

export function getRateLimiter(
  identifier: string,
  options: {
    tokensPerInterval: number;
    interval: "day" | "hour" | "minute" | "second";
  }
) {
  if (!limiters.has(identifier)) {
    limiters.set(
      identifier,
      new RateLimiter({
        tokensPerInterval: options.tokensPerInterval,
        interval: options.interval,
      })
    );
  }
  return limiters.get(identifier)!;
}
