import { getSha256Hash } from './commonUtils';

/**
 * Example function to get the SHA-256 hash of a userId
 * @param userId The user ID to hash
 * @returns The SHA-256 hash as a hexadecimal string
 */
export async function getUserIdHash(userId: string): Promise<string> {
  return await getSha256Hash(userId);
}

// Example usage
async function exampleUsage() {
  const userId = 'user123';
  const hashedUserId = await getUserIdHash(userId);
  console.log(`Original userId: ${userId}`);
  console.log(`SHA-256 hashed userId: ${hashedUserId}`);
  return hashedUserId;
}

// You can call this function to test it
// exampleUsage().then(hash => console.log('Hash returned:', hash)); 