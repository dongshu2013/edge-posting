/**
 * Content script for Edge Posting website
 * This script runs on the Edge Posting website and enhances it with auto-reply functionality.
 */

console.log('BUZZ Reply Helper: Edge Posting content script loaded');

// Add a badge to show the extension is active
addExtensionBadge();

// Listen for messages from the background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Edge Posting content script received message:', message);
  
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
        chrome.storage.local.get(['autoSubmit'], (result) => {
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
});

// Function to find the reply button for a specific buzz
function findReplyButton(buzzId) {
  // Try to find by data attribute first
  let replyButton = document.querySelector(`[data-buzz-id="${buzzId}"] .reply-button`);
  
  // If not found, try to find by other means
  if (!replyButton) {
    // Look for buttons that might be reply buttons
    const buttons = Array.from(document.querySelectorAll('button'));
    
    // Find buttons that contain "Reply" or "Earn" text and are near the buzz ID
    for (const button of buttons) {
      const buttonText = button.textContent.toLowerCase();
      if ((buttonText.includes('reply') || buttonText.includes('earn')) && 
          isNearBuzzId(button, buzzId)) {
        replyButton = button;
        break;
      }
    }
  }
  
  return replyButton;
}

// Function to check if an element is near a buzz ID
function isNearBuzzId(element, buzzId) {
  // Check if the element or any of its ancestors contain the buzz ID
  let current = element;
  for (let i = 0; i < 5; i++) { // Check up to 5 levels up
    if (!current) break;
    
    // Check if the element contains the buzz ID
    if (current.textContent && current.textContent.includes(buzzId)) {
      return true;
    }
    
    // Check if the element has a data attribute with the buzz ID
    if (current.dataset && Object.values(current.dataset).some(value => value === buzzId)) {
      return true;
    }
    
    current = current.parentElement;
  }
  
  return false;
}

// Function to fill in the reply URL in the modal
function fillReplyUrl(replyUrl) {
  // Find the input field for the reply URL
  const replyInput = document.querySelector('input[name="replyLink"]') || 
                     document.querySelector('input[placeholder*="reply"]') ||
                     document.querySelector('input[type="url"]');
  
  if (replyInput) {
    // Set the value
    replyInput.value = replyUrl;
    
    // Dispatch an input event to trigger any listeners
    replyInput.dispatchEvent(new Event('input', { bubbles: true }));
    
    console.log('Filled in reply URL:', replyUrl);
    return true;
  } else {
    console.error('Could not find reply URL input');
    return false;
  }
}

// Function to find the submit button in the reply modal
function findSubmitButton() {
  // Try to find by type first
  let submitButton = document.querySelector('button[type="submit"]');
  
  // If not found, try to find by text content
  if (!submitButton) {
    const buttons = Array.from(document.querySelectorAll('button'));
    
    for (const button of buttons) {
      const buttonText = button.textContent.toLowerCase();
      if (buttonText.includes('submit') || buttonText.includes('confirm')) {
        submitButton = button;
        break;
      }
    }
  }
  
  return submitButton;
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
    
    // Store the original click handler
    const originalClick = button.onclick;
    
    // Replace with our custom handler
    button.onclick = function(event) {
      event.preventDefault();
      event.stopPropagation();
      
      console.log('Intercepted Reply & Earn button click');
      
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
          // Open Twitter in a popup window
          chrome.runtime.sendMessage({
            action: 'openTwitter',
            tweetUrl: tweetLink,
            replyText: instructions || 'Great tweet!',
            buzzId: buzzId,
            price: price || 0
          });
          
          return false;
        } else {
          console.log('Could not extract tweet link from buzz element');
        }
      } else {
        console.log('Could not find parent buzz element');
      }
      
      // If we couldn't extract the necessary info, fall back to the original handler
      if (originalClick) {
        return originalClick.call(this, event);
      }
    };
  });
}

// Function to find the buzz element from a button
function findBuzzElement(button) {
  // Check up to 5 levels up
  let current = button;
  for (let i = 0; i < 5; i++) {
    if (!current) break;
    
    // Check if this element has a data-buzz-id attribute
    if (current.dataset && current.dataset.buzzId) {
      return current;
    }
    
    // Check if this element has the buzz-request class or is a rounded-2xl div
    if (current.classList && 
        (current.classList.contains('buzz-request') || 
         (current.classList.contains('rounded-2xl') && current.classList.contains('transition-all')))) {
      return current;
    }
    
    current = current.parentElement;
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

// Function to add an auto-reply button to a buzz request
function addAutoReplyButton(buzzElement) {
  // Check if we've already added a button to this element
  if (buzzElement.querySelector('.buzz-helper-button')) {
    return;
  }
  
  // Try to extract the buzz information
  const buzzId = buzzElement.dataset.buzzId || extractBuzzId(buzzElement);
  const tweetLink = extractTweetLink(buzzElement);
  const instructions = extractInstructions(buzzElement);
  const price = extractPrice(buzzElement);
  
  if (!buzzId || !tweetLink) {
    console.log('Missing required buzz information for element:', buzzElement);
    return;
  }
  
  // Create the auto-reply button
  const replyButton = document.createElement('button');
  replyButton.className = 'buzz-helper-button';
  replyButton.textContent = 'Auto Reply';
  
  // Apply the exact same styling as the other buttons
  replyButton.style.cssText = `
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
  replyButton.addEventListener('mouseenter', () => {
    replyButton.style.background = 'linear-gradient(to right, rgb(79, 70, 229), rgb(124, 58, 237))';
  });
  
  replyButton.addEventListener('mouseleave', () => {
    replyButton.style.background = 'linear-gradient(to right, rgb(99, 102, 241), rgb(126, 34, 206))';
  });
  
  // Add click handler
  replyButton.addEventListener('click', () => {
    // Send a message to the background script to open Twitter
    chrome.runtime.sendMessage({
      action: 'openTwitter',
      tweetUrl: tweetLink,
      replyText: instructions || 'Great tweet!',
      buzzId: buzzId,
      price: price || 0
    });
  });
  
  // Find the right place to add the button
  // Look for the container with the "Reply & Earn" button
  const actionsContainer = buzzElement.querySelector('.flex-col.sm\\:flex-row');
  
  if (actionsContainer) {
    // Create a div to hold our button (matching the structure of the Reply button)
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'flex-shrink-0';
    buttonContainer.style.display = 'flex';
    buttonContainer.style.alignItems = 'center';
    buttonContainer.appendChild(replyButton);
    
    // Add the button container to the actions container
    actionsContainer.appendChild(buttonContainer);
    console.log('Added Auto Reply button to buzz card:', buzzId);
  } else {
    // Fallback: just add to the buzz element
    buzzElement.appendChild(replyButton);
    console.log('Added Auto Reply button (fallback) to buzz card:', buzzId);
  }
}

// Helper function to extract buzz ID from an element
function extractBuzzId(element) {
  // Check for ID in data attributes
  for (const key in element.dataset) {
    if (key.toLowerCase().includes('id') || key.toLowerCase().includes('buzz')) {
      return element.dataset[key];
    }
  }
  
  // Check for ID in element attributes
  for (const attr of element.attributes) {
    if (attr.name.toLowerCase().includes('id') && attr.value) {
      return attr.value;
    }
  }
  
  // Check for ID in URL
  const idMatch = window.location.href.match(/\/buzz\/([a-zA-Z0-9-_]+)/);
  if (idMatch && idMatch[1]) {
    return idMatch[1];
  }
  
  // Check for ID in child links
  const viewRepliesLink = element.querySelector('a[href^="/buzz/"]');
  if (viewRepliesLink) {
    const hrefParts = viewRepliesLink.getAttribute('href').split('/');
    return hrefParts[hrefParts.length - 1];
  }
  
  return null;
}

// Helper function to extract tweet link from an element
function extractTweetLink(element) {
  // Look for links to Twitter
  const twitterLink = element.querySelector('a[href*="twitter.com"]') || 
                      element.querySelector('a[href*="x.com"]');
  
  if (twitterLink) {
    return twitterLink.href;
  }
  
  // Check for tweet link in iframe src
  const tweetFrame = element.querySelector('iframe[src*="twitter.com"]') || 
                     element.querySelector('iframe[src*="platform.twitter.com"]');
  
  if (tweetFrame) {
    const tweetId = tweetFrame.src.match(/id=([0-9]+)/);
    if (tweetId && tweetId[1]) {
      return `https://twitter.com/i/status/${tweetId[1]}`;
    }
  }
  
  return null;
}

// Helper function to extract instructions from an element
function extractInstructions(element) {
  // Look for elements that might contain the instructions
  const instructionsElement = element.querySelector('p.text-sm.break-words') || 
                             element.querySelector('.instructions');
  
  if (instructionsElement) {
    return instructionsElement.textContent.trim();
  }
  
  return null;
}

// Helper function to extract price from an element
function extractPrice(element) {
  // Look for elements that might contain the price
  const priceElement = element.querySelector('.price') || 
                       element.querySelector('[data-price]');
  
  if (priceElement) {
    // Extract the number from the text
    const priceMatch = priceElement.textContent.match(/(\d+(\.\d+)?)/);
    if (priceMatch && priceMatch[1]) {
      return parseFloat(priceMatch[1]);
    }
  }
  
  // Look for text that mentions BUZZ tokens
  const buzzText = element.textContent.match(/(\d+(\.\d+)?)\s*BUZZ/i);
  if (buzzText && buzzText[1]) {
    return parseFloat(buzzText[1]);
  }
  
  return null;
}

// Run initial setup
setTimeout(() => {
  console.log('BUZZ Reply Helper: Running initial setup');
  
  // Intercept existing reply buttons
  interceptReplyButtons();
  
  // Add auto-reply buttons to existing buzz requests
  // Updated selectors to match the actual HTML structure
  const existingBuzzElements = document.querySelectorAll('.rounded-2xl.transition-all, .buzz-request, [data-buzz-id]');
  
  console.log('Found potential buzz elements:', existingBuzzElements.length);
  
  if (existingBuzzElements.length > 0) {
    existingBuzzElements.forEach(buzzElement => {
      // Additional check to ensure we're targeting the right elements
      if (buzzElement.querySelector('iframe[src*="twitter.com"]') || 
          buzzElement.querySelector('a[href*="twitter.com"]')) {
        console.log('Found valid buzz card:', buzzElement);
        addAutoReplyButton(buzzElement);
      }
    });
  } else {
    console.log('No buzz elements found on initial load');
  }
}, 2000); // Increased timeout to 2 seconds to ensure page is fully loaded 