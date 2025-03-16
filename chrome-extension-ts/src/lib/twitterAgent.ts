import { simulateRealClick } from "./twitter";

interface TwitterAgentConfig {
  aiModel?: string;
  maxRetries?: number;
  delayBetweenActions?: number;
}

interface Tweet {
  id: string;
  text: string;
  authorUsername: string;
  timestamp: string;
  likes: number;
  retweets: number;
  replies: number;
}

export class TwitterAgent {
  private config: Required<TwitterAgentConfig>;
  private retryDelay = 1000;

  constructor(config: TwitterAgentConfig = {}) {
    this.config = {
      aiModel: config.aiModel || "gpt-3.5-turbo",
      maxRetries: config.maxRetries || 3,
      delayBetweenActions: config.delayBetweenActions || 1000,
    };
  }

  /**
   * Extract all posts from the current timeline
   */
  async getTimelinePosts(): Promise<Tweet[]> {
    try {
      const tweetElements = document.querySelectorAll('[data-testid="tweet"]');
      const tweets: Tweet[] = [];

      for (const element of tweetElements) {
        const tweet = await this.extractTweetData(element);
        if (tweet) tweets.push(tweet);
      }

      return tweets;
    } catch (error) {
      console.error("Error extracting timeline posts:", error);
      return [];
    }
  }

  /**
   * Extract data from a single tweet element
   */
  private async extractTweetData(element: Element): Promise<Tweet | null> {
    try {
      const id = element.getAttribute("data-tweet-id") || "";
      const textElement = element.querySelector('[data-testid="tweetText"]');
      const text = textElement?.textContent || "";
      const authorElement = element.querySelector('[data-testid="User-Name"]');
      const authorUsername = authorElement?.textContent?.replace("@", "") || "";
      const timestamp =
        element.querySelector("time")?.getAttribute("datetime") || "";

      const stats = {
        likes: this.extractStatCount(element, "like"),
        retweets: this.extractStatCount(element, "retweet"),
        replies: this.extractStatCount(element, "reply"),
      };

      return {
        id,
        text,
        authorUsername,
        timestamp,
        ...stats,
      };
    } catch (error) {
      console.error("Error extracting tweet data:", error);
      return null;
    }
  }

  /**
   * Extract numeric stat from tweet element
   */
  private extractStatCount(
    element: Element,
    type: "like" | "retweet" | "reply"
  ): number {
    try {
      const statElement = element.querySelector(`[data-testid="${type}"]`);
      const countText = statElement?.getAttribute("aria-label");
      if (!countText) return 0;

      const match = countText.match(/\d+/);
      return match ? parseInt(match[0]) : 0;
    } catch {
      return 0;
    }
  }

  /**
   * Auto-reply to a tweet with prefilled text and submit
   */
  async autoReply(tweetId: string, replyText: string): Promise<boolean> {
    try {
      // Find and click reply button
      const replyButton = document.querySelector(
        `[data-testid="reply"][data-tweet-id="${tweetId}"]`
      );
      if (!replyButton) throw new Error("Reply button not found");

      simulateRealClick(replyButton as HTMLElement);
      await this.delay(this.config.delayBetweenActions);

      // Fill in reply text
      const replyInput = document.querySelector(
        '[data-testid="tweetTextarea_0"]'
      );
      if (!replyInput) throw new Error("Reply input not found");

      const inputEvent = new InputEvent("input", { bubbles: true });
      (replyInput as HTMLElement).textContent = replyText;
      replyInput.dispatchEvent(inputEvent);

      await this.delay(this.config.delayBetweenActions);

      // Click reply submit button
      const submitButton = document.querySelector(
        '[data-testid="tweetButton"]'
      );
      if (!submitButton) throw new Error("Submit button not found");

      simulateRealClick(submitButton as HTMLElement);
      return true;
    } catch (error) {
      console.error("Error auto-replying to tweet:", error);
      return false;
    }
  }

  /**
   * Repost a tweet with quote
   */
  async quoteRepost(tweetId: string, quoteText: string): Promise<boolean> {
    try {
      // Find and click retweet button
      const retweetButton = document.querySelector(
        `[data-testid="retweet"][data-tweet-id="${tweetId}"]`
      );
      if (!retweetButton) throw new Error("Retweet button not found");

      simulateRealClick(retweetButton as HTMLElement);
      await this.delay(this.config.delayBetweenActions);

      // Click quote tweet option
      const quoteOption = document.querySelector(
        '[data-testid="retweetConfirm"]'
      );
      if (!quoteOption) throw new Error("Quote option not found");

      simulateRealClick(quoteOption as HTMLElement);
      await this.delay(this.config.delayBetweenActions);

      // Fill in quote text
      const quoteInput = document.querySelector(
        '[data-testid="tweetTextarea_0"]'
      );
      if (!quoteInput) throw new Error("Quote input not found");

      const inputEvent = new InputEvent("input", { bubbles: true });
      (quoteInput as HTMLElement).textContent = quoteText;
      quoteInput.dispatchEvent(inputEvent);

      await this.delay(this.config.delayBetweenActions);

      // Click tweet button
      const tweetButton = document.querySelector('[data-testid="tweetButton"]');
      if (!tweetButton) throw new Error("Tweet button not found");

      simulateRealClick(tweetButton as HTMLElement);
      return true;
    } catch (error) {
      console.error("Error quote retweeting:", error);
      return false;
    }
  }

  /**
   * Like a tweet
   */
  async likeTweet(tweetId: string): Promise<boolean> {
    try {
      const likeButton = document.querySelector(
        `[data-testid="like"][data-tweet-id="${tweetId}"]`
      );
      if (!likeButton) throw new Error("Like button not found");

      simulateRealClick(likeButton as HTMLElement);
      return true;
    } catch (error) {
      console.error("Error liking tweet:", error);
      return false;
    }
  }

  /**
   * Utility method to add delay between actions
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
