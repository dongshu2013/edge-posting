import { StorageData, ExtensionSettings } from './types';

/**
 * Safely get data from Chrome storage
 */
export function safeStorageGet<T = any>(
  keys: string | string[] | StorageData | null, 
  defaultValues: Partial<T> = {}
): Promise<T> {
  return new Promise((resolve) => {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get(keys, (result: any) => {
        console.log(`Retrieved from storage:`, result);
        resolve(result as T);
      });
    } else {
      console.warn('Chrome storage API not available');
      // Provide default values
      const defaults: StorageData = {};
      if (Array.isArray(keys)) {
        keys.forEach(key => {
          defaults[key] = defaultValues[key as keyof Partial<T>] || null;
        });
      } else if (typeof keys === 'object' && keys !== null) {
        Object.assign(defaults, keys);
      } else if (typeof keys === 'string') {
        defaults[keys] = defaultValues[keys as keyof Partial<T>] || null;
      }
      resolve(defaults as T);
    }
  });
}

/**
 * Safely set data in Chrome storage
 */
export function safeStorageSet(items: StorageData): Promise<void> {
  return new Promise((resolve) => {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set(items, () => {
        console.log(`Stored in storage:`, items);
        resolve();
      });
    } else {
      console.warn('Chrome storage API not available');
      resolve();
    }
  });
}

/**
 * Initialize default settings
 */
export async function initializeDefaultSettings(): Promise<void> {
  const defaultSettings: Partial<ExtensionSettings> = {
    autoSubmit: true,
    closeTab: true,
    model: 'google/gemini-2.0-flash-001',
    openedWindows: {},
    enableAutoReply: true
  };
  
  await safeStorageSet(defaultSettings);
  console.log('Initialized default settings:', defaultSettings);
} 