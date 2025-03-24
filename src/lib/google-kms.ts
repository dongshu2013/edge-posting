/* eslint-disable require-jsdoc */
import * as kms from "@google-cloud/kms";
import * as asn1 from "asn1.js";
import * as crc32c from "fast-crc32c";
import * as BN from "bn.js";
import { recoverAddress, encodePacked, encodeAbiParameters, keccak256, Hex } from 'viem';

const MAX_RETRY = 3;

const client = new kms.KeyManagementServiceClient();

export interface KMS_CONFIG_TYPE {
  projectId: string,
  locationId: string,
  keyRingId: string,
  keyId: string,
  versionId?: string,
  publicAddress?: string
}

const KEY_CONFIG: KMS_CONFIG_TYPE = {
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  locationId: "global",
  keyRingId: "buzzz",
  keyId: process.env.GKMS_KEY_ID!,
  versionId: "1",
  publicAddress: process.env.GKMS_PUBLIC_ADDRESS,
};

export const toEthSignedMessageHash = function (messageHex: Hex) {
  return keccak256(
    encodePacked(["string", "bytes32"],
      ["\x19Ethereum Signed Message:\n32", messageHex]) as Hex);
};

const getVersionName = async function () {
  return client.cryptoKeyVersionPath(
    KEY_CONFIG.projectId,
    KEY_CONFIG.locationId,
    KEY_CONFIG.keyRingId,
    KEY_CONFIG.keyId,
    KEY_CONFIG.versionId!
  );
};

type ViemSignature = { r: Hex; s: Hex; v: number };

function hex(sig: ViemSignature): Hex {
  return `0x${sig.r.slice(2)}${sig.s.slice(2)}${sig.v.toString(16)}` as Hex;
}

/* eslint-disable */
const EcdsaSigAsnParse: {
  decode: (asnStringBuffer: Buffer, format: "der") => { r: BN; s: BN };
} = asn1.define("EcdsaSig", function (this: any) {
  this.seq().obj(this.key("r").int(), this.key("s").int());
});

export const signRaw = async function (
  message: Hex,
  returnHex = true
): Promise<ViemSignature | Hex> {
  const digestBuffer = Buffer.from(message.slice(2));
  const address = KEY_CONFIG.publicAddress!;

  let signature = await getKmsSignature(digestBuffer);
  let [r, s] = await calculateRS(signature as Buffer);

  let retry = 0;
  while (shouldRetrySigning(r, s, retry)) {
    signature = await getKmsSignature(digestBuffer);
    [r, s] = await calculateRS(signature as Buffer);
    retry += 1;
  }

  const v = await calculateRecoveryParam(
    digestBuffer,
    r,
    s,
    address);

  const sig = {
    r: `0x${r.toString("hex")}` as Hex,
    s: `0x${s.toString("hex")}` as Hex,
    v
  } as ViemSignature;
  return returnHex ? hex(sig) : sig;
};

const shouldRetrySigning = function (r: BN, s: BN, retry: number) {
  return (r.toString("hex").length % 2 == 1 || s.toString("hex").length % 2 == 1) && (retry < MAX_RETRY);
}

const getKmsSignature = async function (digestBuffer: Buffer) {
  const digestCrc32c = crc32c.calculate(digestBuffer);
  const versionName = await getVersionName();

  const [signResponse] = await client.asymmetricSign({
    name: versionName,
    digest: {
      sha256: digestBuffer,
    },
    digestCrc32c: {
      value: digestCrc32c,
    },
  });

  if (signResponse.name !== versionName) {
    throw new Error("AsymmetricSign: request corrupted in-transit");
  }
  if (!signResponse.verifiedDigestCrc32c) {
    throw new Error("AsymmetricSign: request corrupted in-transit");
  }
  if (!signResponse.signature || !signResponse.signatureCrc32c ||
    crc32c.calculate(Buffer.from(signResponse.signature as Uint8Array)) !==
    Number(signResponse.signatureCrc32c.value)
  ) {
    throw new Error("AsymmetricSign: response corrupted in-transit");
  }

  return Buffer.from(signResponse.signature as Uint8Array);
};

const calculateRS = async function (signature: Buffer) {
  const decoded = EcdsaSigAsnParse.decode(signature, "der");
  const { r, s } = decoded;

  const secp256k1N = new BN.BN(
    "fffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141",
    16
  );
  const secp256k1halfN = secp256k1N.div(new BN.BN(2));

  return [r, s.gt(secp256k1halfN) ? secp256k1N.sub(s) : s];
};

const calculateRecoveryParam = async (
  msg: Buffer,
  r: BN,
  s: BN,
  address: string
) => {
  let v: number;
  for (v = 0; v <= 1; v++) {
    const recoveredAddr = await recoverAddress({
      hash: `0x${msg.toString("hex")}` as Hex,
      signature: {
        r: `0x${r.toString("hex")}` as Hex,
        s: `0x${s.toString("hex")}` as Hex,
        v: BigInt(v + 27),
      }
    });

    if (recoveredAddr.toLowerCase() !== address.toLowerCase()) {
      continue;
    }

    return v + 27;
  }

  throw new Error("Failed to calculate recovery param");
};

export const sign = async (nameType: string, name: string, message: string) => {
  const toSign = keccak256(
    encodeAbiParameters(
      [{ type: "bytes32" }, { type: "bytes32" }, { type: "bytes32" }],
      [nameType as Hex, name as Hex, message as Hex]
    )
  );
  const signature = await signRaw(
    toEthSignedMessageHash(toSign)
  ) as Hex;
  return signature;
};