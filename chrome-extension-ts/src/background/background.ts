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

// Handle messages from content script to popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'CHARACTER_TRAIT') {
    // Forward the text data to the popup
    chrome.runtime.sendMessage({
      type: 'PAGE_ANALYSIS',
      data: {
        text: message.data.text
      }
    });
  }
});
