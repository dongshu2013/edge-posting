import { createPrivateKey } from "crypto";
import dayjs from "dayjs";
import { jwtVerify, SignJWT } from "jose";

export interface JWTSub {
  userId: string;
  userKey: string;
}

export const getJWT = async (user: JWTSub) => {
  const pemKey = process.env.JWT_PRIVATE_KEY || "";
  const key = createPrivateKey(pemKey);

  const jwtSub = {
    userId: user.userId,
    userKey: user.userKey,
  };

  const jwt = await new SignJWT({
    sub: JSON.stringify(jwtSub),
    iat: dayjs().unix(),
  })
    .setProtectedHeader({ alg: "EdDSA", typ: "JWT" })
    .setExpirationTime("7d")
    .sign(key);

  return jwt;
};

export const verifyJWT = async (jwt: string): Promise<JWTSub | undefined> => {
  try {
    const pemKey = process.env.JWT_PRIVATE_KEY || "";
    const key = createPrivateKey(pemKey);

    const verifyResult = await jwtVerify(jwt, key).catch((err: Error) => {
      console.error("JWT verification failed:", err);
      return undefined;
    });

    const jwtSub = JSON.parse(verifyResult?.payload?.sub || "");
    return jwtSub;
  } catch (error) {
    console.error("Error verifying JWT:", error);
    return undefined;
  }
};
