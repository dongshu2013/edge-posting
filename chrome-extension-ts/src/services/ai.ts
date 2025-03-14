import { Settings } from '../types';

export async function callAiModel(prompt: string, settings: Settings): Promise<string> {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
    
    // Only add API key if it's configured
    if (settings.apiKey) {
      headers['Authorization'] = `Bearer ${settings.apiKey}`;
    }

    const response = await fetch(`${settings.openaiUrl}/v1/chat/completions`, {
      method: 'POST',
      headers,
      mode: 'cors',
      credentials: 'omit',
      body: JSON.stringify({
        model: settings.model,
        messages: [{
          role: 'user',
          content: prompt
        }],
        temperature: 0.7,
        stream: false
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`AI model error (${response.status}): ${errorData}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error: unknown) {
    console.error('Error calling AI model:', error);
    throw new Error(`Failed to call AI model: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function extractTwitterPosts(html: string, settings: Settings): Promise<string[]> {
  try {
    const prompt = `You are a Twitter HTML parser. Given the HTML content of a Twitter profile page, extract all the tweets. Return ONLY the tweet text content, separated by newlines. Exclude any retweets, replies, metadata, or any other non-tweet content.

The HTML content will be messy and may contain scripts, styles, and other irrelevant content. Focus on finding the actual tweet text content within the HTML.

HTML Content:
${html}`;

    const result = await callAiModel(prompt, settings);
    return result.split('\n').filter(tweet => tweet.trim().length > 0);
  } catch (error: unknown) {
    console.error('Error extracting tweets:', error);
    throw new Error(`Failed to extract tweets: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function summarizeProfile(posts: string[], existingContent: string = '', settings: Settings): Promise<string> {
  try {
    const prompt = `You are a Twitter profile analyzer. Given a set of tweets, create a concise profile description that captures the key characteristics, interests, and patterns in the user's tweets. If there's existing profile content, incorporate it and update with new insights.

${existingContent ? `Existing Profile Description:\n${existingContent}\n\n` : ''}

Tweets to analyze:
${posts.join('\n')}

Create a natural-sounding profile description that highlights:
1. Main topics and interests
2. Writing style and tone
3. Professional or personal focus
4. Notable patterns or themes`;

    return await callAiModel(prompt, settings);
  } catch (error: unknown) {
    console.error('Error summarizing profile:', error);
    throw new Error(`Failed to summarize profile: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
