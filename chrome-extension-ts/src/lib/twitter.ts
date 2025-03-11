/**
 * Twitter-specific utilities
 */

/**
 * Check if a URL is likely a Twitter reply
 */
export function isReplyUrl(url: string): boolean {
  return !!url && 
         (url.includes('twitter.com/') || url.includes('x.com/')) && 
         url.includes('/status/');
}

/**
 * Extract tweet ID from a Twitter URL
 */
export function extractTweetId(url: string): string | null {
  if (!url) return null;
  
  const match = url.match(/\/status(?:es)?\/(\d+)/i);
  return match && match[1] ? match[1] : null;
}

/**
 * Format a tweet link as a reply URL with text
 */
export function formatReplyUrl(tweetLink: string, replyText: string): string {
  if (!tweetLink) return '';
  
  const tweetId = extractTweetId(tweetLink);
  if (!tweetId) return tweetLink;
  
  const encodedReplyText = encodeURIComponent(replyText || '');
  return `https://twitter.com/intent/tweet?in_reply_to=${tweetId}&text=${encodedReplyText}`;
}

/**
 * Simplify HTML for AI analysis
 */
export function simplifyHTML(html: string): string {
  // Remove scripts, styles, and unnecessary attributes to reduce token count
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/ (onclick|onload|onunload|onchange|onsubmit|ondblclick|onmouseover|onmouseout|onkeydown|onkeypress)="[^"]*"/gi, '')
    .replace(/ class="[^"]*"/gi, ' class="x"') // Simplify class names but keep the attribute
    .replace(/ id="[^"]*"/gi, ' id="x"') // Simplify id names but keep the attribute
    .replace(/ data-[^=]*="[^"]*"/gi, '');
}

/**
 * Generate a reply text based on instructions
 */
export function generateReplyText(instructions: string | null): string {
  if (!instructions) {
    return 'Great post! 👍';
  }
  
  // Extract key points from instructions
  const lines = instructions.split('\n');
  let replyText = '';
  
  // Look for specific instructions
  const includeEmoji = instructions.toLowerCase().includes('emoji');
  const bePositive = instructions.toLowerCase().includes('positive') || 
                     instructions.toLowerCase().includes('enthusiastic');
  const askQuestion = instructions.toLowerCase().includes('question');
  
  // Build a reply based on the instructions
  if (lines.length > 0) {
    // Use the first line as a basis
    replyText = lines[0].replace(/^(please|make sure to|you should|reply with)/i, '').trim();
    
    // Keep it short
    if (replyText.length > 100) {
      replyText = replyText.substring(0, 100) + '...';
    }
  } else {
    replyText = 'This is a great point!';
  }
  
  // Add a question if needed
  if (askQuestion && !replyText.includes('?')) {
    replyText += ' What do you think about this?';
  }
  
  // Add enthusiasm if needed
  if (bePositive && !replyText.includes('!')) {
    replyText += '!';
  }
  
  // Add emoji if needed
  if (includeEmoji) {
    const emojis = ['👍', '🙌', '💯', '🔥', '👏', '😊', '✨', '💪', '🚀'];
    const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
    replyText += ' ' + randomEmoji;
  }
  
  return replyText;
}

/**
 * Simulate a realistic click on an element
 */
export function simulateRealClick(element: HTMLElement): void {
  if (!element) return;
  
  // First try to scroll the element into view
  try {
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
  } catch (e) {
    console.error('Error scrolling to element:', e);
  }
  
  // Wait a moment for the scroll to complete
  setTimeout(() => {
    // Create and dispatch mouse events for a more realistic click
    try {
      // Mouse over
      const mouseoverEvent = new MouseEvent('mouseover', {
        bubbles: true,
        cancelable: true,
        view: window
      });
      element.dispatchEvent(mouseoverEvent);
      
      // Mouse down
      const mousedownEvent = new MouseEvent('mousedown', {
        bubbles: true,
        cancelable: true,
        view: window
      });
      element.dispatchEvent(mousedownEvent);
      
      // Mouse up
      const mouseupEvent = new MouseEvent('mouseup', {
        bubbles: true,
        cancelable: true,
        view: window
      });
      element.dispatchEvent(mouseupEvent);
      
      // Click
      const clickEvent = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        view: window
      });
      element.dispatchEvent(clickEvent);
      
      console.log('Simulated real click on element:', element);
    } catch (e) {
      console.error('Error simulating click:', e);
      // Fall back to simple click
      element.click();
    }
  }, 100);
} 