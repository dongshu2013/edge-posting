/**
 * Content script for Edge Posting website
 * This script runs on the Edge Posting website and enhances it with auto-reply functionality.
 */

console.log('BUZZ Reply Helper: Edge Posting content script loaded');

// Add a badge to show the extension is active
addExtensionBadge();

// Listen for messages from the background script
if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('Edge Posting content script received message:', message);
    
    if (message.action === 'replyUrlExtracted') {
      console.log('Received reply URL from Twitter:', message.replyUrl);
      
      // Find the reply link input and fill it
      const replyLinkInput = document.querySelector('input[placeholder*="twitter.com"]');
      if (replyLinkInput) {
        replyLinkInput.value = message.replyUrl;
        // Trigger input event to ensure any listeners are notified
        replyLinkInput.dispatchEvent(new Event('input', { bubbles: true }));
        console.log('Prefilled reply link input with:', message.replyUrl);
      } else {
        console.log('Could not find reply link input to prefill');
      }
    }
    
    if (message.action === 'submitReply' && message.replyUrl && message.buzzId) {
      console.log('Submitting reply:', message);
      
      // Find and click the reply button for this buzz
      const replyButton = findReplyButton(message.buzzId);
      if (replyButton) {
        replyButton.click();
        
        // Wait for the modal to open
        setTimeout(() => {
          // Fill in the reply URL
          fillReplyUrl(message.replyUrl);
          
          // Check if we should auto-submit
          safeStorageGet(['autoSubmit'], (result) => {
            if (result.autoSubmit) {
              // Find and click the submit button
              const submitButton = findSubmitButton();
              if (submitButton) {
                submitButton.click();
                console.log('Auto-submitted reply');
              }
            }
          });
        }, 500);
        
        sendResponse({ success: true });
      } else {
        console.error('Could not find reply button for buzz:', message.buzzId);
        sendResponse({ success: false, error: 'Could not find reply button' });
      }
      
      return true;
    }
    
    if (message.action === 'openReplyModal' && message.buzzId) {
      console.log('Opening reply modal for buzz:', message.buzzId);
      
      // Find and click the reply button for this buzz
      const replyButton = findReplyButton(message.buzzId);
      if (replyButton) {
        replyButton.click();
        sendResponse({ success: true });
      } else {
        console.error('Could not find reply button for buzz:', message.buzzId);
        sendResponse({ success: false, error: 'Could not find reply button' });
      }
      
      return true;
    }
    
    if (message.action === 'updateAutoReplyVisibility') {
      console.log('Updating Auto Reply button visibility:', message.enabled);
      updateAutoReplyButtonsVisibility(message.enabled);
      sendResponse({ success: true });
      return true;
    }
  });
} else {
  console.warn('Chrome runtime API not available for message listening');
}

// Function to find a Reply & Earn button for a specific buzz ID
function findReplyButton(buzzId) {
  console.log('Looking for reply button for buzz ID:', buzzId);
  
  // Find all elements that might contain buzz cards
  const possibleContainers = document.querySelectorAll('div, article, section');
  
  for (const container of possibleContainers) {
    // Check if this container has the matching buzz ID
    let foundBuzzId = false;
    
    // Check data attributes
    for (const attr of container.attributes) {
      if ((attr.name.includes('id') || attr.name.includes('data')) && attr.value === buzzId) {
        foundBuzzId = true;
        break;
      }
    }
    
    // Check child elements with ID attributes
    if (!foundBuzzId) {
      const idElements = container.querySelectorAll('[id], [data-id]');
      for (const element of idElements) {
        const id = element.id || element.getAttribute('data-id');
        if (id === buzzId) {
          foundBuzzId = true;
          break;
        }
      }
    }
    
    // If we found the matching container, look for the Reply & Earn button
    if (foundBuzzId || buzzId.startsWith('buzz-')) {
      const buttons = container.querySelectorAll('button');
      const replyButton = Array.from(buttons).find(button => 
        button.textContent.toLowerCase().includes('reply') && 
        button.textContent.toLowerCase().includes('earn')
      );
      
      if (replyButton) {
        return replyButton;
      }
    }
  }
  
  // If we couldn't find the specific buzz, try a more general approach
  const allButtons = document.querySelectorAll('button');
  const replyButtons = Array.from(allButtons).filter(button => 
    button.textContent.toLowerCase().includes('reply') && 
    button.textContent.toLowerCase().includes('earn')
  );
  
  if (replyButtons.length > 0) {
    return replyButtons[0];
  }
  
  return null;
}

// Function to fill in the reply URL in the modal
function fillReplyUrl(replyUrl) {
  console.log('Filling reply URL:', replyUrl);
  
  // Find the input field for the reply URL
  const inputFields = document.querySelectorAll('input[type="text"], input[type="url"]');
  const replyUrlInput = Array.from(inputFields).find(input => {
    // Look for input fields that might be for the reply URL
    const placeholder = input.placeholder ? input.placeholder.toLowerCase() : '';
    const ariaLabel = input.getAttribute('aria-label') ? input.getAttribute('aria-label').toLowerCase() : '';
    const name = input.name ? input.name.toLowerCase() : '';
    
    return placeholder.includes('url') || 
           placeholder.includes('link') || 
           placeholder.includes('reply') || 
           ariaLabel.includes('url') || 
           ariaLabel.includes('link') || 
           ariaLabel.includes('reply') || 
           name.includes('url') || 
           name.includes('link') || 
           name.includes('reply');
  });
  
  if (replyUrlInput) {
    // Set the value
    replyUrlInput.value = replyUrl;
    
    // Dispatch events to trigger validation
    replyUrlInput.dispatchEvent(new Event('input', { bubbles: true }));
    replyUrlInput.dispatchEvent(new Event('change', { bubbles: true }));
    
    return true;
  }
  
  console.error('Could not find reply URL input field');
  return false;
}

// Function to find and click the submit button in the reply modal
function findSubmitButton() {
  // Look for buttons that might be the submit button
  const allButtons = document.querySelectorAll('button');
  const submitButton = Array.from(allButtons).find(button => {
    const text = button.textContent.toLowerCase();
    return text.includes('submit') || 
           text.includes('save') || 
           text.includes('confirm') || 
           text.includes('done');
  });
  
  if (submitButton) {
    return submitButton;
  }
  
  return null;
}

// Function to add a badge showing the extension is active
function addExtensionBadge() {
  // Create a badge element
  const badge = document.createElement('div');
  badge.id = 'buzz-helper-badge';
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
  `;
  badge.textContent = '🐝 BUZZ Helper Active';
  
  // Add hover effect
  badge.addEventListener('mouseenter', () => {
    badge.style.transform = 'translateY(-3px)';
    badge.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.15)';
  });
  
  badge.addEventListener('mouseleave', () => {
    badge.style.transform = 'translateY(0)';
    badge.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
  });
  
  // Add to the page
  document.body.appendChild(badge);
}

// Add custom styles for the extension
const style = document.createElement('style');
style.textContent = `
  .buzz-helper-button {
    background: linear-gradient(to right, #4f46e5, #7c3aed);
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 500;
    margin-top: 8px;
    transition: all 0.2s;
  }
  
  .buzz-helper-button:hover {
    opacity: 0.9;
    transform: translateY(-1px);
  }
`;
document.head.appendChild(style);

// Observe DOM changes to add auto-reply buttons to buzz requests
const observer = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
      // Look for buzz request elements
      const buzzElements = document.querySelectorAll('.buzz-request, [data-buzz-id]');
      
      if (buzzElements.length > 0) {
        console.log('Found buzz requests:', buzzElements.length);
        
        // Add our custom reply buttons to each buzz request
        buzzElements.forEach(buzzElement => {
          addAutoReplyButton(buzzElement);
        });
      }
      
      // Also intercept the "Reply & Earn XX BUZZ" buttons
      interceptReplyButtons();
    }
  }
});

// Start observing the document body
observer.observe(document.body, { childList: true, subtree: true });

// Function to intercept the "Reply & Earn XX BUZZ" buttons
function interceptReplyButtons() {
  // Find all buttons that contain "Reply & Earn" text
  const replyButtons = Array.from(document.querySelectorAll('button')).filter(button => 
    button.textContent.toLowerCase().includes('reply') && 
    button.textContent.toLowerCase().includes('earn') &&
    !button.classList.contains('intercepted')
  );
  
  console.log('Found Reply & Earn buttons to intercept:', replyButtons.length);
  
  replyButtons.forEach(button => {
    // Mark the button as intercepted to avoid double-binding
    button.classList.add('intercepted');
    
    // Add our click event listener instead of replacing the onclick handler
    button.addEventListener('click', function(event) {
      console.log('Reply & Earn button clicked');
      
      // Extract the tweet link and buzz ID
      const buzzElement = findBuzzElement(button);
      if (buzzElement) {
        console.log('Found parent buzz element:', buzzElement);
        
        const tweetLink = extractTweetLink(buzzElement);
        const buzzId = buzzElement.dataset.buzzId || extractBuzzId(buzzElement);
        const instructions = extractInstructions(buzzElement);
        const price = extractPrice(buzzElement) || extractPriceFromButton(button);
        
        console.log('Extracted info:', { tweetLink, buzzId, price });
        
        if (tweetLink) {
          // Prevent the default action to avoid navigating away
          event.preventDefault();
          event.stopPropagation();
          
          // Open Twitter in a popup window
          chrome.runtime.sendMessage({
            action: 'openTwitterWithReply',
            tweetLink: tweetLink,
            replyText: instructions || 'Great tweet!',
            buzzId: buzzId,
            price: price || 0
          });
          
          return false;
        } else {
          console.log('Could not extract tweet link from buzz element, letting default action proceed');
        }
      } else {
        console.log('Could not find parent buzz element, letting default action proceed');
      }
    });
  });
}

// Function to find the buzz element containing a button
function findBuzzElement(button) {
  // Try to find the parent container
  let current = button.parentElement;
  let maxDepth = 5; // Limit how far up we go
  
  while (current && maxDepth > 0) {
    // Check if this element has characteristics of a buzz card
    if (current.querySelector('iframe[src*="twitter"]') || 
        current.querySelector('a[href*="twitter.com"]') ||
        current.textContent.includes('BUZZ')) {
      return current;
    }
    
    current = current.parentElement;
    maxDepth--;
  }
  
  return null;
}

// Function to extract price from a button
function extractPriceFromButton(button) {
  const priceMatch = button.textContent.match(/(\d+(\.\d+)?)\s*BUZZ/i);
  if (priceMatch && priceMatch[1]) {
    return parseFloat(priceMatch[1]);
  }
  return null;
}

// Helper function to safely access chrome.storage
function safeStorageGet(keys, callback) {
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    chrome.storage.local.get(keys, callback);
  } else {
    console.warn('Chrome storage API not available');
    // Provide default values
    const defaults = {};
    if (Array.isArray(keys)) {
      keys.forEach(key => defaults[key] = null);
    } else if (typeof keys === 'object') {
      Object.assign(defaults, keys);
    } else if (typeof keys === 'string') {
      defaults[keys] = null;
    }
    callback(defaults);
  }
}

// Helper function to safely set chrome.storage
function safeStorageSet(items, callback) {
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    chrome.storage.local.set(items, callback);
  } else {
    console.warn('Chrome storage API not available');
    if (callback) callback();
  }
}

// Function to add an auto-reply button to a buzz request
function addAutoReplyButton(buzzElement) {
  // Check if we've already added a button to this element
  if (buzzElement.querySelector('.buzz-helper-button')) {
    console.log('Auto Reply button already exists for this element');
    return;
  }
  
  // Try to extract the buzz ID
  const buzzId = buzzElement.dataset.buzzId || extractBuzzId(buzzElement);
  
  if (!buzzId) {
    console.log('Missing required buzz ID for element:', buzzElement);
    return;
  }
  
  // Find the original Reply & Earn button
  const replyButton = findOriginalReplyButton(buzzElement);
  
  if (!replyButton) {
    console.log('Could not find original Reply & Earn button for buzz:', buzzId);
    return;
  }
  
  // Create the auto-reply button
  const autoReplyButton = document.createElement('button');
  autoReplyButton.className = 'buzz-helper-button';
  autoReplyButton.textContent = 'Auto Reply';
  autoReplyButton.setAttribute('data-buzz-id', buzzId);
  
  // Apply the exact same styling as the other buttons
  autoReplyButton.style.cssText = `
    background: linear-gradient(to right, rgb(99, 102, 241), rgb(126, 34, 206));
    color: white;
    font-size: 0.875rem;
    font-weight: 500;
    padding: 0.5rem 1rem;
    border-radius: 0.75rem;
    border: none;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    transition-property: all;
    transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
    transition-duration: 200ms;
    height: 40px;
    line-height: 1;
    box-sizing: border-box;
    white-space: nowrap;
  `;
  
  // Add hover effect
  autoReplyButton.addEventListener('mouseenter', () => {
    autoReplyButton.style.background = 'linear-gradient(to right, rgb(79, 70, 229), rgb(124, 58, 237))';
  });
  
  autoReplyButton.addEventListener('mouseleave', () => {
    autoReplyButton.style.background = 'linear-gradient(to right, rgb(99, 102, 241), rgb(126, 34, 206))';
  });
  
  // Add click handler
  autoReplyButton.addEventListener('click', async () => {
    console.log('Auto Reply button clicked for buzz:', buzzId);
    
    // Extract the tweet link and other information
    const tweetLink = extractTweetLink(buzzElement);
    const instructions = extractInstructions(buzzElement);
    const price = extractPrice(buzzElement);
    
    if (!tweetLink) {
      console.error('Could not extract tweet link from buzz card');
      alert('Could not extract tweet link from buzz card. Please try the regular Reply button.');
      return;
    }
    
    console.log('Extracted tweet link:', tweetLink);
    console.log('Extracted instructions:', instructions);
    console.log('Extracted price:', price);
    
    // Generate a reply text based on the instructions
    const replyText = generateReplyText(instructions);
    
    // Send a message to the background script to open Twitter with auto-reply
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
      chrome.runtime.sendMessage({
        action: 'openTwitterWithReply',
        tweetLink: tweetLink,
        replyText: replyText,
        buzzId: buzzId,
        price: price
      }, response => {
        console.log('Received response from background script:', response);
      });
    } else {
      console.warn('Chrome runtime API not available');
      // Fallback: open the tweet link in a new window
      window.open(tweetLink, '_blank');
    }
  });
  
  // Add the button next to the original button
  replyButton.parentNode.insertBefore(autoReplyButton, replyButton.nextSibling);
  
  // Add a small margin to separate the buttons
  autoReplyButton.style.marginLeft = '8px';
  
  console.log('Added Auto Reply button for buzz:', buzzId);
}

// Function to generate a reply text based on instructions
function generateReplyText(instructions) {
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

// Function to find the original Reply & Earn button
function findOriginalReplyButton(element) {
  // Look for buttons with "Reply & Earn" text
  const buttons = Array.from(element.querySelectorAll('button'));
  const replyButton = buttons.find(button => 
    button.textContent.toLowerCase().includes('reply') && 
    button.textContent.toLowerCase().includes('earn')
  );
  
  if (replyButton) {
    console.log('Found original Reply & Earn button:', replyButton);
    return replyButton;
  }
  
  // If not found in the element, look in parent elements
  let parent = element.parentElement;
  for (let i = 0; i < 3 && parent; i++) {
    const parentButtons = Array.from(parent.querySelectorAll('button'));
    const parentReplyButton = parentButtons.find(button => 
      button.textContent.toLowerCase().includes('reply') && 
      button.textContent.toLowerCase().includes('earn')
    );
    
    if (parentReplyButton) {
      console.log('Found original Reply & Earn button in parent:', parentReplyButton);
      return parentReplyButton;
    }
    
    parent = parent.parentElement;
  }
  
  console.log('Could not find original Reply & Earn button');
  return null;
}

// Function to update the visibility of all Auto Reply buttons
function updateAutoReplyButtonsVisibility(enabled) {
  const buttonContainers = document.querySelectorAll('.buzz-helper-container');
  buttonContainers.forEach(container => {
    container.style.display = enabled ? 'flex' : 'none';
  });
}

// Function to extract buzz ID from an element
function extractBuzzId(element) {
  // Look for data attributes that might contain the ID
  for (const attr of element.attributes) {
    if (attr.name.includes('id') || attr.name.includes('data')) {
      const value = attr.value;
      // Check if it looks like a UUID
      if (value && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) {
        return value;
      }
    }
  }
  
  // Look for elements with ID attributes
  const idElements = element.querySelectorAll('[id], [data-id]');
  for (const element of idElements) {
    const id = element.id || element.getAttribute('data-id');
    if (id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
      return id;
    }
  }
  
  // If we can't find a proper ID, generate one based on content hash
  return 'buzz-' + Math.random().toString(36).substring(2, 15);
}

// Function to extract tweet link from an element
function extractTweetLink(element) {
  // Look for iframe with Twitter embed
  const iframe = element.querySelector('iframe[src*="twitter"], iframe[src*="x.com"]');
  if (iframe) {
    return iframe.src;
  }
  
  // Look for links to Twitter
  const twitterLinks = element.querySelectorAll('a[href*="twitter.com"], a[href*="x.com"]');
  if (twitterLinks.length > 0) {
    return twitterLinks[0].href;
  }
  
  // Look for text that looks like a Twitter URL
  const textContent = element.textContent;
  const twitterUrlMatch = textContent.match(/(https?:\/\/(twitter|x)\.com\/[^\s]+)/);
  if (twitterUrlMatch) {
    return twitterUrlMatch[1];
  }
  
  return null;
}

// Function to extract instructions from an element
function extractInstructions(element) {
  // Look for elements that might contain instructions
  const possibleInstructionElements = element.querySelectorAll('p, div, span');
  
  for (const element of possibleInstructionElements) {
    const text = element.textContent.trim();
    // Instructions are usually longer text blocks
    if (text.length > 30 && !text.includes('http') && !text.includes('BUZZ')) {
      return text;
    }
  }
  
  return 'No instructions found';
}

// Function to extract price from an element
function extractPrice(element) {
  // Look for text that contains BUZZ and a number
  const textContent = element.textContent;
  const priceMatch = textContent.match(/(\d+(\.\d+)?)\s*BUZZ/i);
  if (priceMatch) {
    return priceMatch[1];
  }
  
  // Look for elements that might contain the price
  const possiblePriceElements = element.querySelectorAll('span, div, p');
  for (const element of possiblePriceElements) {
    const text = element.textContent.trim();
    const match = text.match(/(\d+(\.\d+)?)\s*BUZZ/i);
    if (match) {
      return match[1];
    }
  }
  
  return 'Unknown';
}

// Run initial setup
setTimeout(() => {
  console.log('BUZZ Reply Helper: Running initial setup');
  
  // Intercept existing reply buttons
  interceptReplyButtons();
  
  // Check if Auto Reply buttons should be added
  safeStorageGet(['enableAutoReply'], (result) => {
    // Default to true if not set
    const enableAutoReply = result.enableAutoReply !== false;
    
    if (enableAutoReply) {
      // Add auto-reply buttons to existing buzz requests
      // Try multiple selectors to find buzz elements
      const selectors = [
        '.rounded-2xl.transition-all', // Main container
        '.buzz-request', // Older class name
        '[data-buzz-id]' // Elements with buzz ID
      ];
      
      // Try each selector
      for (const selector of selectors) {
        try {
          const elements = document.querySelectorAll(selector);
          console.log(`Found ${elements.length} elements with selector: ${selector}`);
          
          if (elements.length > 0) {
            elements.forEach(element => {
              // Check if this is likely a buzz card
              const hasTweetEmbed = element.querySelector('iframe[src*="twitter.com"]') || 
                                   element.querySelector('a[href*="twitter.com"]');
              const hasReplyButton = Array.from(element.querySelectorAll('button')).some(btn => 
                btn.textContent.toLowerCase().includes('reply') && 
                btn.textContent.toLowerCase().includes('earn')
              );
              
              if (hasTweetEmbed || hasReplyButton) {
                console.log('Found valid buzz card:', element);
                addAutoReplyButton(element);
              }
            });
          }
        } catch (error) {
          console.error(`Error with selector ${selector}:`, error);
        }
      }
      
      // If we still haven't found any buzz elements, try a more generic approach
      const allDivs = document.querySelectorAll('div');
      console.log(`Checking ${allDivs.length} divs for potential buzz cards`);
      
      let foundBuzzCards = 0;
      allDivs.forEach(div => {
        // Only check divs that might be containers
        if (div.children.length > 3) {
          const hasTweetEmbed = div.querySelector('iframe[src*="twitter.com"]') || 
                               div.querySelector('a[href*="twitter.com"]');
          
          // Check for Reply & Earn buttons
          const hasReplyButton = Array.from(div.querySelectorAll('button')).some(btn => 
            btn.textContent.toLowerCase().includes('reply') && 
            btn.textContent.toLowerCase().includes('earn')
          );
          
          if (hasTweetEmbed && hasReplyButton) {
            console.log('Found potential buzz card using generic approach:', div);
            addAutoReplyButton(div);
            foundBuzzCards++;
          }
        }
      });
      
      console.log(`Found ${foundBuzzCards} potential buzz cards using generic approach`);
      
      if (foundBuzzCards === 0) {
        console.log('No buzz elements found on initial load');
      }
    } else {
      console.log('Auto Reply buttons disabled by user setting');
    }
  });
}, 2000); // Increased timeout to 2 seconds to ensure page is fully loaded

// Intercept window.open to capture the tweet link
const originalWindowOpen = window.open;
window.open = function(url, target, features) {
  console.log('Intercepted window.open call with URL:', url);
  
  // Store the URL for later use
  if (url && (url.includes('twitter.com') || url.includes('x.com'))) {
    console.log('Storing tweet link:', url);
    localStorage.setItem('lastTweetLink', url);
    sessionStorage.setItem('lastTweetLink', url);
  }
  
  // Call the original function
  return originalWindowOpen.call(this, url, target, features);
};

// Initialize the content script
function initEdgePostingContentScript() {
  console.log('BUZZ Reply Helper: Edge Posting content script initialized');
}

// Initialize the content script
initEdgePostingContentScript(); 