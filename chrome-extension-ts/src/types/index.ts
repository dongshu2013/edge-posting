export interface Settings {
  openaiUrl: string;
  apiKey?: string;
  model: string;
  enableAutoReply: boolean;
  enableAutoSubmit: boolean;
}

export interface Profile {
  id: string;
  name: string;
  text: string;
  createdAt: number;
  lastModified: number;
}

export interface ProfileStore {
  profiles: Profile[];
  activeProfileId?: string;
}

export const DEFAULT_SETTINGS: Settings = {
  openaiUrl: 'https://openrouter.ai/api/v1',
  model: 'google/gemini-2-flash',
  enableAutoReply: false,
  enableAutoSubmit: false,
};
