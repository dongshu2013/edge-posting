// Common types used throughout the extension

export interface BuzzCard {
  id: string;
  tweetLink: string;
  instructions: string;
  price: string;
  replyCount: number;
  totalReplies: number;
  createdBy: string;
  username: string;
  buttonSelector?: string;
}

export interface WindowData {
  timestamp: number;
  url: string;
  uniqueId: string;
  buzzId: string | null;
  autoReplyEnabled: boolean;
  tabId: number | null;
}

export interface StorageData {
  [key: string]: any;
}

export interface ExtensionSettings {
  autoSubmit: boolean;
  closeTab: boolean;
  model: string;
  apiKey?: string;
  openedWindows: Record<string, WindowData>;
  lastReplyUrl?: string;
  autoReplyText?: string;
  autoReplyEnabled?: boolean;
  autoReplyEnabledTimestamp?: number;
  enableAutoReply?: boolean;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface BadgeOptions {
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  size?: number;
  zIndex?: number;
} 