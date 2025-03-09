// Check if we're on the Edge Posting website
if (window.location.href.includes('edge-posting')) {
  console.log('BUZZ Reply Helper: Content script loaded on Edge Posting site');
  
  // Listen for messages from the background script
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'submitReply' && message.replyUrl && message.buzzId) {
      console.log('Received reply submission request:', message);
      submitReplyToEdgePosting(message.replyUrl, message.buzzId);
    }
  });
  
  // Set up a mutation observer to detect when new buzz requests are loaded
  setupBuzzObserver();
}

// Function to set up the observer for buzz requests
function setupBuzzObserver() {
  // Check if we're on the play page
  if (window.location.href.includes('/play')) {
    console.log('Setting up observer for buzz requests on play page');
    
    // Create a mutation observer to watch for changes to the DOM
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          // Look for buzz request elements
          const buzzElements = document.querySelectorAll('.buzz-request');
          
          if (buzzElements.length > 0) {
            console.log('Found buzz requests:', buzzElements.length);
            
            // Add our custom reply buttons to each buzz request
            buzzElements.forEach(buzzElement => {
              addReplyButton(buzzElement);
            });
          }
        }
      }
    });
    
    // Start observing the document body
    observer.observe(document.body, { childList: true, subtree: true });
    
    // Also check for existing buzz requests
    setTimeout(() => {
      const existingBuzzElements = document.querySelectorAll('.buzz-request');
      if (existingBuzzElements.length > 0) {
        console.log('Found existing buzz requests:', existingBuzzElements.length);
        existingBuzzElements.forEach(buzzElement => {
          addReplyButton(buzzElement);
        });
      }
    }, 2000);
  }
}

// Function to add a custom reply button to a buzz request
function addReplyButton(buzzElement) {
  // Check if we've already added a button to this element
  if (buzzElement.querySelector('.buzz-helper-button')) {
    return;
  }
  
  // Extract the buzz information
  const buzzId = buzzElement.dataset.buzzId;
  const tweetLink = buzzElement.querySelector('a[href*="twitter.com"]')?.href || 
                    buzzElement.querySelector('a[href*="x.com"]')?.href;
  const instructions = buzzElement.querySelector('.instructions')?.textContent;
  const priceElement = buzzElement.querySelector('.price');
  const price = priceElement ? parseFloat(priceElement.textContent.replace('BUZZ', '').trim()) : 0;
  
  if (!buzzId || !tweetLink || !instructions) {
    console.log('Missing required buzz information');
    return;
  }
  
  // Create the auto-reply button
  const replyButton = document.createElement('button');
  replyButton.className = 'buzz-helper-button';
  replyButton.textContent = 'Auto Reply';
  replyButton.style.cssText = `
    background: linear-gradient(to right, #4f46e5, #7c3aed);
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 500;
    margin-top: 8px;
    transition: all 0.2s;
  `;
  
  // Add hover effect
  replyButton.addEventListener('mouseover', () => {
    replyButton.style.opacity = '0.9';
    replyButton.style.transform = 'translateY(-1px)';
  });
  
  replyButton.addEventListener('mouseout', () => {
    replyButton.style.opacity = '1';
    replyButton.style.transform = 'translateY(0)';
  });
  
  // Add click handler
  replyButton.addEventListener('click', () => {
    // Generate a reply based on the instructions
    generateReply(instructions, (replyText) => {
      if (replyText) {
        // Send a message to the background script to open Twitter
        chrome.runtime.sendMessage({
          action: 'openTwitter',
          tweetUrl: tweetLink,
          replyText: replyText,
          buzzId: buzzId,
          price: price
        });
      }
    });
  });
  
  // Add the button to the buzz element
  const actionsContainer = buzzElement.querySelector('.actions') || buzzElement;
  actionsContainer.appendChild(replyButton);
}

// Function to generate a reply based on instructions
function generateReply(instructions, callback) {
  // Check if we have a model connected
  const modelEndpoint = document.querySelector('#modelEndpoint')?.value;
  
  if (!modelEndpoint) {
    // No model connected, use a simple template
    const templates = [
      "That's an interesting perspective! I agree with your points about #topic#.",
      "Great tweet! I've been thinking about #topic# as well and your insights are valuable.",
      "Thanks for sharing your thoughts on #topic#. It's definitely worth considering.",
      "I appreciate your take on #topic#. It's given me something to think about.",
      "This is a fascinating perspective on #topic#. Thanks for sharing!"
    ];
    
    // Extract a topic from the instructions
    const topics = instructions.match(/\b\w{5,}\b/g) || ['this'];
    const topic = topics[Math.floor(Math.random() * topics.length)];
    
    // Select a random template and replace the topic
    const template = templates[Math.floor(Math.random() * templates.length)];
    const reply = template.replace('#topic#', topic);
    
    callback(reply);
  } else {
    // Use the connected model to generate a reply
    // This would normally call the model API, but for now we'll simulate it
    const generateButton = document.querySelector('button[aria-label="Generate Reply"]');
    
    if (generateButton) {
      // Click the generate button and wait for the response
      generateButton.click();
      
      // Wait for the generated reply to appear
      const checkForReply = setInterval(() => {
        const generatedReply = document.querySelector('.generated-reply')?.textContent;
        
        if (generatedReply) {
          clearInterval(checkForReply);
          callback(generatedReply);
        }
      }, 500);
      
      // Set a timeout to prevent waiting forever
      setTimeout(() => {
        clearInterval(checkForReply);
        // Fallback to a simple reply
        callback("Thanks for sharing your thoughts!");
      }, 10000);
    } else {
      // Fallback to a simple reply
      callback("Thanks for sharing your thoughts!");
    }
  }
}

// Function to submit a reply to Edge Posting
function submitReplyToEdgePosting(replyUrl, buzzId) {
  console.log('Submitting reply to Edge Posting:', replyUrl, buzzId);
  
  // Find the reply modal or open it
  const replyModal = document.querySelector('.reply-modal') || 
                     document.querySelector(`[data-buzz-id="${buzzId}"] .reply-button`);
  
  if (replyModal) {
    // If it's a button, click it to open the modal
    if (replyModal.classList.contains('reply-button')) {
      replyModal.click();
      
      // Wait for the modal to open
      setTimeout(() => {
        fillAndSubmitReplyForm(replyUrl);
      }, 500);
    } else {
      // Modal is already open
      fillAndSubmitReplyForm(replyUrl);
    }
  } else {
    console.error('Could not find reply modal or button');
  }
}

// Function to fill and submit the reply form
function fillAndSubmitReplyForm(replyUrl) {
  // Find the reply URL input
  const replyInput = document.querySelector('input[name="replyLink"]') || 
                     document.querySelector('input[placeholder*="reply"]');
  
  if (replyInput) {
    // Fill in the reply URL
    replyInput.value = replyUrl;
    replyInput.dispatchEvent(new Event('input', { bubbles: true }));
    
    // Find and click the submit button
    const submitButton = document.querySelector('button[type="submit"]') || 
                         document.querySelector('.submit-button') ||
                         Array.from(document.querySelectorAll('button')).find(btn => 
                           btn.textContent.toLowerCase().includes('submit')
                         );
    
    if (submitButton) {
      // Check if auto-submit is enabled
      chrome.storage.local.get(['autoSubmit'], (result) => {
        if (result.autoSubmit) {
          submitButton.click();
          console.log('Automatically submitted reply');
        } else {
          console.log('Auto-submit is disabled, please submit manually');
        }
      });
    } else {
      console.error('Could not find submit button');
    }
  } else {
    console.error('Could not find reply URL input');
  }
} 