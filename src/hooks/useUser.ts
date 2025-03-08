import { useAccount, useSignMessage } from "wagmi";
import { useEffect, useState, useCallback } from "react";
import { SiweMessage } from "siwe";

export function useUser() {
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const [loading, setLoading] = useState(false);

  const signIn = useCallback(async () => {
    try {
      setLoading(true);

      const nonceRes = await fetch("/api/auth/nonce");
      const nonce = await nonceRes.text();

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
      const verifyRes = await fetch("/api/auth/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message, signature }),
      });

      if (!verifyRes.ok) throw new Error("Failed to verify signature");

      await fetch("/api/user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
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
