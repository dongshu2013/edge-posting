import { useAccount, useSignMessage } from "wagmi";
import { useEffect, useState, useCallback } from "react";
import { SiweMessage } from "siwe";
import { fetchApi } from "@/lib/api";

export function useUser() {
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const [loading, setLoading] = useState(false);

  const signIn = useCallback(async () => {
    try {
      setLoading(true);

      const nonce = await fetchApi("/api/auth/nonce");

      const message = new SiweMessage({
        domain: window.location.host,
        address,
        statement: "Sign in with Ethereum to BUZZ",
        uri: window.location.origin,
        version: "1",
        chainId: 1,
        nonce,
      });

      const signature = await signMessageAsync({
        message: message.prepareMessage(),
      });

      // 4. Verify signature and create session
      const verifyRes = await fetchApi("/api/auth/verify", {
        method: "POST",
        body: JSON.stringify({ message, signature }),
      });

      if (verifyRes.error) throw new Error("Failed to verify signature");

      await fetchApi("/api/user", {
        method: "POST",
        body: JSON.stringify({
          address,
        }),
      });
    } catch (error) {
      console.error("Error signing in:", error);
    } finally {
      setLoading(false);
    }
  }, [address, signMessageAsync]);

  useEffect(() => {
    if (isConnected && address) {
      signIn();
    }
  }, [address, isConnected, signIn]);

  return { address, isConnected, loading };
}
