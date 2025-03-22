import * as crypto from "crypto";
import { keccak256, Hex } from 'viem';

function pemToEthAddress(pemPublicKey: string): string {
  // Create a public key object from PEM
  const publicKeyDer = crypto.createPublicKey(pemPublicKey)
    .export({format: "der", type: "spki"});
  
  // Extract the X and Y coordinates (last 64 bytes)
  const rawXY = publicKeyDer.subarray(-64);
  
  // Calculate Keccak-256 hash
  const hashXY = keccak256(`0x${rawXY.toString('hex')}` as Hex);
  
  // Take last 20 bytes (40 characters) to get the Ethereum address
  const address = `0x${hashXY.slice(-40)}`;
  
  return address.toLowerCase();
}

// Replace this with your PEM public key
const pemPublicKey = process.argv[2] || `-----BEGIN PUBLIC KEY-----
MFYwEAYHKoZIzj0CAQYFK4EEAAoDQgAEFZXzXPH7gHmkxX8HWZyF1QiDpKpyxxP4
Vg2IYh/TqH8qHDxW0LL9zvY1SYZsn/lVUoIXGwJuTxJ2TjQnW3F4Yw==
-----END PUBLIC KEY-----`;

try {
  const ethAddress = pemToEthAddress(pemPublicKey);
  console.log('Ethereum Address:', ethAddress);
} catch (error) {
  console.error('Error:', error.message);
}
