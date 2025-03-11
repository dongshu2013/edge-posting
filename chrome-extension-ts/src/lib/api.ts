import { ApiResponse } from './types';

/**
 * Make an API request to OpenRouter
 */
export async function callOpenRouterApi<T = any>(
  prompt: string, 
  apiKey: string, 
  model: string = 'google/gemini-2.0-flash-001'
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'chrome-extension://buzz-reply-helper',
        'X-Title': 'BUZZ Reply Helper'
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" }
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`API error (${response.status}): ${errorData.error?.message || 'Unknown error'}`);
    }
    
    const data = await response.json();
    const content = data.choices[0].message.content;
    
    // Parse the JSON from the content
    const parsedContent = JSON.parse(content);
    return {
      success: true,
      data: parsedContent as T
    };
  } catch (error: any) {
    console.error('Error calling OpenRouter API:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Extract buzz cards from HTML using AI
 */
export async function extractBuzzCardsWithAI(
  html: string,
  apiKey: string,
  model: string
): Promise<ApiResponse<any[]>> {
  try {
    // Prepare the prompt for the AI
    const prompt = `
      You are an AI specialized in extracting structured data from HTML.
      
      I need you to analyze this HTML from an Edge Posting page and extract all the buzz cards.
      
      For each buzz card, extract:
      1. id - The unique identifier for the buzz card
      2. tweetLink - The Twitter/X.com link that needs to be replied to
      3. instructions - Any instructions for replying
      4. price - The BUZZ amount offered (just the number)
      5. replyCount - Current number of replies
      6. totalReplies - Total number of replies allowed
      7. createdBy - Who created the buzz
      8. username - Twitter username if available
      9. buttonSelector - A CSS selector that would uniquely identify the "Reply & Earn" button for this card
      
      Return your answer as a JSON array of objects with these properties.
      
      HTML: ${html.substring(0, 15000)}...
    `;
    
    // Make the API request
    const response = await callOpenRouterApi<any>(prompt, apiKey, model);
    
    if (!response.success) {
      return response;
    }
    
    // Handle different response formats
    let buzzCards = [];
    
    if (Array.isArray(response.data)) {
      // If the response is already an array, use it directly
      buzzCards = response.data;
    } else if (response.data.buzzCards && Array.isArray(response.data.buzzCards)) {
      // If the response has a buzzCards property that's an array, use that
      buzzCards = response.data.buzzCards;
    } else if (response.data.data && Array.isArray(response.data.data)) {
      // If the response has a data property that's an array, use that
      buzzCards = response.data.data;
    } else if (response.data.results && Array.isArray(response.data.results)) {
      // If the response has a results property that's an array, use that
      buzzCards = response.data.results;
    } else {
      // If we can't find an array, return an error
      return {
        success: false,
        error: 'Could not parse buzz cards from AI response'
      };
    }
    
    return {
      success: true,
      data: buzzCards
    };
  } catch (error: any) {
    console.error('Error extracting buzz cards with AI:', error);
    return {
      success: false,
      error: error.message
    };
  }
} 