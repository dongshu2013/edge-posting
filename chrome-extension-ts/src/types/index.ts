export interface Settings {
  openaiUrl: string;
  apiKey?: string;
  model: string;
  enableAutoReply: boolean;
  enableAutoSubmit: boolean;
}

export interface Character {
  id: string;
  name: string;
  description: string;
  traits: string[];
  personality: string[];
  interests: string[];
  background: string[];
  createdAt: number;
  lastModified: number;
}

export interface CharacterStore {
  characters: Character[];
  activeCharacterId?: string;
}

export const DEFAULT_SETTINGS: Settings = {
  openaiUrl: 'https://openrouter.ai/api/v1',
  model: 'google/gemini-2-flash',
  enableAutoReply: false,
  enableAutoSubmit: false,
};
