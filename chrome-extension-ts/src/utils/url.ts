export function isTwitterProfileUrl(url: string): boolean {
  // Match twitter.com/username or x.com/username but not subpages
  // Also allow www subdomain
  return /^https?:\/\/((?:www\.)?twitter\.com|(?:www\.)?x\.com)\/[^/]+$/.test(
    url
  );
}
