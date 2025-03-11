import { addExtensionBadge, updateBadgeStatus } from '../../lib/ui';
import { simulateRealClick } from '../../lib/twitter';
import { safeStorageGet, safeStorageSet } from '../../lib/storage';

console.log('BUZZ Reply Helper: Twitter content script loaded');

// Initialize the Twitter content script
function initTwitterContentScript() {
  // Add a badge to indicate the extension is active
  const badge = addExtensionBadge('🐝');
  
  // Check if this is a Twitter intent URL
  if (window.location.href.includes('twitter.com/intent/tweet')) {
    handleTwitterIntent(badge);
  } else {
    // Set up observers to watch for tweet success
    setupTweetObservers(badge);
  }
}

// Function to handle Twitter intent URLs
async function handleTwitterIntent(badge: HTMLElement) {
  updateBadgeStatus(badge, 'replying');
  console.log('handleTwitterIntent called for intent URL:', window.location.href);
  
  // Extract the text parameter from the URL
  const urlParams = new URLSearchParams(window.location.search);
  const textParam = urlParams.get('text');
  
  console.log('Text parameter provided:', textParam);
  
  if (!textParam) {
    // If no text parameter was provided, check storage
    const result = await safeStorageGet<{
      autoReplyEnabled?: boolean,
      autoReplyEnabledTimestamp?: number,
      autoReplyText?: string
    }>(['autoReplyEnabled', 'autoReplyEnabledTimestamp', 'autoReplyText']);
    
    console.log('Intent handler - Auto-reply enabled:', result.autoReplyEnabled);
    console.log('Intent handler - Auto-reply text:', result.autoReplyText);
    console.log('Intent handler - Auto-reply timestamp:', result.autoReplyEnabledTimestamp);
    
    // For simplicity, we'll use the global flag for now
    let shouldAutoReply = false;
    
    if (result.autoReplyEnabled && result.autoReplyText) {
      // Check if the setting is still valid (less than 5 minutes old)
      const now = Date.now();
      const timestamp = result.autoReplyEnabledTimestamp || 0;
      const fiveMinutesAgo = now - (5 * 60 * 1000);
      
      if (timestamp > fiveMinutesAgo) {
        shouldAutoReply = true;
      } else {
        console.log('Auto-reply setting expired');
        // Clear the expired setting
        await safeStorageSet({ autoReplyEnabled: false });
      }
    }
    
    if (shouldAutoReply) {
      console.log('Auto-replying with text:', result.autoReplyText);
      fillReplyText(result.autoReplyText || '');
      
      // Clear the auto-reply text after using it
      await safeStorageSet({ 
        autoReplyText: null,
        autoReplyEnabled: false
      });
    }
  } else {
    // If a text parameter was provided, use it
    console.log('Using provided text parameter:', textParam);
    fillReplyText(textParam);
  }
  
  // Set up observers to watch for tweet success
  setupTweetObservers(badge);
}

// Function to fill in the reply text
function fillReplyText(text: string) {
  console.log('Filling reply text:', text);
  
  // Wait for the tweet input to be available
  const checkForInput = setInterval(() => {
    // Look for the tweet input field
    const tweetInputs = document.querySelectorAll('div[contenteditable="true"]');
    
    if (tweetInputs.length > 0) {
      clearInterval(checkForInput);
      
      // Fill in the text
      const tweetInput = tweetInputs[0] as HTMLElement;
      tweetInput.focus();
      tweetInput.textContent = text;
      
      // Dispatch input event to trigger character count update
      tweetInput.dispatchEvent(new Event('input', { bubbles: true }));
      
      console.log('Filled in reply text');
    }
  }, 100);
}

// Function to set up observers to watch for tweet success
function setupTweetObservers(badge: HTMLElement) {
  // Create a mutation observer to watch for changes to the page
  const tweetObserver = new MutationObserver((mutations) => {
    // Check if we're on a success page
    if (window.location.href.includes('/status/')) {
      // We've been redirected to the tweet page, which means the tweet was successful
      const replyUrl = window.location.href;
      console.log('Tweet success detected, URL:', replyUrl);
      
      // Update the badge
      updateBadgeStatus(badge, 'success');
      
      // Handle the successful tweet
      handleTweetSuccess(replyUrl);
      
      // Stop observing
      tweetObserver.disconnect();
    }
  });
  
  // Start observing the document body for changes
  tweetObserver.observe(document.body, { childList: true, subtree: true });
}

// Function to wait for tweet success
async function waitForTweetSuccess(timeout: number): Promise<string | null> {
  console.log('Waiting for tweet success...');
  
  return new Promise((resolve) => {
    // Set a timeout to avoid waiting forever
    const timeoutId = setTimeout(() => {
      console.log('Timed out waiting for tweet success');
      resolve(null);
    }, timeout);
    
    // Function to check if we're on a success page
    const checkForSuccess = () => {
      console.log('Checking for tweet success indicators...');
      
      // Check for success indicators in the URL
      const url = window.location.href;
      console.log('Current URL:', url);
      
      // If we're redirected to the tweet page, it's a success
      if (url.includes('/status/')) {
        console.log('Success: Redirected to tweet page');
        clearTimeout(timeoutId);
        resolve(url);
        return;
      }
      
      // Check for success messages in the page content
      const pageText = document.body.textContent?.toLowerCase() || '';
      const successIndicators = [
        'your tweet was sent',
        'tweet posted',
        'your reply was sent',
        'reply posted'
      ];
      
      for (const indicator of successIndicators) {
        if (pageText.includes(indicator)) {
          console.log('Success: Found success message in page:', indicator);
          
          // Try to extract the tweet URL
          const tweetLinks = Array.from(document.querySelectorAll('a[href*="/status/"]'));
          if (tweetLinks.length > 0) {
            const tweetUrl = tweetLinks[0].getAttribute('href');
            if (tweetUrl) {
              console.log('Extracted tweet URL from success page:', tweetUrl);
              clearTimeout(timeoutId);
              resolve(tweetUrl);
              return;
            }
          }
          
          // If we can't find the tweet URL, use the current URL
          clearTimeout(timeoutId);
          resolve(url);
          return;
        }
      }
      
      // If we're still on the compose page, keep checking
      setTimeout(checkForSuccess, 500);
    };
    
    // Start checking
    checkForSuccess();
  });
}

// Function to request window close with logging
async function requestWindowClose(reason: string): Promise<boolean> {
  console.log(`Requesting window close (Reason: ${reason})`);
  
  return new Promise((resolve) => {
    // First try to get the window ID directly from the browser
    if (typeof chrome !== 'undefined' && chrome.windows) {
      chrome.windows.getCurrent(currentWindow => {
        console.log('Current window from chrome.windows.getCurrent:', currentWindow);
        
        if (currentWindow && currentWindow.id) {
          // Send the window ID to the background script
          chrome.runtime.sendMessage({ 
            action: 'closeTwitterWindow',
            reason: reason,
            url: window.location.href,
            windowId: currentWindow.id,
            timestamp: Date.now()
          }, response => {
            console.log('Window close request response:', response);
            if (chrome.runtime.lastError || !response?.success) {
              console.log('Background script close failed with window ID:', chrome.runtime.lastError?.message || response?.reason);
              
              // Only try direct window.close() as a last resort
              console.log('Attempting direct window.close() as last resort');
              try {
                window.close();
                resolve(true);
              } catch (e) {
                console.error('Failed to close window directly:', e);
                resolve(false);
              }
            } else {
              resolve(true);
            }
          });
        } else {
          console.log('Could not get current window ID');
          resolve(false);
        }
      });
    } else {
      console.log('chrome.windows API not available');
      resolve(false);
    }
  });
}

// Function to check if window should auto-close
async function checkAutoClose(): Promise<boolean> {
  const result = await safeStorageGet<{ closeTab?: boolean }>(['closeTab']);
  return result.closeTab !== false; // Default to true if not set
}

// Function to handle successful tweet
async function handleTweetSuccess(replyUrl: string) {
  console.log('Tweet was successful, extracted reply URL:', replyUrl);
  
  try {
    // Store the URL in local storage
    await safeStorageSet({ lastReplyUrl: replyUrl });
    
    console.log('Stored reply URL in local storage:', replyUrl);

    // Debug: Log all storage values
    const allData = await safeStorageGet(null);
    console.log('All storage data before forwarding URL:', allData);

    // Send the URL to the background script to forward to Edge Posting tabs
    console.log('Sending forwardReplyUrl message to background script with URL:', replyUrl);
    chrome.runtime.sendMessage({
      action: 'forwardReplyUrl',
      replyUrl: replyUrl
    }, response => {
      console.log('Background script response to forwarding URL:', response);
      
      if (!response || !response.success) {
        console.warn('Failed to forward reply URL to Edge Posting tabs:', response?.reason || 'Unknown error');
      } else {
        console.log('Successfully forwarded reply URL to', response.tabCount, 'Edge Posting tabs');
      }
    });
    
    // Debug: Log all storage values
    const storageData = await safeStorageGet(null);
    console.log('All storage data before window close:', storageData);
    
    // Log specific window tracking data
    if (storageData.openedWindows) {
      console.log('Opened windows:', storageData.openedWindows);
      console.log('Window IDs:', Object.keys(storageData.openedWindows));
    } else {
      console.log('No opened windows found in storage');
    }
    
    // Check if we should auto-close
    const shouldClose = await checkAutoClose();
    if (shouldClose) {
      console.log('Auto-close is enabled, attempting to close window');
      // Try to close the window
      const closed = await requestWindowClose('Tweet successful');
      if (!closed) {
        console.log('All close attempts failed');
      }
    } else {
      console.log('Auto-close is disabled, not closing window');
    }
  } catch (error) {
    console.error('Error handling tweet success:', error);
  }
}

// Initialize the content script
initTwitterContentScript(); 