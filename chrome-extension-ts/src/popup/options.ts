import { Settings, DEFAULT_SETTINGS } from '../types';

class SettingsManager {
  private form: HTMLFormElement;
  private urlInput: HTMLInputElement;
  private apiKeyInput: HTMLInputElement;
  private modelSelect: HTMLSelectElement;
  private customModelSection: HTMLDivElement;
  private customModelInput: HTMLInputElement;
  private backButton: HTMLButtonElement;

  constructor() {
    this.form = document.getElementById('settingsForm') as HTMLFormElement;
    this.urlInput = document.getElementById('openaiUrl') as HTMLInputElement;
    this.apiKeyInput = document.getElementById('apiKey') as HTMLInputElement;
    this.modelSelect = document.getElementById('model') as HTMLSelectElement;
    this.customModelSection = document.getElementById('customModelSection') as HTMLDivElement;
    this.customModelInput = document.getElementById('customModel') as HTMLInputElement;
    this.backButton = document.getElementById('backButton') as HTMLButtonElement;

    this.initializeForm();
    this.initializeEventListeners();
  }

  private initializeEventListeners() {
    this.form.addEventListener('submit', (e) => this.handleSubmit(e));
    this.backButton.addEventListener('click', () => {
      window.location.href = 'index.html';
    });

    // Toggle custom model input visibility
    this.modelSelect.addEventListener('change', () => {
      const isCustom = this.modelSelect.value === 'custom';
      this.customModelSection.classList.toggle('hidden', !isCustom);
      if (isCustom) {
        this.customModelInput.focus();
      }
    });
  }

  private async initializeForm() {
    // Load saved settings
    const settings = await this.getSettings();
    
    // Check if the saved model is one of the predefined options
    const isCustomModel = ![
      'google/gemini-2-flash',
      'google/gemini-pro',
      'anthropic/claude-3-opus',
      'anthropic/claude-3-sonnet',
      'meta-llama/llama-2-70b-chat',
      'gpt-4',
      'custom'
    ].includes(settings.model);

    // If it's a custom model, select the custom option and show the input
    if (isCustomModel) {
      this.modelSelect.value = 'custom';
      this.customModelSection.classList.remove('hidden');
      this.customModelInput.value = settings.model;
    } else {
      this.modelSelect.value = settings.model;
      this.customModelSection.classList.add('hidden');
    }
    
    // Populate other form fields
    this.urlInput.value = settings.openaiUrl;
    this.apiKeyInput.value = settings.apiKey || '';
  }

  private async getSettings(): Promise<Settings> {
    return new Promise((resolve) => {
      chrome.storage.sync.get(['settings'], (result) => {
        resolve(result.settings || DEFAULT_SETTINGS);
      });
    });
  }

  private async saveSettings(settings: Settings) {
    return new Promise<void>((resolve) => {
      chrome.storage.sync.set({ settings }, resolve);
    });
  }

  private async handleSubmit(e: Event) {
    e.preventDefault();

    const settings: Settings = {
      openaiUrl: this.urlInput.value,
      apiKey: this.apiKeyInput.value || undefined,
      model: this.modelSelect.value === 'custom' ? this.customModelInput.value : this.modelSelect.value,
      enableAutoReply: false,
      enableAutoSubmit: false,
    };

    await this.saveSettings(settings);

    // Show success message
    const button = this.form.querySelector('button[type="submit"]') as HTMLButtonElement;
    const originalText = button.textContent;
    button.textContent = 'Saved!';
    button.disabled = true;
    
    setTimeout(() => {
      button.textContent = originalText;
      button.disabled = false;
    }, 2000);
  }
}

// Initialize settings manager when the options page loads
document.addEventListener('DOMContentLoaded', () => {
  new SettingsManager();
});
