import { Settings, DEFAULT_SETTINGS } from '../types';

// Initialize extension settings if not already set
chrome.runtime.onInstalled.addListener(async () => {
  const settings = await new Promise<Settings>((resolve) => {
    chrome.storage.sync.get(['settings'], (result) => {
      resolve(result.settings);
    });
  });

  if (!settings) {
    await new Promise<void>((resolve) => {
      chrome.storage.sync.set({ settings: DEFAULT_SETTINGS }, resolve);
    });
  }
});

// Handle messages from content script and popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'PROFILE_TRAIT') {
    // Save the profile data
    chrome.storage.sync.get(['profile'], (result) => {
      const profile = message.data.text;
      chrome.storage.sync.set({ profile }, () => {
        // Forward the text data to the popup
        chrome.runtime.sendMessage({
          type: 'PAGE_ANALYSIS',
          data: {
            text: profile
          }
        });
      });
    });
  }
  
  if (message.type === 'GET_PROFILE_CONTENT') {
    // Retrieve existing profile content
    chrome.storage.sync.get(['profile'], (result) => {
      sendResponse({ content: result.profile || '' });
    });
    return true; // Required for async response
  }
});
