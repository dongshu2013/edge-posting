/**
 * Content script for Twitter/X.com
 * This script runs on Twitter and helps capture reply URLs.
 */

console.log('BUZZ Reply Helper: Twitter content script loaded');

// Add a small badge to show the extension is active
function addTwitterBadge() {
  // Create a badge element
  const badge = document.createElement('div');
  badge.id = 'buzz-helper-twitter-badge';
  badge.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    padding: 8px 12px;
    border-radius: 8px;
    font-size: 12px;
    font-weight: bold;
    z-index: 9999;
    background-color: #dcfce7;
    color: #166534;
    border: 1px solid #86efac;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    transition: all 0.3s ease;
    opacity: 0.8;
  `;
  badge.textContent = '🐝 BUZZ Helper Active';
  
  // Add hover effect
  badge.addEventListener('mouseenter', () => {
    badge.style.opacity = '1';
    badge.style.transform = 'translateY(-3px)';
    badge.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.15)';
  });
  
  badge.addEventListener('mouseleave', () => {
    badge.style.opacity = '0.8';
    badge.style.transform = 'translateY(0)';
    badge.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
  });
  
  // Add to the page
  document.body.appendChild(badge);
  
  return badge;
}

// Add the badge
const badge = addTwitterBadge();

// Check if we're on a tweet page
if (window.location.href.includes('/status/')) {
  console.log('On a tweet page, setting up reply URL capture');
  
  // Set up a listener to capture the URL when the page changes
  let lastUrl = window.location.href;
  
  // Function to check if the URL has changed
  const checkUrlChange = () => {
    if (window.location.href !== lastUrl) {
      console.log('URL changed from', lastUrl, 'to', window.location.href);
      lastUrl = window.location.href;
      
      // If this is a reply URL (contains /status/ twice or has 'reply' in the URL)
      if ((lastUrl.match(/\/status\//g) || []).length >= 2 || 
          lastUrl.includes('/reply') || 
          isReplyUrl(lastUrl)) {
        console.log('This appears to be a reply URL:', lastUrl);
        
        // Store the reply URL in session storage
        try {
          sessionStorage.setItem('lastTwitterReplyUrl', lastUrl);
          console.log('Stored reply URL in session storage');
          
          // Update the badge to show the URL was captured
          badge.textContent = '🐝 Reply URL Captured!';
          badge.style.backgroundColor = '#c7f9cc';
          badge.style.borderColor = '#74c69d';
          
          // Notify the background script
          chrome.runtime.sendMessage({
            action: 'replyUrlCaptured',
            replyUrl: lastUrl
          });
          
          // Reset the badge after 3 seconds
          setTimeout(() => {
            badge.textContent = '🐝 BUZZ Helper Active';
            badge.style.backgroundColor = '#dcfce7';
            badge.style.borderColor = '#86efac';
          }, 3000);
        } catch (e) {
          console.error('Failed to store reply URL in session storage:', e);
        }
      }
    }
  };
  
  // Helper function to determine if a URL is likely a reply
  function isReplyUrl(url) {
    // Check if the URL contains indicators of a reply
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');
    
    // Check for patterns that indicate a reply
    return (
      // Check if there are multiple status IDs in the path
      pathParts.filter(part => /^\d+$/.test(part)).length > 1 ||
      // Check for reply-specific query parameters
      urlObj.searchParams.has('reply_to') ||
      urlObj.searchParams.has('replied_to') ||
      // Check for reply-specific path segments
      pathParts.includes('replies') ||
      // Check if the URL contains a reference to the original tweet
      url.includes('in_reply_to')
    );
  }
  
  // Check for URL changes periodically
  setInterval(checkUrlChange, 500); // Check more frequently
  
  // Also listen for navigation events
  window.addEventListener('popstate', checkUrlChange);
  
  // Try to intercept History API calls
  const originalPushState = history.pushState;
  history.pushState = function() {
    originalPushState.apply(this, arguments);
    checkUrlChange();
  };
  
  const originalReplaceState = history.replaceState;
  history.replaceState = function() {
    originalReplaceState.apply(this, arguments);
    checkUrlChange();
  };
  
  // Also try to detect when a tweet is posted
  const observeTweetButton = () => {
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          // Look for elements that might indicate a successful tweet
          const successIndicators = document.querySelectorAll('[data-testid="toast"], [aria-label*="Posted"], [role="alert"]');
          
          if (successIndicators.length > 0) {
            console.log('Tweet posted indicator detected');
            
            // Wait a moment for the URL to update
            setTimeout(() => {
              const currentUrl = window.location.href;
              if (isReplyUrl(currentUrl)) {
                console.log('Detected reply URL after posting:', currentUrl);
                
                // Store the reply URL
                try {
                  sessionStorage.setItem('lastTwitterReplyUrl', currentUrl);
                  
                  // Update the badge
                  badge.textContent = '🐝 Reply URL Captured!';
                  badge.style.backgroundColor = '#c7f9cc';
                  badge.style.borderColor = '#74c69d';
                  
                  // Notify the background script
                  chrome.runtime.sendMessage({
                    action: 'replyUrlCaptured',
                    replyUrl: currentUrl
                  });
                } catch (e) {
                  console.error('Failed to store reply URL:', e);
                }
              }
            }, 1000);
          }
        }
      }
    });
    
    // Observe the entire document for changes
    observer.observe(document.body, { childList: true, subtree: true });
  };
  
  // Start observing for tweet button clicks
  observeTweetButton();
}

// Listen for messages from the background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Twitter content script received message:', message);
  
  if (message.action === 'getReplyUrl') {
    // Try to get the stored reply URL
    const replyUrl = sessionStorage.getItem('lastTwitterReplyUrl');
    sendResponse({ replyUrl });
    return true;
  }
  
  // We don't need to handle any other specific messages here,
  // as the reply handling is done by the injected script
  
  sendResponse({ success: true });
  return true;
}); 