import { safeStorageGet, safeStorageSet, initializeDefaultSettings } from '../lib/storage';
import { formatReplyUrl } from '../lib/twitter';
import { ExtensionSettings, WindowData } from '../lib/types';

// Initialize default settings when extension is installed
chrome.runtime.onInstalled.addListener(() => {
  initializeDefaultSettings();
  console.log('BUZZ Reply Helper: Extension installed with default settings');
});

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((message: any, sender: chrome.runtime.MessageSender, sendResponse: (response?: any) => void) => {
  console.log('Background script received message:', message);
  
  if (message.action === 'closeTwitterWindow') {
    handleCloseTwitterWindow(message, sender, sendResponse);
    return true; // Keep the message channel open for async response
  }
  
  if (message.action === 'captureReplyUrl') {
    handleCaptureReplyUrl(message, sender, sendResponse);
    return true;
  }
  
  if (message.action === 'openTwitterWithReply') {
    handleOpenTwitterWithReply(message, sendResponse);
    return true;
  }
  
  if (message.action === 'forwardReplyUrl') {
    handleForwardReplyUrl(message, sendResponse);
    return true;
  }
  
  if (message.action === 'getWindowInfo') {
    handleGetWindowInfo(sender, sendResponse);
    return true;
  }
  
  // Default response
  sendResponse({ success: false, error: 'Unknown action' });
  return false;
});

// Function to handle closing Twitter window
async function handleCloseTwitterWindow(message: any, sender: chrome.runtime.MessageSender, sendResponse: (response?: any) => void) {
  console.log('Received close window request:', {
    reason: message.reason,
    url: message.url,
    timestamp: message.timestamp,
    sender: sender,
    tabId: sender.tab?.id,
    windowId: sender.tab?.windowId,
    providedWindowId: message.windowId
  });
  
  // Get the list of windows we've opened
  const result = await safeStorageGet<ExtensionSettings>(['openedWindows', 'closeTab']);
  console.log('Current opened windows:', result.openedWindows);
  console.log('Close tab setting:', result.closeTab);
  
  if (!result.closeTab) {
    console.log('Window closing is disabled in settings');
    sendResponse({ success: false, reason: 'Window closing disabled' });
    return;
  }
  
  const openedWindows = result.openedWindows || {};
  
  // If a window ID was provided directly in the message, try that first
  if (message.windowId) {
    const providedWindowIdStr = message.windowId.toString();
    console.log('Using provided window ID:', providedWindowIdStr);
    
    // Check if this window is in our tracking
    if (openedWindows[providedWindowIdStr]) {
      console.log('Found matching window by provided ID:', providedWindowIdStr);
      
      // Remove this window from tracking BEFORE closing it
      delete openedWindows[providedWindowIdStr];
      
      // Update storage first, then close window
      await safeStorageSet({ openedWindows });
      
      try {
        await chrome.windows.remove(parseInt(providedWindowIdStr));
        console.log('Window closed successfully by provided ID');
        sendResponse({ success: true });
      } catch (error: any) {
        console.error('Error closing window by provided ID:', error);
        sendResponse({ success: false, error: error.message });
      }
      return;
    } else {
      console.log('Window ID provided but not found in our tracking - NOT closing for safety');
      sendResponse({ success: false, reason: 'Window not tracked by our extension' });
      return;
    }
  }
  
  // If no window ID was provided, or it wasn't in our tracking, check the sender's window ID
  const windowId = sender.tab?.windowId;
  if (windowId) {
    const windowIdStr = windowId.toString();
    
    if (openedWindows[windowIdStr]) {
      console.log('Found matching window opened by our extension by ID:', windowIdStr);
      
      // Remove this window from tracking BEFORE closing it
      delete openedWindows[windowIdStr];
      
      // Update storage first, then close window
      await safeStorageSet({ openedWindows });
      
      try {
        await chrome.windows.remove(parseInt(windowIdStr));
        console.log('Window closed successfully');
        sendResponse({ success: true });
      } catch (error: any) {
        console.error('Error closing window:', error);
        sendResponse({ success: false, error: error.message });
      }
      return;
    }
  }
  
  // If we get here, we couldn't find the window in our tracking
  console.log('Window was not found in our tracking - NOT closing for safety');
  sendResponse({ success: false, reason: 'Window not tracked by our extension' });
}

// Function to handle capturing reply URL
async function handleCaptureReplyUrl(message: any, sender: chrome.runtime.MessageSender, sendResponse: (response?: any) => void) {
  console.log('Captured reply URL:', message.replyUrl);
  
  // Store the reply URL
  await safeStorageSet({ lastReplyUrl: message.replyUrl });
  console.log('Stored reply URL in local storage:', message.replyUrl);
  
  // Send the URL to Edge Posting tabs
  const tabs = await chrome.tabs.query({ 
    url: [
      "http://localhost:*/buzz*",
      "https://edge-posting.vercel.app/buzz*",
      "https://*.vercel.app/buzz*"
    ]
  });
  
  console.log('Found Edge Posting tabs:', tabs.length);
  
  if (tabs.length > 0) {
    // Send the reply URL to all Edge Posting tabs
    tabs.forEach(tab => {
      console.log('Sending reply URL to Edge Posting tab:', tab.id);
      if (tab.id) {
        chrome.tabs.sendMessage(tab.id, {
          action: 'replyUrlExtracted',
          replyUrl: message.replyUrl
        }, response => {
          console.log('Response from Edge Posting tab:', response);
        });
      }
    });
    
    sendResponse({ success: true, message: 'Reply URL forwarded to Edge Posting tabs' });
  } else {
    console.warn('No Edge Posting tabs found to send reply URL to');
    sendResponse({ success: false, message: 'No Edge Posting tabs found' });
  }
}

// Function to handle opening Twitter with reply
async function handleOpenTwitterWithReply(message: any, sendResponse: (response?: any) => void) {
  console.log('Opening Twitter with auto-reply:', message.tweetLink, message.replyText);
  
  // Store the reply text for the Twitter content script to use
  await safeStorageSet({ 
    autoReplyText: message.replyText,
    // Set a flag to indicate this is a window that should have auto-reply enabled
    autoReplyEnabled: true,
    // Store a timestamp to expire this setting
    autoReplyEnabledTimestamp: Date.now()
  });
  
  console.log('Stored auto-reply text and enabled auto-reply flag');
  
  // Format the tweet link as a reply URL if it's a valid tweet URL
  const replyUrl = formatReplyUrl(message.tweetLink, message.replyText);
  
  // Open the Twitter popup
  openTwitterPopup(replyUrl, message.buzzId);
  
  sendResponse({ success: true });
}

// Function to handle forwarding reply URL
async function handleForwardReplyUrl(message: any, sendResponse: (response?: any) => void) {
  console.log('Received reply URL to forward:', message.replyUrl);
  
  // Store the reply URL
  await safeStorageSet({ lastReplyUrl: message.replyUrl });
  console.log('Stored reply URL in local storage:', message.replyUrl);
  
  // Debug: Log all storage values
  const allData = await safeStorageGet(null);
  console.log('All storage data after storing reply URL:', allData);
  
  // Send the URL to Edge Posting tabs
  const tabs = await chrome.tabs.query({ 
    url: [
      "http://localhost:*/buzz*",
      "https://edge-posting.vercel.app/buzz*",
      "https://*.vercel.app/buzz*"
    ]
  });
  
  console.log('Found Edge Posting tabs:', tabs.length, tabs);
  
  if (tabs.length > 0) {
    // Send the reply URL to all Edge Posting tabs
    let successCount = 0;
    let failCount = 0;
    
    for (const tab of tabs) {
      if (tab.id) {
        console.log('Sending reply URL to Edge Posting tab:', tab.id, tab.url);
        try {
          const response = await new Promise(resolve => {
            chrome.tabs.sendMessage(tab.id!, {
              action: 'replyUrlExtracted',
              replyUrl: message.replyUrl
            }, resolve);
          });
          
          console.log('Response from Edge Posting tab:', tab.id, response);
          if (response && (response as any).success) {
            successCount++;
          } else {
            failCount++;
          }
        } catch (error) {
          console.error('Error sending message to tab:', tab.id, error);
          failCount++;
        }
      }
    }
    
    console.log(`Reply URL forwarding complete: ${successCount} successes, ${failCount} failures`);
    sendResponse({ success: true, tabCount: tabs.length });
  } else {
    console.warn('No Edge Posting tabs found to send reply URL to');
    sendResponse({ success: false, reason: 'No Edge Posting tabs found' });
  }
}

// Function to handle getting window info
async function handleGetWindowInfo(sender: chrome.runtime.MessageSender, sendResponse: (response?: any) => void) {
  console.log('Received request for window info from tab:', sender.tab?.id);
  
  // Get the current window ID
  const windowId = sender.tab?.windowId;
  
  // Get all window tracking data
  const result = await safeStorageGet(['openedWindows']);
  const openedWindows = result.openedWindows || {};
  
  // Check if this window is being tracked
  const isTracked = windowId && openedWindows[windowId.toString()];
  
  // Check if this tab is mapped to a window
  const tabId = sender.tab?.id;
  
  if (tabId) {
    const tabMapping = await safeStorageGet([`tab_${tabId}`]);
    const mappedWindowId = tabMapping[`tab_${tabId}`];
    const isMappedByTab = mappedWindowId && openedWindows[mappedWindowId];
    
    // Find any windows that might match this tab's URL
    const url = sender.tab?.url;
    let matchesByUrl: any[] = [];
    
    if (url) {
      for (const [id, data] of Object.entries(openedWindows)) {
        if ((data as WindowData).url && url.includes((data as WindowData).url.split('/').pop() || '')) {
          matchesByUrl.push({ id, data });
        }
      }
    }
    
    // Send the debug info back
    sendResponse({
      windowId: windowId,
      tabId: tabId,
      url: url,
      isTrackedByWindowId: isTracked,
      isMappedByTabId: isMappedByTab,
      mappedWindowId: mappedWindowId,
      matchesByUrl: matchesByUrl,
      allOpenedWindows: openedWindows,
      allWindowIds: Object.keys(openedWindows)
    });
  } else {
    sendResponse({
      windowId: windowId,
      isTrackedByWindowId: isTracked,
      allOpenedWindows: openedWindows,
      allWindowIds: Object.keys(openedWindows)
    });
  }
}

// Function to open Twitter in a popup window
function openTwitterPopup(url: string, buzzId: string | null) {
  console.log('Opening Twitter popup with URL:', url, 'for buzz ID:', buzzId);
  
  // Configure popup window dimensions
  const width = 600;
  const height = 700;
  // Use optional chaining and nullish coalescing to handle undefined window
  const screenWidth = globalThis.screen?.width ?? 1024;
  const screenHeight = globalThis.screen?.height ?? 768;
  const left = Math.max((screenWidth - width) / 2, 0);
  const top = Math.max((screenHeight - height) / 2, 0);
  
  // Generate a unique identifier for this window
  const windowUniqueId = 'buzz-reply-' + Date.now();
  
  // Open Twitter in a popup window
  chrome.windows.create({
    url: url,
    type: 'popup',
    width: width,
    height: height,
    left: Math.round(left),
    top: Math.round(top)
  }, async function(createdWindow) {
    if (!createdWindow || !createdWindow.id) {
      console.error('Failed to create window or window ID is missing');
      return;
    }
    
    console.log('Opened Twitter popup window:', createdWindow.id, 'with unique ID:', windowUniqueId);
    
    // Get the tab ID of the newly created window
    const tabs = await chrome.tabs.query({ windowId: createdWindow.id });
    const tabId: number | null = tabs.length > 0 && tabs[0].id ? tabs[0].id : null;
    console.log('Tab ID for new window:', tabId);
    
    // Track this window with timestamp and unique ID
    const result = await safeStorageGet<ExtensionSettings>(['openedWindows']);
    const openedWindows = result.openedWindows || {};
    
    // Clean up any old windows that might have been left in storage
    // (windows older than 30 minutes)
    const now = Date.now();
    const thirtyMinutesAgo = now - (30 * 60 * 1000);
    
    Object.keys(openedWindows).forEach(windowId => {
      if (openedWindows[windowId].timestamp < thirtyMinutesAgo) {
        console.log('Removing stale window reference:', windowId);
        delete openedWindows[windowId];
      }
    });
    
    // Add the new window - convert window.id to string to ensure consistent key type
    const windowIdStr = createdWindow.id.toString();
    openedWindows[windowIdStr] = {
      timestamp: now,
      url: url,
      uniqueId: windowUniqueId,
      buzzId: buzzId,
      autoReplyEnabled: true, // Flag this window for auto-reply
      tabId: tabId // Store the tab ID for better tracking
    };
    
    // Also store a mapping from tab ID to window ID
    if (tabId) {
      const tabMapping: Record<string, string> = {};
      tabMapping[`tab_${tabId}`] = windowIdStr;
      
      await safeStorageSet(tabMapping);
      console.log(`Mapped tab ${tabId} to window ${windowIdStr}`);
    }
    
    await safeStorageSet({ openedWindows });
    console.log('Updated opened windows list. Current windows:', openedWindows);
    
    // Debug: Log all storage values
    const allData = await safeStorageGet(null);
    console.log('All storage data after opening window:', allData);
  });
} 