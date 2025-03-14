import { Settings, DEFAULT_SETTINGS } from '../types';

class ContentAnalyzer {
  private settings: Settings = DEFAULT_SETTINGS;
  private selectedText: string = '';
  private contextMenu: HTMLDivElement | null = null;

  constructor() {
    this.loadSettings();
    this.initializeEventListeners();
  }

  private async loadSettings() {
    this.settings = await new Promise((resolve) => {
      chrome.storage.sync.get(['settings'], (result) => {
        resolve(result.settings || DEFAULT_SETTINGS);
      });
    });
  }

  private initializeEventListeners() {
    // Listen for text selection
    document.addEventListener('mouseup', (e) => this.handleTextSelection(e));
    
    // Listen for settings changes
    chrome.storage.onChanged.addListener((changes) => {
      if (changes.settings) {
        this.settings = changes.settings.newValue;
      }
    });

    // Listen for messages from the popup
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.type === 'ANALYZE_PAGE') {
        this.analyzePageContent();
      }
    });
  }

  private extractPageText(): string {
    // Get the main content, excluding scripts, styles, etc.
    const content = document.body.innerText;
    
    // Get meta description if available
    const metaDescription = document.querySelector('meta[name="description"]')?.getAttribute('content') || '';
    
    // Get heading content
    const headings = Array.from(document.querySelectorAll('h1, h2, h3'))
      .map(h => h.textContent)
      .filter(Boolean)
      .join('\n');
    
    return [metaDescription, headings, content].join('\n');
  }

  async analyzePageContent() {
    // Check if it's a Twitter profile page
    if (this.isTwitterProfilePage()) {
      try {
        const html = await this.getTwitterProfileHtml();
        if (!html) {
          console.error('Failed to get Twitter profile HTML');
          return;
        }

        const posts = await this.extractTwitterPosts(html);
        if (posts.length === 0) {
          console.error('No posts extracted from profile');
          return;
        }

        // Get existing profile content if any
        const existingContent = await new Promise<string>((resolve) => {
          chrome.runtime.sendMessage({ type: 'GET_PROFILE_CONTENT' }, (response) => {
            resolve(response?.content || '');
          });
        });

        const updatedProfile = await this.summarizeProfile(posts, existingContent);

        // Send the updated profile back to the extension
        chrome.runtime.sendMessage({
          type: 'PROFILE_TRAIT',
          data: {
            text: updatedProfile
          }
        });
      } catch (error) {
        console.error('Error analyzing Twitter profile:', error);
      }
    } else {
      // For non-Twitter pages, just send a message that it's not supported
      chrome.runtime.sendMessage({
        type: 'PROFILE_TRAIT',
        data: {
          text: 'Profile learning is currently only supported for Twitter/X profile pages.'
        }
      });
    }
  }

  private handleTextSelection(e: MouseEvent) {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) {
      this.hideContextMenu();
      return;
    }

    const text = selection.toString().trim();
    if (text && text !== this.selectedText) {
      this.selectedText = text;
      this.showContextMenu(e);
    }
  }

  private showContextMenu(e: MouseEvent) {
    if (this.contextMenu) {
      document.body.removeChild(this.contextMenu);
    }

    this.contextMenu = document.createElement('div');
    this.contextMenu.className = 'fixed z-50 bg-white rounded-lg shadow-lg border border-gray-200 p-2';
    this.contextMenu.style.left = `${e.pageX}px`;
    this.contextMenu.style.top = `${e.pageY}px`;

    const addButton = document.createElement('button');
    addButton.className = 'px-3 py-1 text-sm text-white bg-indigo-600 hover:bg-indigo-700 rounded';
    addButton.textContent = 'Add to Character';
    addButton.onclick = () => this.addTraitToCharacter();

    this.contextMenu.appendChild(addButton);
    document.body.appendChild(this.contextMenu);

    // Close menu when clicking outside
    document.addEventListener('mousedown', (e) => {
      if (this.contextMenu && !this.contextMenu.contains(e.target as Node)) {
        this.hideContextMenu();
      }
    }, { once: true });
  }

  private hideContextMenu() {
    if (this.contextMenu) {
      document.body.removeChild(this.contextMenu);
      this.contextMenu = null;
    }
    this.selectedText = '';
  }

  private async addTraitToCharacter() {
    if (!this.selectedText) return;

    try {
      const response = await fetch(this.settings.openaiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.settings.apiKey && { 'Authorization': `Bearer ${this.settings.apiKey}` })
        },
        body: JSON.stringify({
          model: this.settings.model,
          messages: [
            {
              role: 'system',
              content: 'You are a helpful AI character trait analyzer. Extract meaningful character traits from the given text.'
            },
            {
              role: 'user',
              content: `Extract a concise character trait from this text: "${this.selectedText}"`
            }
          ]
        })
      });

      const data = await response.json();
      const trait = data.choices[0].message.content.trim();

      // Send trait to popup
      chrome.runtime.sendMessage({
        type: 'PROFILE_TRAIT',
        trait
      });

    } catch (error) {
      console.error('Failed to analyze text:', error);
      // Send raw text as trait if AI analysis fails
      chrome.runtime.sendMessage({
        type: 'PROFILE_TRAIT',
        trait: this.selectedText
      });
    }

    this.hideContextMenu();
  }

  private async getSettings(): Promise<{
    model?: string;
    apiKey?: string;
  }> {
    return new Promise((resolve) => {
      chrome.storage.sync.get(['settings'], (result) => {
        resolve(result.settings || {});
      });
    });
  }

  private isTwitterProfilePage(): boolean {
    const url = window.location.href;
    // Match twitter.com/username or x.com/username but not subpages
    return /^https?:\/\/(twitter|x)\.com\/[^/]+$/.test(url);
  }

  private async getTwitterProfileHtml(): Promise<string | null> {
    if (!this.isTwitterProfilePage()) {
      return null;
    }

    // Save initial scroll position
    const initialScroll = window.scrollY;
    
    try {
      // Auto-scroll to load more content
      let lastHeight = document.body.scrollHeight;
      let scrollAttempts = 0;
      const maxScrollAttempts = 10; // Limit scrolling to avoid infinite loops
      
      while (scrollAttempts < maxScrollAttempts) {
        window.scrollTo(0, document.body.scrollHeight);
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for content to load
        
        const newHeight = document.body.scrollHeight;
        if (newHeight === lastHeight) {
          break; // No more content to load
        }
        
        lastHeight = newHeight;
        scrollAttempts++;
      }
      
      // Get the full HTML
      const html = document.documentElement.outerHTML;
      return html;
    } catch (error) {
      console.error('Error getting Twitter profile HTML:', error);
      return null;
    } finally {
      // Restore original scroll position
      window.scrollTo(0, initialScroll);
    }
  }

  private async callAiModel(prompt: string, model: string, apiKey: string, temperature: number = 0.7): Promise<string> {
    if (model.startsWith('google/')) {
      const response = await fetch('https://generativelanguage.googleapis.com/v1/models/' + model.replace('google/', '') + ':generateContent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: temperature,
            topK: 40,
            topP: 0.95,
          }
        })
      });

      const data = await response.json();
      return data.candidates[0].content.parts[0].text;
    } else {
      // OpenAI-compatible endpoint
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: model,
          messages: [{
            role: 'user',
            content: prompt
          }],
          temperature: temperature
        })
      });

      const data = await response.json();
      return data.choices[0].message.content;
    }
  }

  private async extractTwitterPosts(html: string): Promise<string[]> {
    const settings = await this.getSettings();
    const model = settings.model || 'google/gemini-2-flash';
    const apiKey = settings.apiKey;

    if (!apiKey) {
      throw new Error('API key not configured');
    }

    try {
      const prompt = `
        Extract all tweets (posts and replies) from this Twitter profile page HTML.
        Only return the text content of the tweets, one per line.
        Ignore retweets, likes, and other metadata.
        Format: Just the tweet text content, nothing else.
        HTML: ${html}
      `;

      const response = await this.callAiModel(prompt, model, apiKey, 0.3);
      return response.split('\n').filter((tweet: string) => tweet.trim());
    } catch (error) {
      console.error('Error extracting tweets:', error);
      return [];
    }
  }

  private async summarizeProfile(posts: string[], existingContent: string = ''): Promise<string> {
    const settings = await this.getSettings();
    const model = settings.model || 'google/gemini-2-flash';
    const apiKey = settings.apiKey;

    if (!apiKey) {
      throw new Error('API key not configured');
    }

    try {
      const prompt = `
        Analyze these tweets and create a comprehensive profile of the person.
        Focus on their interests, expertise, communication style, and recurring themes.
        If there is existing profile content, merge it with the new insights.
        Existing profile: ${existingContent}
        Tweets: ${posts.join('\n')}
      `;

      return await this.callAiModel(prompt, model, apiKey, 0.7);
    } catch (error) {
      console.error('Error summarizing profile:', error);
      return existingContent;
    }
  }

  // Add styles for the context menu
  public injectStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .fixed {
        position: fixed;
      }
      .z-50 {
        z-index: 50;
      }
      .bg-white {
        background-color: white;
      }
      .rounded-lg {
        border-radius: 0.5rem;
      }
      .shadow-lg {
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
      }
      .border {
        border-width: 1px;
      }
      .border-gray-200 {
        border-color: #e5e7eb;
      }
      .p-2 {
        padding: 0.5rem;
      }
      .px-3 {
        padding-left: 0.75rem;
        padding-right: 0.75rem;
      }
      .py-1 {
        padding-top: 0.25rem;
        padding-bottom: 0.25rem;
      }
      .text-sm {
        font-size: 0.875rem;
      }
      .text-white {
        color: white;
      }
      .bg-indigo-600 {
        background-color: #4f46e5;
      }
      .hover\\:bg-indigo-700:hover {
        background-color: #4338ca;
      }
      .rounded {
        border-radius: 0.25rem;
      }
    `;
    document.head.appendChild(style);
  }
}

// Initialize content analyzer when the page loads
new ContentAnalyzer().injectStyles();
