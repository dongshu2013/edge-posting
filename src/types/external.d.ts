declare module 'asn1.js' {
  import BN from 'bn.js';
  
  interface ASN1Options {
    seq(): ASN1Options;
    obj(...args: any[]): void;
    key(name: string): ASN1Options;
    int(): void;
  }

  export function define(name: string, fn: (this: ASN1Options) => void): {
    decode(buffer: Buffer, format: string): { r: BN; s: BN };
  };
}

// declare module "fast-crc32c" {
//   export function calculate(input: string | Buffer): number;
//   export const hardware: boolean;
//   export const table: number[];
// }
