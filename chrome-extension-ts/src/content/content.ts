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
    const pageText = this.extractPageText();
    if (!pageText) return;

    // Send message to background script
    chrome.runtime.sendMessage({
      type: 'CHARACTER_TRAIT',
      data: {
        text: pageText
      }
    });
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
        type: 'CHARACTER_TRAIT',
        trait
      });

    } catch (error) {
      console.error('Failed to analyze text:', error);
      // Send raw text as trait if AI analysis fails
      chrome.runtime.sendMessage({
        type: 'CHARACTER_TRAIT',
        trait: this.selectedText
      });
    }

    this.hideContextMenu();
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
