import { TwitterAgent } from "../lib/twitterAgent";

class TwitterService {
  private agent: TwitterAgent;

  constructor() {
    this.agent = new TwitterAgent({
      delayBetweenActions: 1500, // Slightly longer delay for safety
      maxRetries: 3,
    });
  }

  async getTimelinePosts() {
    return this.agent.getTimelinePosts();
  }

  async autoReplyToTweet(tweetId: string, replyText: string) {
    return this.agent.autoReply(tweetId, replyText);
  }

  async quoteTweet(tweetId: string, quoteText: string) {
    return this.agent.quoteRepost(tweetId, quoteText);
  }

  async likeTweet(tweetId: string) {
    return this.agent.likeTweet(tweetId);
  }
}

// Create a singleton instance
const twitterService = new TwitterService();
export default twitterService;
