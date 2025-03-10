// Initialize default settings when extension is installed
chrome.runtime.onInstalled.addListener(function() {
  chrome.storage.local.set({
    autoSubmit: true,
    closeTab: true,
    model: 'google/gemini-2.0-flash-001',
    openedWindows: {} // Track windows with their creation timestamps
  });
  console.log('BUZZ Reply Helper: Extension installed with default settings');
});

// Listen for messages from Twitter content script
chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
  console.log('Background script received message:', message);
  
  if (message.action === 'closeTwitterWindow') {
    console.log('Received close window request:', {
      reason: message.reason,
      sender: sender,
      tabId: sender.tab?.id,
      windowId: sender.tab?.windowId
    });
    
    // Get the list of windows we've opened
    chrome.storage.local.get(['openedWindows', 'closeTab'], function(result) {
      console.log('Current opened windows:', result.openedWindows);
      console.log('Close tab setting:', result.closeTab);
      
      if (!result.closeTab) {
        console.log('Window closing is disabled in settings');
        sendResponse({ success: false, reason: 'Window closing disabled' });
        return;
      }
      
      const openedWindows = result.openedWindows || {};
      const windowId = sender.tab?.windowId;
      
      if (windowId && openedWindows[windowId]) {
        console.log('Found matching window:', windowId);
        // Remove this window from tracking
        delete openedWindows[windowId];
        
        // Update storage and close window
        chrome.storage.local.set({ openedWindows }, function() {
          chrome.windows.remove(windowId, function() {
            if (chrome.runtime.lastError) {
              console.error('Error closing window:', chrome.runtime.lastError);
              sendResponse({ success: false, error: chrome.runtime.lastError.message });
            } else {
              console.log('Window closed successfully');
              sendResponse({ success: true });
            }
          });
        });
      } else {
        console.log('Window was not opened by our extension or tab info missing');
        // Try closing the window directly as a fallback
        if (windowId) {
          chrome.windows.remove(windowId, function() {
            if (chrome.runtime.lastError) {
              console.error('Error in fallback close:', chrome.runtime.lastError);
              sendResponse({ success: false, error: chrome.runtime.lastError.message });
            } else {
              console.log('Window closed via fallback');
              sendResponse({ success: true });
            }
          });
        } else {
          sendResponse({ success: false, reason: 'No window ID found' });
        }
      }
    });
    
    return true; // Keep the message channel open for async response
  }
  
  if (message.action === 'captureReplyUrl') {
    console.log('Captured reply URL:', message.replyUrl);
    
    // Store the reply URL
    chrome.storage.local.set({ lastReplyUrl: message.replyUrl });
    
    // If auto-close is enabled, close the Twitter window
    chrome.storage.local.get(['closeTab', 'openedWindows'], function(result) {
      if (result.closeTab && sender.tab) {
        // Check if this tab's window was opened by our extension
        const openedWindows = result.openedWindows || {};
        if (openedWindows[sender.tab.windowId]) {
          console.log('Closing window that was opened by our extension:', sender.tab.windowId);
          
          // Remove this window from tracking
          delete openedWindows[sender.tab.windowId];
          chrome.storage.local.set({ openedWindows });
        }
      }
    });
  }
  
  if (message.action === 'openTwitterWithReply') {
    console.log('Opening Twitter with auto-reply:', message.tweetLink, message.replyText);
    
    // Store the reply text for the Twitter content script to use
    chrome.storage.local.set({ autoReplyText: message.replyText });
    
    // Configure popup window dimensions
    const width = 600;
    const height = 700;
    const left = Math.max((screen.width - width) / 2, 0);
    const top = Math.max((screen.height - height) / 2, 0);
    
    // Open Twitter in a popup window
    chrome.windows.create({
      url: message.tweetLink,
      type: 'popup',
      width: width,
      height: height,
      left: Math.round(left),
      top: Math.round(top)
    }, function(window) {
      console.log('Opened Twitter popup window:', window.id);
      
      // Track this window with timestamp
      chrome.storage.local.get(['openedWindows'], function(result) {
        const openedWindows = result.openedWindows || {};
        openedWindows[window.id] = {
          timestamp: Date.now(),
          url: message.tweetLink
        };
        chrome.storage.local.set({ openedWindows });
        console.log('Updated opened windows list:', openedWindows);
      });
      
      // Set up an auto-close timeout (5 minutes)
      setTimeout(() => {
        chrome.storage.local.get(['openedWindows'], function(result) {
          const windows = result.openedWindows || {};
          if (windows[window.id]) {
            console.log('Auto-closing window after timeout:', window.id);
            chrome.windows.remove(window.id, function() {
              delete windows[window.id];
              chrome.storage.local.set({ openedWindows: windows });
            });
          }
        });
      }, 5 * 60 * 1000); // 5 minutes
    });
    
    sendResponse({ success: true });
    return true;
  }
  
  if (message.action === 'submitReplyUrl') {
    console.log('Submitting reply URL to Edge Posting:', message.replyUrl);
    
    // Get the tab that sent the message to submit the reply URL
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      if (tabs.length === 0) {
        console.error('No active tab found');
        sendResponse({ success: false, error: 'No active tab found' });
        return;
      }
      
      // Execute script to submit the reply URL
      chrome.scripting.executeScript({
        target: { tabId: tabs[0].id },
        func: (replyUrl) => {
          // Find the reply URL input field
          const replyUrlInputs = document.querySelectorAll('input[placeholder*="reply" i]');
          
          if (replyUrlInputs.length > 0) {
            // Set the value
            replyUrlInputs[0].value = replyUrl;
            
            // Dispatch input event to trigger validation
            replyUrlInputs[0].dispatchEvent(new Event('input', { bubbles: true }));
            
            // Find the submit button
            const submitButtons = Array.from(document.querySelectorAll('button')).filter(button => 
              button.textContent.toLowerCase().includes('submit')
            );
            
            if (submitButtons.length > 0) {
              // Click the submit button
              submitButtons[0].click();
              return true;
            }
          }
          
          return false;
        },
        args: [message.replyUrl]
      }).then(results => {
        sendResponse({ success: results[0].result });
      }).catch(error => {
        console.error('Error executing script:', error);
        sendResponse({ success: false, error: error.message });
      });
    });
    
    return true; // Keep the message channel open for async response
  }
  
  if (message.action === 'analyzeTwitterPage') {
    console.log('Analyzing Twitter page with AI...');
    
    // Get the API key and model
    chrome.storage.local.get(['apiKey', 'model'], async function(settings) {
      if (!settings.apiKey) {
        console.error('No API key found for AI analysis');
        sendResponse({ success: false, error: 'No API key found' });
        return;
      }
      
      try {
        // Prepare the prompt for the AI
        const prompt = `
          You are an AI specialized in analyzing HTML to find specific elements.
          
          I need you to analyze this Twitter page HTML and identify the REPLY button.
          
          Please provide:
          1. A CSS selector that will uniquely identify the reply button
          2. An XPath expression that will uniquely identify the reply button
          3. The approximate coordinates (x, y) of the reply button if visible
          
          The reply button is typically:
          - A button or div with role="button"
          - Contains text like "Reply" or an icon for replying
          - Often has data-testid="reply" or aria-label containing "Reply"
          
          Return your answer as a JSON object with these properties:
          {
            "selector": "CSS selector string",
            "xpath": "XPath expression string",
            "coordinates": {"x": number, "y": number},
            "explanation": "Brief explanation of how you identified the button"
          }
          
          HTML: ${message.html.substring(0, 15000)}...
        `;
        
        // Make the API request to OpenRouter
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${settings.apiKey}`,
            'HTTP-Referer': 'chrome-extension://buzz-reply-helper',
            'X-Title': 'BUZZ Reply Helper'
          },
          body: JSON.stringify({
            model: settings.model || 'google/gemini-2.0-flash-001',
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
        try {
          const parsedContent = JSON.parse(content);
          console.log('AI analysis result:', parsedContent);
          
          sendResponse({
            success: true,
            selector: parsedContent.selector,
            xpath: parsedContent.xpath,
            coordinates: parsedContent.coordinates,
            explanation: parsedContent.explanation
          });
        } catch (parseError) {
          console.error('Error parsing AI response:', parseError);
          sendResponse({ success: false, error: 'Failed to parse AI response' });
        }
      } catch (error) {
        console.error('Error calling AI API:', error);
        sendResponse({ success: false, error: error.message });
      }
    });
    
    return true; // Keep the message channel open for async response
  }
  
  if (message.action === 'analyzeTweetButton') {
    console.log('Analyzing Twitter page for tweet button with AI...');
    
    // Get the API key and model
    chrome.storage.local.get(['apiKey', 'model'], async function(settings) {
      if (!settings.apiKey) {
        console.error('No API key found for AI analysis');
        sendResponse({ success: false, error: 'No API key found' });
        return;
      }
      
      try {
        // Prepare the prompt for the AI
        const prompt = `
          You are an AI specialized in analyzing HTML to find specific elements.
          
          I need you to analyze this Twitter page HTML and identify the TWEET or REPLY button that would submit a tweet or reply.
          
          Please provide:
          1. A CSS selector that will uniquely identify the tweet/reply submit button
          2. An XPath expression that will uniquely identify the tweet/reply submit button
          3. The approximate coordinates (x, y) of the tweet/reply submit button if visible
          
          The tweet/reply submit button is typically:
          - A button or div with role="button"
          - Contains text like "Tweet", "Reply", or "Post"
          - Often has data-testid="tweetButton" or data-testid="tweetButtonInline"
          - Usually blue in color and positioned at the bottom right of a compose box
          
          Return your answer as a JSON object with these properties:
          {
            "selector": "CSS selector string",
            "xpath": "XPath expression string",
            "coordinates": {"x": number, "y": number},
            "explanation": "Brief explanation of how you identified the button"
          }
          
          HTML: ${message.html.substring(0, 15000)}...
        `;
        
        // Make the API request to OpenRouter
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${settings.apiKey}`,
            'HTTP-Referer': 'chrome-extension://buzz-reply-helper',
            'X-Title': 'BUZZ Reply Helper'
          },
          body: JSON.stringify({
            model: settings.model || 'google/gemini-2.0-flash-001',
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
        try {
          const parsedContent = JSON.parse(content);
          console.log('AI analysis result for tweet button:', parsedContent);
          
          sendResponse({
            success: true,
            selector: parsedContent.selector,
            xpath: parsedContent.xpath,
            coordinates: parsedContent.coordinates,
            explanation: parsedContent.explanation
          });
        } catch (parseError) {
          console.error('Error parsing AI response:', parseError);
          sendResponse({ success: false, error: 'Failed to parse AI response' });
        }
      } catch (error) {
        console.error('Error calling AI API:', error);
        sendResponse({ success: false, error: error.message });
      }
    });
    
    return true; // Keep the message channel open for async response
  }
  
  // Default response
  sendResponse({ success: false, error: 'Unknown action' });
  return true;
});

// Listen for tab updates to detect Twitter pages
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
  // Only proceed if the tab has completed loading
  if (changeInfo.status !== 'complete') return;
  
  // Check if this is a Twitter page
  if (tab.url && (tab.url.includes('twitter.com') || tab.url.includes('x.com'))) {
    // Inject the Twitter content script
    chrome.scripting.executeScript({
      target: { tabId: tabId },
      files: ['twitter-content.js']
    }).catch(err => {
      console.error('Error injecting Twitter content script:', err);
    });
  }
}); 