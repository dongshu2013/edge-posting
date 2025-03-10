/**
 * Content script for Twitter/X.com
 * This script runs on Twitter and helps capture reply URLs.
 */

console.log('BUZZ Reply Helper: Twitter content script loaded');

// Add a badge to indicate the extension is active
function addExtensionBadge() {
  const badge = document.createElement('div');
  badge.id = 'buzz-helper-badge';
  badge.textContent = '🐝';
  badge.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: linear-gradient(to right, #4f46e5, #7c3aed);
    color: white;
    width: 30px;
    height: 30px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
    z-index: 9999;
    cursor: pointer;
    transition: all 0.3s ease;
  `;
  
  badge.addEventListener('mouseenter', () => {
    badge.style.transform = 'scale(1.1)';
  });
  
  badge.addEventListener('mouseleave', () => {
    badge.style.transform = 'scale(1)';
  });
  
  badge.addEventListener('click', () => {
    badge.textContent = badge.textContent === '🐝' ? '✅' : '🐝';
    setTimeout(() => {
      badge.textContent = '🐝';
    }, 2000);
  });
  
  document.body.appendChild(badge);
  return badge;
}

// Function to check if a URL is likely a reply
function isReplyUrl(url) {
  return url && 
         (url.includes('twitter.com/') || url.includes('x.com/')) && 
         url.includes('/status/');
}

// Function to update the badge status
function updateBadgeStatus(badge, status) {
  if (!badge) return;
  
  switch (status) {
    case 'capturing':
      badge.textContent = '👀';
      badge.style.background = '#f59e0b';
      break;
    case 'captured':
      badge.textContent = '✅';
      badge.style.background = '#10b981';
      setTimeout(() => {
        badge.textContent = '🐝';
        badge.style.background = 'linear-gradient(to right, #4f46e5, #7c3aed)';
      }, 3000);
      break;
    case 'error':
      badge.textContent = '❌';
      badge.style.background = '#ef4444';
      setTimeout(() => {
        badge.textContent = '🐝';
        badge.style.background = 'linear-gradient(to right, #4f46e5, #7c3aed)';
      }, 3000);
      break;
    case 'replying':
      badge.textContent = '✍️';
      badge.style.background = '#3b82f6';
      break;
    case 'publishing':
      badge.textContent = '🚀';
      badge.style.background = '#8b5cf6';
      break;
    default:
      badge.textContent = '🐝';
      badge.style.background = 'linear-gradient(to right, #4f46e5, #7c3aed)';
  }
}

// Function to use AI to identify the reply button
async function findReplyButtonWithAI() {
  console.log('Using AI to find the reply button...');
  
  try {
    // Get the simplified HTML of the page
    const html = simplifyHTML(document.documentElement.outerHTML);
    
    // Send the HTML to the background script for AI analysis
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({
        action: 'analyzeTwitterPage',
        html: html
      }, response => {
        if (response && response.success && response.selector) {
          console.log('AI identified reply button selector:', response.selector);
          
          try {
            // Try to find the element using the AI-provided selector
            const element = document.querySelector(response.selector);
            if (element) {
              console.log('Found reply button using AI selector:', element);
              resolve(element);
              return;
            }
          } catch (error) {
            console.error('Error using AI selector:', error);
          }
          
          // If we couldn't find the element using the selector, try using the XPath
          if (response.xpath) {
            console.log('Trying XPath from AI:', response.xpath);
            try {
              const result = document.evaluate(
                response.xpath, 
                document, 
                null, 
                XPathResult.FIRST_ORDERED_NODE_TYPE, 
                null
              );
              
              if (result.singleNodeValue) {
                console.log('Found reply button using AI XPath:', result.singleNodeValue);
                resolve(result.singleNodeValue);
                return;
              }
            } catch (error) {
              console.error('Error using AI XPath:', error);
            }
          }
          
          // If we still couldn't find the element, try using the coordinates
          if (response.coordinates) {
            console.log('Trying coordinates from AI:', response.coordinates);
            const { x, y } = response.coordinates;
            
            // Find the element at these coordinates
            const element = document.elementFromPoint(x, y);
            if (element) {
              console.log('Found element at coordinates:', element);
              resolve(element);
              return;
            }
          }
        }
        
        console.log('AI could not identify the reply button');
        resolve(null);
      });
    });
  } catch (error) {
    console.error('Error using AI to find reply button:', error);
    return null;
  }
}

// Helper function to simplify HTML for AI analysis
function simplifyHTML(html) {
  // Remove scripts, styles, and unnecessary attributes to reduce token count
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/ (onclick|onload|onunload|onchange|onsubmit|ondblclick|onmouseover|onmouseout|onkeydown|onkeypress)="[^"]*"/gi, '')
    .replace(/ class="[^"]*"/gi, ' class="x"') // Simplify class names but keep the attribute
    .replace(/ id="[^"]*"/gi, ' id="x"') // Simplify id names but keep the attribute
    .replace(/ data-[^=]*="[^"]*"/gi, '');
}

// Function to automatically click the reply button
async function autoClickReplyButton() {
  console.log('Looking for reply button using AI...');
  
  // Try using AI to find the reply button
  const aiButton = await findReplyButtonWithAI();
  if (aiButton) {
    console.log('Clicking reply button found by AI...');
    simulateRealClick(aiButton);
    
    // Verify the click worked by checking for the reply dialog
    return new Promise(resolve => {
      setTimeout(() => {
        const tweetInputs = document.querySelectorAll('div[contenteditable="true"]');
        if (tweetInputs.length > 0) {
          console.log('Reply dialog appeared after AI button click');
          resolve(true);
        } else {
          console.log('Reply dialog did not appear after AI button click');
          // Try clicking one more time
          simulateRealClick(aiButton);
          
          // Check again after a short delay
          setTimeout(() => {
            const tweetInputs = document.querySelectorAll('div[contenteditable="true"]');
            resolve(tweetInputs.length > 0);
          }, 1000);
        }
      }, 1000);
    });
  }
  
  // If AI fails, give up
  console.log('AI could not find the reply button, giving up');
  return false;
}

// Helper function to simulate a more realistic click
function simulateRealClick(element) {
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

// Function to fill in the reply text
function fillReplyText(text) {
  console.log('Looking for reply input field...');
  
  // Try multiple times with increasing delays
  tryFillReplyText(text, 1);
}

// Helper function to try filling the reply text with retries
function tryFillReplyText(text, attempt, maxAttempts = 5) {
  if (attempt > maxAttempts) {
    console.error(`Failed to fill reply text after ${maxAttempts} attempts`);
    return;
  }
  
  console.log(`Attempt ${attempt} to fill reply text`);
  
  // Find the tweet input field - Twitter has different selectors depending on the UI version
  const tweetInputs = [
    ...document.querySelectorAll('div[data-testid="tweetTextarea_0"]'),
    ...document.querySelectorAll('div[contenteditable="true"][aria-label="Tweet text"]'),
    ...document.querySelectorAll('div[contenteditable="true"][aria-multiline="true"]'),
    ...document.querySelectorAll('div[contenteditable="true"]'),
    ...document.querySelectorAll('div[role="textbox"]'),
    ...document.querySelectorAll('textarea')
  ];
  
  if (tweetInputs.length > 0) {
    console.log('Found tweet input field, filling text...', tweetInputs[0]);
    
    // Focus the input
    tweetInputs[0].focus();
    
    // Try multiple methods to set the text
    try {
      // Method 1: Set textContent
      tweetInputs[0].textContent = text;
      
      // Method 2: Set innerHTML
      tweetInputs[0].innerHTML = text;
      
      // Method 3: Use execCommand (for older browsers)
      document.execCommand('insertText', false, text);
      
      // Method 4: Use clipboard API and paste
      navigator.clipboard.writeText(text).then(() => {
        document.execCommand('paste');
      }).catch(e => console.error('Clipboard API failed:', e));
      
      // Dispatch multiple events to ensure Twitter's internal state updates
      tweetInputs[0].dispatchEvent(new Event('input', { bubbles: true }));
      tweetInputs[0].dispatchEvent(new Event('change', { bubbles: true }));
      tweetInputs[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'a', bubbles: true }));
      
      // Look for the tweet/reply button and click it after a delay
      setTimeout(async () => {
        const buttonClicked = await clickTweetButton();
        
        if (!buttonClicked) {
          console.log('Tweet button not clicked, trying again...');
          // If button wasn't clicked, try again with the next input method
          setTimeout(() => tryFillReplyText(text, attempt + 1), 1000);
        }
      }, 1000);
      
      return true;
    } catch (error) {
      console.error('Error filling tweet input:', error);
      // Try again with the next attempt
      setTimeout(() => tryFillReplyText(text, attempt + 1), 1000);
    }
  } else {
    console.log('Tweet input field not found, waiting and trying again...');
    // Wait longer for each attempt
    setTimeout(() => tryFillReplyText(text, attempt + 1), attempt * 1000);
  }
}

// Function to use AI to identify the tweet button
async function findTweetButtonWithAI() {
  console.log('Using AI to find the tweet button...');
  
  try {
    // Get the simplified HTML of the page
    const html = simplifyHTML(document.documentElement.outerHTML);
    
    // Send the HTML to the background script for AI analysis
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({
        action: 'analyzeTweetButton',
        html: html
      }, response => {
        if (response && response.success && response.selector) {
          console.log('AI identified tweet button selector:', response.selector);
          
          try {
            // Try to find the element using the AI-provided selector
            const element = document.querySelector(response.selector);
            if (element) {
              console.log('Found tweet button using AI selector:', element);
              resolve(element);
              return;
            }
          } catch (error) {
            console.error('Error using AI selector:', error);
          }
          
          // If we couldn't find the element using the selector, try using the XPath
          if (response.xpath) {
            console.log('Trying XPath from AI:', response.xpath);
            try {
              const result = document.evaluate(
                response.xpath, 
                document, 
                null, 
                XPathResult.FIRST_ORDERED_NODE_TYPE, 
                null
              );
              
              if (result.singleNodeValue) {
                console.log('Found tweet button using AI XPath:', result.singleNodeValue);
                resolve(result.singleNodeValue);
                return;
              }
            } catch (error) {
              console.error('Error using AI XPath:', error);
            }
          }
          
          // If we still couldn't find the element, try using the coordinates
          if (response.coordinates) {
            console.log('Trying coordinates from AI:', response.coordinates);
            const { x, y } = response.coordinates;
            
            // Find the element at these coordinates
            const element = document.elementFromPoint(x, y);
            if (element) {
              console.log('Found element at coordinates:', element);
              resolve(element);
              return;
            }
          }
        }
        
        console.log('AI could not identify the tweet button');
        resolve(null);
      });
    });
  } catch (error) {
    console.error('Error using AI to find tweet button:', error);
    return null;
  }
}

// Function to click the tweet/reply button
async function clickTweetButton() {
  console.log('Looking for tweet/reply button using AI...');
  
  // Try using AI to find the tweet button
  const aiButton = await findTweetButtonWithAI();
  if (aiButton) {
    console.log('Clicking tweet button found by AI...');
    simulateRealClick(aiButton);
    
    // Verify the click worked by checking for URL change or success message
    return new Promise(resolve => {
      setTimeout(async () => {
        // Check for success indicators
        const successMessage = Array.from(document.querySelectorAll('div, span')).some(el => 
          el.textContent && (
            el.textContent.includes('Your Tweet was sent') || 
            el.textContent.includes('Your reply was sent')
          )
        );
        
        // Also check for URL change to a tweet URL
        const isTweetUrl = window.location.href.includes('/status/');
        
        if (successMessage || isTweetUrl) {
          console.log('Tweet was successfully sent');
          // Request window close immediately after successful tweet
          chrome.runtime.sendMessage({ action: 'closeTwitterWindow' }, () => {
            resolve(true);
          });
        } else {
          console.log('No success message found after AI button click, trying one more time');
          simulateRealClick(aiButton);
          
          // Check again after a short delay
          setTimeout(async () => {
            const finalSuccessMessage = Array.from(document.querySelectorAll('div, span')).some(el => 
              el.textContent && (
                el.textContent.includes('Your Tweet was sent') || 
                el.textContent.includes('Your reply was sent')
              )
            );
            
            const finalTweetUrl = window.location.href.includes('/status/');
            
            if (finalSuccessMessage || finalTweetUrl) {
              console.log('Tweet was successfully sent on second attempt');
              // Request window close
              chrome.runtime.sendMessage({ action: 'closeTwitterWindow' }, () => {
                resolve(true);
              });
            } else {
              console.log('Tweet was not sent after two attempts');
              resolve(false);
            }
          }, 2000);
        }
      }, 2000);
    });
  }
  
  // If AI fails, give up
  console.log('AI could not find the tweet button, giving up');
  return false;
}

// Helper function to wait for tweet success indicators
function waitForTweetSuccess(timeout) {
  return new Promise(resolve => {
    setTimeout(() => {
      // Check for success message
      const successMessage = Array.from(document.querySelectorAll('div, span')).some(el => 
        el.textContent && (
          el.textContent.includes('Your Tweet was sent') || 
          el.textContent.includes('Your reply was sent')
        )
      );
      
      // Check for URL change to a tweet URL
      const isTweetUrl = window.location.href.includes('/status/');
      
      resolve(successMessage || isTweetUrl);
    }, timeout);
  });
}

// Main function to initialize the Twitter content script
function initTwitterContentScript() {
  console.log('BUZZ Reply Helper: Twitter content script initialized');
  
  // Add the extension badge
  const badge = addExtensionBadge();
  
  // Track the current URL
  let lastUrl = window.location.href;
  
  // Special handling for Twitter intent URLs
  if (window.location.href.includes('/intent/post') || 
      window.location.href.includes('/intent/tweet') || 
      window.location.href.includes('/intent/reply')) {
    console.log('Detected Twitter intent URL, using direct handling');
    handleTwitterIntent(badge);
    return; // Exit early as we're handling this specially
  }
  
  // Check if we should auto-reply
  chrome.storage.local.get(['autoReplyText', 'autoSubmit'], function(result) {
    if (result.autoReplyText) {
      console.log('Auto-reply text found:', result.autoReplyText);
      updateBadgeStatus(badge, 'replying');
      
      // Function to attempt auto-reply
      const attemptAutoReply = async (attempt = 1) => {
        console.log(`Attempting auto-reply (attempt ${attempt})...`);
        
        // First click the reply button
        const replyButtonClicked = await autoClickReplyButton();
        if (replyButtonClicked) {
          // Then fill in the reply text
          fillReplyText(result.autoReplyText);
        } else if (attempt < 5) {
          // If we couldn't find the reply button, try again after a delay
          const delay = attempt * 1000; // Increasing delay with each attempt
          console.log(`Reply button not found, trying again in ${delay}ms...`);
          setTimeout(() => attemptAutoReply(attempt + 1), delay);
        } else {
          console.log('Failed to auto-reply after multiple attempts');
          updateBadgeStatus(badge, 'error');
        }
      };
      
      // Wait a moment for the page to fully load, then start attempts
      setTimeout(() => attemptAutoReply(), 2000);
      
      // Clear the auto-reply text so we don't keep auto-replying on page refreshes
      chrome.storage.local.remove(['autoReplyText']);
    }
  });
  
  // Function to check for URL changes
  function checkForUrlChange() {
    const currentUrl = window.location.href;
    
    if (currentUrl !== lastUrl) {
      console.log('URL changed:', currentUrl);
      lastUrl = currentUrl;
      
      // If this is a reply URL, capture it
      if (isReplyUrl(currentUrl)) {
        updateBadgeStatus(badge, 'capturing');
        
        // Store the reply URL in session storage
        try {
          sessionStorage.setItem('lastTwitterReplyUrl', currentUrl);
        } catch (e) {
          console.error('Failed to store reply URL in session storage:', e);
        }
        
        // Send the reply URL to the background script
        chrome.runtime.sendMessage({
          action: 'captureReplyUrl',
          replyUrl: currentUrl
        }, response => {
          if (chrome.runtime.lastError) {
            console.error('Error sending reply URL to background script:', chrome.runtime.lastError);
            updateBadgeStatus(badge, 'error');
          } else {
            console.log('Sent reply URL to background script:', currentUrl);
            updateBadgeStatus(badge, 'captured');
            
            // Check if we should auto-close the window
            chrome.storage.local.get(['closeTab'], function(result) {
              if (result.closeTab) {
                console.log('Requesting window close from background script...');
                // Instead of trying to close the window directly, ask the background script to do it
                chrome.runtime.sendMessage({
                  action: 'closeTwitterWindow'
                });
              }
            });
          }
        });
      }
      
      // Special handling for Twitter intent URLs that might appear after navigation
      if (currentUrl.includes('/intent/post') || 
          currentUrl.includes('/intent/tweet') || 
          currentUrl.includes('/intent/reply')) {
        console.log('Detected Twitter intent URL after navigation, using direct handling');
        handleTwitterIntent(badge);
      }
    }
  }
  
  // Check for URL changes every 500ms
  setInterval(checkForUrlChange, 500);
  
  // Set up a MutationObserver to detect when a tweet is posted
  const tweetObserver = new MutationObserver(mutations => {
    for (const mutation of mutations) {
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        // Look for elements that indicate a tweet was posted
        const tweetPosted = Array.from(mutation.addedNodes).some(node => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            // Check for success messages or new tweet elements
            return node.textContent && (
              node.textContent.includes('Your Tweet was sent') || 
              node.textContent.includes('Your reply was sent')
            );
          }
          return false;
        });
        
        if (tweetPosted) {
          console.log('Tweet posted detected');
          updateBadgeStatus(badge, 'capturing');
          
          // Get the current URL, which should be the reply URL
          const replyUrl = window.location.href;
          
          if (isReplyUrl(replyUrl)) {
            // Store the reply URL in session storage
            try {
              sessionStorage.setItem('lastTwitterReplyUrl', replyUrl);
            } catch (e) {
              console.error('Failed to store reply URL in session storage:', e);
            }
            
            // Send the reply URL to the background script
            chrome.runtime.sendMessage({
              action: 'captureReplyUrl',
              replyUrl: replyUrl
            }, response => {
              if (chrome.runtime.lastError) {
                console.error('Error sending reply URL to background script:', chrome.runtime.lastError);
                updateBadgeStatus(badge, 'error');
              } else {
                console.log('Sent reply URL to background script:', replyUrl);
                updateBadgeStatus(badge, 'captured');
                
                // Check if we should auto-close the window
                chrome.storage.local.get(['closeTab'], function(result) {
                  if (result.closeTab) {
                    console.log('Requesting window close from background script...');
                    // Instead of trying to close the window directly, ask the background script to do it
                    chrome.runtime.sendMessage({
                      action: 'closeTwitterWindow'
                    });
                  }
                });
              }
            });
          }
        }
      }
    }
  });
  
  // Start observing the document body for changes
  tweetObserver.observe(document.body, { childList: true, subtree: true });
  
  // Listen for messages from the background script
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('Twitter content script received message:', message);
    
    if (message.action === 'autoReply') {
      updateBadgeStatus(badge, 'replying');
      
      // First click the reply button
      if (autoClickReplyButton()) {
        // Then fill in the reply text
        fillReplyText(message.text || 'Great post!');
      }
      
      sendResponse({ success: true });
    }
    
    return true; // Keep the message channel open for async responses
  });
}

// Special handler for Twitter intent URLs
function handleTwitterIntent(badge) {
  updateBadgeStatus(badge, 'replying');
  
  // Store the initial URL to detect redirects
  const initialUrl = window.location.href;
  const isIntentUrl = initialUrl.includes('/intent/');
  
  // Extract the reply text from the URL if present
  const urlParams = new URLSearchParams(window.location.search);
  const textParam = urlParams.get('text');
  
  // Get the auto-reply text from storage or use the URL text
  chrome.storage.local.get(['autoReplyText'], function(result) {
    const replyText = result.autoReplyText || textParam || 'Great post!';
    
    console.log('Using reply text:', replyText);
    
    // Function to check if we've been redirected from intent page
    const hasBeenRedirected = () => {
      const currentUrl = window.location.href;
      return isIntentUrl && !currentUrl.includes('/intent/');
    };
    
    // Function to check if we're on a successful tweet page and get the view link
    const isSuccessfulTweetPage = () => {
      const currentUrl = window.location.href;
      console.log('Checking success on URL:', currentUrl);
      
      // Check for success notification and View link
      const successElements = Array.from(document.querySelectorAll('div, span, a'));
      const successNotification = successElements.find(el => 
        el.textContent && (
          el.textContent.includes('Your Tweet was sent') || 
          el.textContent.includes('Your reply was sent')
        )
      );
      
      if (successNotification) {
        console.log('Found success notification:', successNotification.textContent);
        // Look for the View link near the success notification
        const viewLink = successElements.find(el => 
          el.tagName === 'A' && 
          el.textContent?.toLowerCase() === 'view' &&
          el.href?.includes('/status/')
        );
        
        if (viewLink) {
          console.log('Found View link:', viewLink.href);
          // Store this URL for later use
          chrome.storage.local.set({ lastReplyUrl: viewLink.href });
          return true;
        }
      }
      
      // Also check URL-based success indicators
      const isStatusUrl = currentUrl.includes('/status/');
      const isHomeUrl = currentUrl.includes('/home');
      console.log('URL checks - Status:', isStatusUrl, 'Home:', isHomeUrl);
      
      return isStatusUrl || isHomeUrl;
    };
    
    // Function to handle the intent page
    const handleIntent = async (attempt = 1, maxAttempts = 10) => {
      console.log(`Handle intent attempt ${attempt}/${maxAttempts}`);
      
      // First check if we've been redirected or succeeded
      if (hasBeenRedirected()) {
        console.log('Redirected from intent page to:', window.location.href);
        
        if (isSuccessfulTweetPage()) {
          console.log('Tweet was successful');
          updateBadgeStatus(badge, 'captured');
          
          // If we're on the home page or have a stored reply URL
          chrome.storage.local.get(['lastReplyUrl'], function(result) {
            console.log('Retrieved stored reply URL:', result.lastReplyUrl);
            
            if (result.lastReplyUrl) {
              console.log('Sending captured reply URL to background');
              chrome.runtime.sendMessage({
                action: 'captureReplyUrl',
                replyUrl: result.lastReplyUrl
              }, response => {
                console.log('Background response to URL capture:', response);
                // Request window close after URL is captured
                console.log('Requesting window close...');
                chrome.runtime.sendMessage({ 
                  action: 'closeTwitterWindow' 
                }, closeResponse => {
                  console.log('Window close response:', closeResponse);
                });
              });
            } else {
              console.warn('No reply URL found to capture');
              // Still close the window even if we don't have a URL
              chrome.runtime.sendMessage({ action: 'closeTwitterWindow' });
            }
          });
        } else {
          console.log('Redirected but not to a success page');
          updateBadgeStatus(badge, 'error');
          // Close window even on error
          chrome.runtime.sendMessage({ action: 'closeTwitterWindow' });
        }
        return;
      }
      
      if (attempt > maxAttempts) {
        console.error(`Failed to handle intent after ${maxAttempts} attempts`);
        updateBadgeStatus(badge, 'error');
        chrome.runtime.sendMessage({ action: 'closeTwitterWindow' });
        return;
      }
      
      console.log(`Intent handling attempt ${attempt}`);
      
      // For intent pages, the textarea is usually more straightforward to find
      const textareas = document.querySelectorAll('textarea');
      const contentEditables = document.querySelectorAll('[contenteditable="true"]');
      const tweetInputs = [...textareas, ...contentEditables];
      
      if (tweetInputs.length > 0) {
        console.log('Found tweet input on intent page:', tweetInputs[0]);
        
        // Focus and fill the input
        tweetInputs[0].focus();
        
        // Try multiple methods to set the text
        try {
          // For textareas
          if (tweetInputs[0].tagName === 'TEXTAREA') {
            tweetInputs[0].value = replyText;
          } else {
            // For contenteditable divs
            tweetInputs[0].textContent = replyText;
            tweetInputs[0].innerHTML = replyText;
          }
          
          // Dispatch events
          tweetInputs[0].dispatchEvent(new Event('input', { bubbles: true }));
          tweetInputs[0].dispatchEvent(new Event('change', { bubbles: true }));
          
          // Now find and click the tweet/reply button
          const buttons = document.querySelectorAll('button, [role="button"]');
          const tweetButtons = Array.from(buttons).filter(button => {
            const style = window.getComputedStyle(button);
            const text = button.textContent?.toLowerCase() || '';
            
            // Check for blue background or tweet/reply text
            return (
              style.backgroundColor.includes('rgb(29, 155, 240)') || // Twitter blue
              text.includes('tweet') || 
              text.includes('reply') || 
              text.includes('post')
            ) && button.getAttribute('aria-disabled') !== 'true';
          });
          
          if (tweetButtons.length > 0) {
            console.log('Found tweet button on intent page:', tweetButtons[0]);
            
            // Click the button
            simulateRealClick(tweetButtons[0]);
            
            // Set up a URL change observer
            let urlCheckInterval = setInterval(async () => {
              const currentUrl = window.location.href;
              console.log('Checking URL:', currentUrl);
              
              if (hasBeenRedirected()) {
                clearInterval(urlCheckInterval);
                console.log('Redirect detected to:', currentUrl);
                
                // Wait a moment for any View link to appear
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                // Look for View link first
                const viewLink = Array.from(document.querySelectorAll('a')).find(a => 
                  a.textContent?.toLowerCase() === 'view' && 
                  a.href?.includes('/status/')
                );
                
                if (viewLink) {
                  console.log('Found View link after redirect:', viewLink.href);
                  await handleTweetSuccess(viewLink.href);
                } else if (currentUrl.includes('/status/')) {
                  console.log('No View link but found status URL:', currentUrl);
                  await handleTweetSuccess(currentUrl);
                } else if (currentUrl.includes('/home')) {
                  console.log('Redirected to home, checking stored URL');
                  const result = await chrome.storage.local.get(['lastReplyUrl']);
                  if (result.lastReplyUrl) {
                    console.log('Using stored reply URL:', result.lastReplyUrl);
                    await handleTweetSuccess(result.lastReplyUrl);
                  } else {
                    console.warn('No stored URL found after home redirect');
                    await requestWindowClose('No URL but redirected to home');
                  }
                }
              }
            }, 500);
            
            // Set a timeout to clear the interval and close window anyway
            setTimeout(async () => {
              clearInterval(urlCheckInterval);
              console.log('URL check timeout reached');
              if (hasBeenRedirected()) {
                console.log('Window still open after redirect, forcing close');
                await requestWindowClose('Timeout after redirect');
              }
            }, 10000);
          }
        } catch (error) {
          console.error('Error handling intent page:', error);
        }
      }
      
      // If we get here and haven't been redirected, try again after a delay
      if (!hasBeenRedirected() && !isSuccessfulTweetPage()) {
        setTimeout(() => handleIntent(attempt + 1), 1000);
      }
    };
    
    // Start the intent handling process
    setTimeout(() => handleIntent(), 1000);
    
    // Clear the auto-reply text
    chrome.storage.local.remove(['autoReplyText']);
  });

  // Set up a continuous observer for the View link
  const viewLinkObserver = new MutationObserver((mutations, observer) => {
    for (const mutation of mutations) {
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        const viewLink = Array.from(mutation.addedNodes).find(node => 
          node.nodeType === Node.ELEMENT_NODE &&
          node.tagName === 'A' &&
          node.textContent?.toLowerCase() === 'view' &&
          node.href?.includes('/status/')
        );
        
        if (viewLink) {
          console.log('Found View link through observer:', viewLink.href);
          chrome.storage.local.set({ lastReplyUrl: viewLink.href }, () => {
            console.log('Stored reply URL:', viewLink.href);
          });
          observer.disconnect();
        }
      }
    }
  });

  // Start observing for View link
  viewLinkObserver.observe(document.body, { 
    childList: true, 
    subtree: true 
  });
}

// Function to request window close with logging
function requestWindowClose(reason) {
  console.log(`Requesting window close (Reason: ${reason})`);
  return new Promise((resolve) => {
    // First try using the background script
    chrome.runtime.sendMessage({ 
      action: 'closeTwitterWindow',
      reason: reason 
    }, response => {
      console.log('Window close request response:', response);
      if (chrome.runtime.lastError || !response?.success) {
        console.log('Background script close failed, trying window.close()');
        // If background script fails, try window.close() as fallback
        try {
          window.close();
          resolve(true);
        } catch (e) {
          console.error('Failed to close window:', e);
          resolve(false);
        }
      } else {
        resolve(true);
      }
    });
  });
}

// Function to check if window should auto-close
async function checkAutoClose() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['closeTab'], (result) => {
      resolve(result.closeTab !== false); // Default to true if not set
    });
  });
}

// Function to handle successful tweet
async function handleTweetSuccess(replyUrl) {
  console.log('Tweet was successful, extracted reply URL:', replyUrl);
  
  try {
    // Store the URL
    await new Promise((resolve) => {
      chrome.storage.local.set({ lastReplyUrl: replyUrl }, resolve);
    });

    // Send the URL to Edge Posting tab
    chrome.tabs.query({ url: [
      "http://localhost:*/buzz*",
      "https://edge-posting.vercel.app/buzz*",
      "https://*.vercel.app/buzz*"
    ]}, function(tabs) {
      if (tabs.length > 0) {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: 'replyUrlExtracted',
          replyUrl: replyUrl
        });
      }
    });
    
    // Check if we should auto-close
    const shouldClose = await checkAutoClose();
    if (shouldClose) {
      // Try multiple close methods
      const closed = await requestWindowClose('Tweet successful');
      if (!closed) {
        console.log('All close attempts failed');
      }
    }
  } catch (error) {
    console.error('Error handling tweet success:', error);
  }
}

// Initialize the content script
initTwitterContentScript(); 