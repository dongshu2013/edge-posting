/**
 * Extracts the tweet ID from a Twitter/X.com URL
 */
export function getTweetId(url: string): string | null {
  try {
    const tweetUrl = new URL(url);
    const pathParts = tweetUrl.pathname.split('/');
    const statusIndex = pathParts.indexOf('status');
    if (statusIndex !== -1 && pathParts[statusIndex + 1]) {
      return pathParts[statusIndex + 1];
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Generates a Twitter reply intent URL from a tweet URL
 */
export function getReplyIntentUrl(tweetUrl: string): string {
  const tweetId = getTweetId(tweetUrl);
  if (!tweetId) {
    throw new Error('Invalid tweet URL');
  }
  return `https://twitter.com/intent/tweet?in_reply_to=${tweetId}`;
} 