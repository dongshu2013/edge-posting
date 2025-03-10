import { addExtensionBadge } from '../../lib/ui';
import { safeStorageGet, safeStorageSet } from '../../lib/storage';
import { generateReplyText } from '../../lib/twitter';
import { createStyledButton } from '../../lib/ui';
import { BuzzCard } from '../../lib/types';

console.log('BUZZ Reply Helper: Edge Posting content script loaded');

// Add a badge to show the extension is active
addExtensionBadge();

// Listen for messages from the background script
if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
  chrome.runtime.onMessage.addListener((message: any, sender: chrome.runtime.MessageSender, sendResponse: (response?: any) => void) => {
    console.log('Edge Posting content script received message:', message);
    
    if (message.action === 'replyUrlExtracted') {
      console.log('Received reply URL from Twitter:', message.replyUrl);
      
      // Find the reply link input and fill it
      const replyLinkInput = document.querySelector('input[placeholder*="twitter.com"]');
      if (replyLinkInput) {
        console.log('Found reply link input, filling with URL:', message.replyUrl);
        (replyLinkInput as HTMLInputElement).value = message.replyUrl;
        
        // Trigger input event to ensure any listeners are notified
        replyLinkInput.dispatchEvent(new Event('input', { bubbles: true }));
        console.log('Dispatched input event for reply link input');
        
        // Also try change event
        replyLinkInput.dispatchEvent(new Event('change', { bubbles: true }));
        console.log('Dispatched change event for reply link input');
        
        console.log('Prefilled reply link input with:', message.replyUrl);
        
        // Find and click the submit button if auto-submit is enabled
        safeStorageGet<{ autoSubmit?: boolean }>(['autoSubmit']).then((result) => {
          console.log('Auto-submit setting:', result.autoSubmit);
          
          if (result.autoSubmit !== false) {
            console.log('Auto-submit is enabled, looking for submit button');
            // Wait a moment for any validation to complete
            setTimeout(() => {
              const submitButton = findSubmitButton();
              if (submitButton) {
                console.log('Found submit button, clicking it:', submitButton);
                submitButton.click();
                console.log('Clicked submit button');
              } else {
                console.log('Could not find submit button');
              }
            }, 500);
          }
        });
        
        // Send a response back to the background script
        console.log('Sending success response back to background script');
        sendResponse({ success: true, message: 'Reply URL filled successfully' });
      } else {
        console.log('Could not find reply link input to prefill');
        
        // Try to find any input that might be for URLs
        const allInputs = document.querySelectorAll('input[type="text"], input[type="url"]');
        console.log('Found', allInputs.length, 'text/url inputs on the page');
        
        // Log all inputs for debugging
        allInputs.forEach((input, index) => {
          console.log(`Input #${index}:`, {
            type: (input as HTMLInputElement).type,
            placeholder: (input as HTMLInputElement).placeholder,
            name: (input as HTMLInputElement).name,
            id: (input as HTMLInputElement).id,
            ariaLabel: input.getAttribute('aria-label')
          });
        });
        
        sendResponse({ success: false, message: 'Could not find reply link input' });
      }
      
      return true; // Keep the message channel open for async response
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
          safeStorageGet<{ autoSubmit?: boolean }>(['autoSubmit']).then((result) => {
            if (result.autoSubmit !== false) {
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
    
    return true;
  });
} else {
  console.warn('Chrome runtime API not available for message listening');
}

// Function to find a Reply & Earn button for a specific buzz ID
function findReplyButton(buzzId: string): HTMLElement | null {
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
        button.textContent?.toLowerCase().includes('reply') && 
        button.textContent?.toLowerCase().includes('earn')
      );
      
      if (replyButton) {
        return replyButton as HTMLElement;
      }
    }
  }
  
  // If we couldn't find the specific buzz, try a more general approach
  const allButtons = document.querySelectorAll('button');
  const replyButtons = Array.from(allButtons).filter(button => 
    button.textContent?.toLowerCase().includes('reply') && 
    button.textContent?.toLowerCase().includes('earn')
  );
  
  if (replyButtons.length > 0) {
    return replyButtons[0] as HTMLElement;
  }
  
  return null;
}

// Function to fill in the reply URL in the modal
function fillReplyUrl(replyUrl: string): boolean {
  console.log('Filling reply URL:', replyUrl);
  
  // Find the input field for the reply URL
  const inputFields = document.querySelectorAll('input[type="text"], input[type="url"]');
  console.log('Found', inputFields.length, 'potential input fields for reply URL');
  
  const replyUrlInput = Array.from(inputFields).find(input => {
    // Look for input fields that might be for the reply URL
    const inputElement = input as HTMLInputElement;
    const placeholder = inputElement.placeholder ? inputElement.placeholder.toLowerCase() : '';
    const ariaLabel = input.getAttribute('aria-label') ? input.getAttribute('aria-label')!.toLowerCase() : '';
    const name = inputElement.name ? inputElement.name.toLowerCase() : '';
    
    const isLikelyReplyInput = placeholder.includes('url') || 
           placeholder.includes('link') || 
           placeholder.includes('reply') || 
           placeholder.includes('twitter') ||
           ariaLabel.includes('url') || 
           ariaLabel.includes('link') || 
           ariaLabel.includes('reply') ||
           ariaLabel.includes('twitter') ||
           name.includes('url') || 
           name.includes('link') || 
           name.includes('reply') ||
           name.includes('twitter');
    
    if (isLikelyReplyInput) {
      console.log('Found likely reply URL input:', {
        placeholder,
        ariaLabel,
        name,
        id: input.id
      });
    }
    
    return isLikelyReplyInput;
  });
  
  if (replyUrlInput) {
    console.log('Found reply URL input, filling with:', replyUrl);
    
    // Set the value
    (replyUrlInput as HTMLInputElement).value = replyUrl;
    
    // Dispatch events to trigger validation
    replyUrlInput.dispatchEvent(new Event('input', { bubbles: true }));
    replyUrlInput.dispatchEvent(new Event('change', { bubbles: true }));
    
    console.log('Dispatched input and change events for reply URL input');
    return true;
  }
  
  console.error('Could not find reply URL input field');
  return false;
}

// Function to find and click the submit button in the reply modal
function findSubmitButton(): HTMLElement | null {
  // Look for buttons that might be the submit button
  const allButtons = document.querySelectorAll('button');
  const submitButton = Array.from(allButtons).find(button => {
    const text = button.textContent?.toLowerCase() || '';
    return text.includes('submit') || 
           text.includes('save') || 
           text.includes('confirm') || 
           text.includes('done');
  });
  
  if (submitButton) {
    return submitButton as HTMLElement;
  }
  
  return null;
}

// Function to add an auto-reply button to a buzz request
function addAutoReplyButton(buzzElement: HTMLElement) {
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
  
  // Extract the tweet link and other information
  const tweetLink = extractTweetLink(buzzElement);
  const instructions = extractInstructions(buzzElement);
  const price = extractPrice(buzzElement);
  
  if (!tweetLink) {
    console.log('Could not extract tweet link from buzz card');
    return;
  }
  
  // Create the auto-reply button
  const autoReplyButton = createStyledButton('Auto Reply', () => {
    console.log('Auto Reply button clicked for buzz:', buzzId);
    
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
  replyButton.parentNode!.insertBefore(autoReplyButton, replyButton.nextSibling);
  
  // Add a small margin to separate the buttons
  autoReplyButton.style.marginLeft = '8px';
  
  console.log('Added Auto Reply button for buzz:', buzzId);
}

// Function to find the original Reply & Earn button
function findOriginalReplyButton(element: HTMLElement): HTMLElement | null {
  // Look for buttons with "Reply & Earn" text
  const buttons = Array.from(element.querySelectorAll('button'));
  const replyButton = buttons.find(button => 
    button.textContent?.toLowerCase().includes('reply') && 
    button.textContent?.toLowerCase().includes('earn')
  );
  
  if (replyButton) {
    console.log('Found original Reply & Earn button:', replyButton);
    return replyButton as HTMLElement;
  }
  
  // If not found in the element, look in parent elements
  let parent = element.parentElement;
  for (let i = 0; i < 3 && parent; i++) {
    const parentButtons = Array.from(parent.querySelectorAll('button'));
    const parentReplyButton = parentButtons.find(button => 
      button.textContent?.toLowerCase().includes('reply') && 
      button.textContent?.toLowerCase().includes('earn')
    );
    
    if (parentReplyButton) {
      console.log('Found original Reply & Earn button in parent:', parentReplyButton);
      return parentReplyButton as HTMLElement;
    }
    
    parent = parent.parentElement;
  }
  
  console.log('Could not find original Reply & Earn button');
  return null;
}

// Function to update the visibility of all Auto Reply buttons
function updateAutoReplyButtonsVisibility(enabled: boolean) {
  const autoReplyButtons = document.querySelectorAll('.buzz-helper-button');
  autoReplyButtons.forEach(button => {
    (button as HTMLElement).style.display = enabled ? 'inline-flex' : 'none';
  });
}

// Function to extract buzz ID from an element
function extractBuzzId(element: HTMLElement): string | null {
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
function extractTweetLink(element: HTMLElement): string | null {
  // Look for iframe with Twitter embed
  const iframe = element.querySelector('iframe[src*="twitter"], iframe[src*="x.com"]');
  if (iframe) {
    return iframe.getAttribute('src');
  }
  
  // Look for links to Twitter
  const twitterLinks = element.querySelectorAll('a[href*="twitter.com"], a[href*="x.com"]');
  if (twitterLinks.length > 0) {
    return twitterLinks[0].getAttribute('href');
  }
  
  // Look for text that looks like a Twitter URL
  const textContent = element.textContent || '';
  const twitterUrlMatch = textContent.match(/(https?:\/\/(twitter|x)\.com\/[^\s]+)/);
  if (twitterUrlMatch) {
    return twitterUrlMatch[1];
  }
  
  return null;
}

// Function to extract instructions from an element
function extractInstructions(element: HTMLElement): string | null {
  // Look for elements that might contain instructions
  const possibleInstructionElements = element.querySelectorAll('p, div, span');
  
  for (const element of possibleInstructionElements) {
    const text = element.textContent?.trim() || '';
    // Instructions are usually longer text blocks
    if (text.length > 30 && !text.includes('http') && !text.includes('BUZZ')) {
      return text;
    }
  }
  
  return null;
}

// Function to extract price from an element
function extractPrice(element: HTMLElement): string {
  // Look for text that contains BUZZ and a number
  const textContent = element.textContent || '';
  const priceMatch = textContent.match(/(\d+(\.\d+)?)\s*BUZZ/i);
  if (priceMatch) {
    return priceMatch[1];
  }
  
  // Look for elements that might contain the price
  const possiblePriceElements = element.querySelectorAll('span, div, p');
  for (const element of possiblePriceElements) {
    const text = element.textContent?.trim() || '';
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
  
  // Check if Auto Reply buttons should be added
  safeStorageGet<{ enableAutoReply?: boolean }>(['enableAutoReply']).then((result) => {
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
                btn.textContent?.toLowerCase().includes('reply') && 
                btn.textContent?.toLowerCase().includes('earn')
              );
              
              if (hasTweetEmbed || hasReplyButton) {
                console.log('Found valid buzz card:', element);
                addAutoReplyButton(element as HTMLElement);
              }
            });
          }
        } catch (error) {
          console.error(`Error with selector ${selector}:`, error);
        }
      }
    } else {
      console.log('Auto Reply buttons disabled by user setting');
    }
  });
}, 2000); // Increased timeout to 2 seconds to ensure page is fully loaded 