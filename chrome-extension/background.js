// Initialize default settings
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({
    autoSubmit: true,
    closeTab: true,
    buzzEarned: 0,
    pendingReply: null
  });
});

// Listen for messages from popup or content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Background script received message:', message);
  
  if (message.action === 'openTwitter') {
    // Open Twitter with the tweet to reply to
    openTwitterWithReply(message.tweetUrl, message.replyText, message.buzzId, message.price);
    sendResponse({ success: true });
    return false;
  }
  
  if (message.action === 'replySubmitted') {
    // Handle the reply submission
    handleReplySubmission(message.replyUrl, message.buzzId);
    sendResponse({ success: true });
    return false;
  }
  
  if (message.action === 'replyUrlCaptured') {
    // Store the captured reply URL
    console.log('Reply URL captured:', message.replyUrl);
    chrome.storage.local.get(['pendingReply'], (result) => {
      if (result.pendingReply) {
        // Store the reply URL with the pending reply
        const updatedPendingReply = {
          ...result.pendingReply,
          replyUrl: message.replyUrl
        };
        chrome.storage.local.set({ pendingReply: updatedPendingReply });
      }
    });
    return false;
  }
});

// Listen for tab updates
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // Check if the tab has completed loading
  if (changeInfo.status === 'complete') {
    // If it's a Twitter tab and we have a pending reply
    if ((tab.url.includes('twitter.com') || tab.url.includes('x.com')) && tab.url.includes('/status/')) {
      chrome.storage.local.get(['pendingReply'], (result) => {
        if (result.pendingReply) {
          // Inject the script to handle the reply
          chrome.scripting.executeScript({
            target: { tabId: tabId },
            function: injectReplyHandler,
            args: [result.pendingReply]
          }).catch(err => {
            console.error('Error injecting reply handler:', err);
          });
        }
      });
    }
  }
});

// Function to check if a URL is an Edge Posting URL
function isEdgePostingUrl(url) {
  if (!url) return false;
  
  return url.includes('edge-posting') || 
         url.includes('localhost') || 
         url.includes('vercel.app');
}

// Function to find an Edge Posting tab
async function findEdgePostingTab() {
  return new Promise(resolve => {
    chrome.tabs.query({}, tabs => {
      const edgePostingTab = tabs.find(tab => isEdgePostingUrl(tab.url));
      resolve(edgePostingTab);
    });
  });
}

// Function to open Twitter with the tweet to reply to
function openTwitterWithReply(tweetUrl, replyText, buzzId, price) {
  // Store the pending reply information
  const pendingReply = {
    tweetUrl,
    replyText,
    buzzId,
    price,
    timestamp: Date.now()
  };
  
  chrome.storage.local.set({ pendingReply }, () => {
    // Always use a popup window for better user experience
    const popupWidth = 600;
    const popupHeight = 700;
    const left = (screen.width - popupWidth) / 2;
    const top = (screen.height - popupHeight) / 2;
    
    chrome.windows.create({
      url: tweetUrl,
      type: 'popup',
      width: popupWidth,
      height: popupHeight,
      left: left,
      top: top
    }, (window) => {
      console.log(`Opened Twitter popup window with ID: ${window.id}`);
      
      // Store the window ID for tracking
      chrome.storage.local.set({ 
        twitterWindowId: window.id,
        twitterWindowBuzzId: buzzId
      });
    });
  });
}

// Function to handle the reply submission
function handleReplySubmission(replyUrl, buzzId) {
  chrome.storage.local.get(['pendingReply', 'closeTab'], (result) => {
    if (result.pendingReply && result.pendingReply.buzzId === buzzId) {
      // Get the tab that was used for the reply
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const twitterTabId = tabs[0].id;
        
        // Clear the pending reply
        chrome.storage.local.set({ pendingReply: null }, () => {
          // Update the BUZZ earned
          const earnedAmount = result.pendingReply.price;
          chrome.storage.local.get(['buzzEarned'], (earnedResult) => {
            const currentAmount = earnedResult.buzzEarned || 0;
            const newAmount = currentAmount + earnedAmount;
            
            chrome.storage.local.set({ buzzEarned: newAmount }, () => {
              console.log(`Updated BUZZ earned: ${newAmount}`);
              
              // Notify the popup to update the display
              chrome.runtime.sendMessage({
                action: 'updateBuzzEarned',
                amount: earnedAmount
              });
            });
          });
          
          // Close the Twitter tab if auto-close is enabled
          if (result.closeTab) {
            // Get the window ID
            chrome.storage.local.get(['twitterWindowId'], (windowResult) => {
              if (windowResult.twitterWindowId) {
                // Close the window
                chrome.windows.remove(windowResult.twitterWindowId, () => {
                  console.log(`Closed Twitter window: ${windowResult.twitterWindowId}`);
                });
              } else {
                // Fall back to closing the tab
                chrome.tabs.remove(twitterTabId, () => {
                  console.log(`Closed Twitter tab: ${twitterTabId}`);
                });
              }
            });
          }
          
          // Send the reply URL back to the Edge Posting tab
          findEdgePostingTab().then(edgePostingTab => {
            if (edgePostingTab) {
              chrome.tabs.sendMessage(edgePostingTab.id, {
                action: 'submitReply',
                replyUrl,
                buzzId
              }, response => {
                if (chrome.runtime.lastError) {
                  console.error('Error submitting reply to Edge Posting:', chrome.runtime.lastError);
                } else {
                  console.log('Submitted reply to Edge Posting');
                }
              });
            } else {
              console.error('No Edge Posting tab found to submit reply');
            }
          });
        });
      });
    }
  });
}

// Listen for window removal
chrome.windows.onRemoved.addListener((windowId) => {
  // Check if this is our Twitter window
  chrome.storage.local.get(['twitterWindowId', 'twitterWindowBuzzId', 'pendingReply'], (result) => {
    if (result.twitterWindowId === windowId) {
      console.log(`Twitter window ${windowId} was closed`);
      
      // Try to get the reply URL from the pending reply
      if (result.pendingReply) {
        const replyUrl = result.pendingReply.replyUrl;
        
        if (replyUrl) {
          // We have a captured reply URL, use it
          console.log('Using captured reply URL:', replyUrl);
          
          // Find the Edge Posting tab to send the message to
          findEdgePostingTab().then(edgePostingTab => {
            if (edgePostingTab) {
              // Send a message to the Edge Posting tab to submit the reply
              chrome.tabs.sendMessage(edgePostingTab.id, {
                action: 'submitReply',
                replyUrl: replyUrl,
                buzzId: result.twitterWindowBuzzId
              }, response => {
                if (chrome.runtime.lastError) {
                  console.error('Error submitting reply:', chrome.runtime.lastError);
                } else {
                  console.log('Submitted reply with URL:', replyUrl);
                }
              });
            } else {
              console.error('No Edge Posting tab found to submit reply');
            }
          });
          
          // Update BUZZ earned
          if (result.pendingReply.price) {
            const earnedAmount = result.pendingReply.price;
            chrome.storage.local.get(['buzzEarned'], (earnedResult) => {
              const currentAmount = earnedResult.buzzEarned || 0;
              const newAmount = currentAmount + earnedAmount;
              
              chrome.storage.local.set({ buzzEarned: newAmount }, () => {
                console.log(`Updated BUZZ earned: ${newAmount}`);
                
                // Notify the popup to update the display
                chrome.runtime.sendMessage({
                  action: 'updateBuzzEarned',
                  amount: earnedAmount
                });
              });
            });
          }
        } else {
          // No captured URL, open the reply modal without a URL
          findEdgePostingTab().then(edgePostingTab => {
            if (edgePostingTab) {
              // Send a message to the Edge Posting tab to open the reply modal
              chrome.tabs.sendMessage(edgePostingTab.id, {
                action: 'openReplyModal',
                buzzId: result.twitterWindowBuzzId
              }, response => {
                if (chrome.runtime.lastError) {
                  console.error('Error opening reply modal:', chrome.runtime.lastError);
                } else {
                  console.log('Opened reply modal');
                }
              });
            } else {
              console.error('No Edge Posting tab found to open reply modal');
            }
          });
        }
      }
      
      // Clear the window tracking data
      chrome.storage.local.remove(['twitterWindowId', 'twitterWindowBuzzId']);
    }
  });
});

// This function will be injected into the Twitter page
function injectReplyHandler(pendingReply) {
  console.log('Injecting reply handler for tweet:', pendingReply.tweetUrl);
  
  // Wait for the page to fully load
  setTimeout(() => {
    // Find the reply button and click it
    const replyButtons = Array.from(document.querySelectorAll('div[aria-label="Reply"], div[data-testid="reply"]'));
    const replyButton = replyButtons[0];
    
    if (replyButton) {
      replyButton.click();
      console.log('Clicked reply button');
      
      // Wait for the reply box to appear
      setTimeout(() => {
        // Find the tweet input area
        const tweetInputs = document.querySelectorAll('div[data-testid="tweetTextarea_0"]');
        const tweetInput = tweetInputs[0];
        
        if (tweetInput) {
          // Fill in the reply text
          tweetInput.textContent = pendingReply.replyText;
          tweetInput.dispatchEvent(new Event('input', { bubbles: true }));
          console.log('Filled in reply text');
          
          // Wait for the tweet button to become enabled
          setTimeout(() => {
            // Find and click the tweet button
            const tweetButtons = document.querySelectorAll('div[data-testid="tweetButton"]');
            const tweetButton = tweetButtons[0];
            
            if (tweetButton) {
              tweetButton.click();
              console.log('Clicked tweet button');
              
              // Wait for the tweet to be posted
              setTimeout(() => {
                // Get the URL of the reply
                const replyUrl = window.location.href;
                console.log('Reply posted at:', replyUrl);
                
                // Store the reply URL in session storage
                try {
                  sessionStorage.setItem('lastTwitterReplyUrl', replyUrl);
                } catch (e) {
                  console.error('Failed to store reply URL in session storage:', e);
                }
                
                // Send the reply URL back to the background script
                chrome.runtime.sendMessage({
                  action: 'replySubmitted',
                  replyUrl,
                  buzzId: pendingReply.buzzId
                });
              }, 3000);
            }
          }, 1000);
        }
      }, 1000);
    }
  }, 2000);
} 