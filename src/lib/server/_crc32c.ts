import crc32c from "@chainsafe/fast-crc32c";

let crc32: any;

// Check if hardware acceleration is available
if (
  crc32 &&
  crc32c.hardware &&
  typeof process !== "undefined" &&
  process.arch &&
  ["x64", "ia32"].includes(process.arch)
) {
  crc32 = crc32c.calculate;
} else {
  crc32 = (input: any, previousValue: any) => {
    let crc = previousValue === undefined ? 0 ^ -1 : previousValue;
    for (let i = 0; i < input.length; i++) {
      crc = (crc >>> 8) ^ crc32c.table[(crc ^ input[i]) & 0xff];
    }
    return (crc ^ -1) >>> 0;
  };
}

// Now you can use the `crc32` function
export function calculateCRC32(data: any) {
  return crc32(data);
}
