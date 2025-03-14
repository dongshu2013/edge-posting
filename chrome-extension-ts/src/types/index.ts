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
  openaiUrl: 'http://localhost:11434',
  model: 'gemma3:12b',
  enableAutoReply: false,
  enableAutoSubmit: false,
};
