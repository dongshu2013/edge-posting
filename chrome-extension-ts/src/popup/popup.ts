import { Character, CharacterStore } from '../types';

class CharacterBuilder {
  private activeCharacterSection: HTMLDivElement;
  private characterList: HTMLDivElement;
  private createCharacterButton: HTMLButtonElement;
  private learnFromPageButton: HTMLButtonElement;
  private settingsButton: HTMLButtonElement;
  private characterModal: HTMLDivElement;
  private deleteModal: HTMLDivElement;
  private detailsModal: HTMLDivElement;
  private detailsTitle: HTMLHeadingElement;
  private detailsContent: HTMLDivElement;
  private closeDetailsButton: HTMLButtonElement;
  private characterForm: HTMLFormElement;
  private cancelCharacterButton: HTMLButtonElement;
  private cancelDeleteButton: HTMLButtonElement;
  private confirmDeleteButton: HTMLButtonElement;
  private characterToDelete: Character | null = null;

  private readonly DEFAULT_CHARACTER: Character = {
    id: 'default',
    name: 'Default',
    text: '',
    createdAt: 0,
    lastModified: 0,
  };

  constructor() {
    this.activeCharacterSection = document.getElementById('activeCharacter') as HTMLDivElement;
    this.characterList = document.getElementById('characterList') as HTMLDivElement;
    this.createCharacterButton = document.getElementById('createCharacter') as HTMLButtonElement;
    this.learnFromPageButton = document.getElementById('learnFromPage') as HTMLButtonElement;
    this.settingsButton = document.getElementById('settingsButton') as HTMLButtonElement;
    this.characterModal = document.getElementById('characterModal') as HTMLDivElement;
    this.deleteModal = document.getElementById('deleteModal') as HTMLDivElement;
    this.detailsModal = document.getElementById('detailsModal') as HTMLDivElement;
    this.detailsTitle = document.getElementById('detailsTitle') as HTMLHeadingElement;
    this.detailsContent = document.getElementById('detailsContent') as HTMLDivElement;
    this.closeDetailsButton = document.getElementById('closeDetails') as HTMLButtonElement;
    this.characterForm = document.getElementById('characterForm') as HTMLFormElement;
    this.cancelCharacterButton = document.getElementById('cancelCharacter') as HTMLButtonElement;
    this.cancelDeleteButton = document.getElementById('cancelDelete') as HTMLButtonElement;
    this.confirmDeleteButton = document.getElementById('confirmDelete') as HTMLButtonElement;

    this.initializeEventListeners();
    this.loadCharacters();
  }

  private initializeEventListeners() {
    this.createCharacterButton.addEventListener('click', () => this.showCharacterModal());
    this.cancelCharacterButton.addEventListener('click', () => this.hideCharacterModal());
    this.characterForm.addEventListener('submit', (e) => this.handleCharacterSubmit(e));
    this.settingsButton.addEventListener('click', () => {
      window.location.href = 'options.html';
    });
    this.learnFromPageButton.addEventListener('click', () => this.learnFromCurrentPage());
    this.cancelDeleteButton.addEventListener('click', () => this.hideDeleteModal());
    this.confirmDeleteButton.addEventListener('click', () => this.handleDeleteConfirm());
    this.closeDetailsButton.addEventListener('click', () => this.hideDetailsModal());

    // Close modals when clicking outside
    this.characterModal.addEventListener('click', (e) => {
      if (e.target === this.characterModal) {
        this.hideCharacterModal();
      }
    });
    this.deleteModal.addEventListener('click', (e) => {
      if (e.target === this.deleteModal) {
        this.hideDeleteModal();
      }
    });
    this.detailsModal.addEventListener('click', (e) => {
      if (e.target === this.detailsModal) {
        this.hideDetailsModal();
      }
    });

    // Listen for character updates from content script
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.type === 'PAGE_ANALYSIS') {
        this.updateCharacterFromPageAnalysis(message.data);
      }
    });
  }

  private async loadCharacters() {
    const store = await this.getCharacterStore();
    this.renderCharacterList(store.characters);
    
    // Set active character or default if none is set
    const activeCharacter = store.activeCharacterId 
      ? store.characters.find(c => c.id === store.activeCharacterId)
      : this.DEFAULT_CHARACTER;
      
    if (activeCharacter) {
      this.renderActiveCharacter(activeCharacter);
    }
  }

  private async getCharacterStore(): Promise<CharacterStore> {
    return new Promise((resolve) => {
      chrome.storage.local.get(['characterStore'], (result) => {
        resolve(result.characterStore || { characters: [] });
      });
    });
  }

  private async saveCharacterStore(store: CharacterStore) {
    return new Promise<void>((resolve) => {
      chrome.storage.local.set({ characterStore: store }, resolve);
    });
  }

  private showCharacterModal() {
    this.characterModal.classList.add('show');
    this.characterForm.reset();
  }

  private hideCharacterModal() {
    this.characterModal.classList.remove('show');
  }

  private showDeleteModal(character: Character) {
    this.characterToDelete = character;
    this.deleteModal.classList.add('show');
  }

  private hideDeleteModal() {
    this.deleteModal.classList.remove('show');
    this.characterToDelete = null;
  }

  private showDetailsModal(character: Character) {
    this.detailsTitle.textContent = character.name;
    this.detailsContent.textContent = character.text || 'No content yet';
    this.detailsModal.classList.add('show');
  }

  private hideDetailsModal() {
    this.detailsModal.classList.remove('show');
  }

  private async handleDeleteConfirm() {
    if (!this.characterToDelete) return;

    const store = await this.getCharacterStore();
    store.characters = store.characters.filter(c => c.id !== this.characterToDelete!.id);
    
    if (store.activeCharacterId === this.characterToDelete.id) {
      store.activeCharacterId = undefined;
      this.renderActiveCharacter(this.DEFAULT_CHARACTER);
    }
    
    await this.saveCharacterStore(store);
    this.renderCharacterList(store.characters);
    this.hideDeleteModal();
  }

  private async handleCharacterSubmit(e: Event) {
    e.preventDefault();
    
    const form = e.target as HTMLFormElement;
    const characterNameInput = form.querySelector('input[name="characterName"]') as HTMLInputElement;
    
    const character: Character = {
      id: crypto.randomUUID(),
      name: characterNameInput.value,
      text: '',
      createdAt: Date.now(),
      lastModified: Date.now(),
    };

    const store = await this.getCharacterStore();
    store.characters.push(character);
    await this.saveCharacterStore(store);
    
    this.hideCharacterModal();
    this.loadCharacters();
  }

  private renderActiveCharacter(character: Character) {
    this.activeCharacterSection.textContent = character.name;
  }

  private renderCharacterList(characters: Character[]) {
    this.characterList.innerHTML = '';
    
    // Add default personality first
    this.renderCharacterItem(this.DEFAULT_CHARACTER);
    
    // Then add other personalities
    characters.forEach(character => {
      this.renderCharacterItem(character);
    });
  }

  private renderCharacterItem(character: Character) {
    const element = document.createElement('div');
    element.className = 'character-item bg-white rounded-xl shadow-sm p-6 border border-gray-200';
    element.addEventListener('click', () => this.showDetailsModal(character));
    
    const content = document.createElement('div');
    content.className = 'flex justify-between items-center';
    
    const nameSection = document.createElement('div');
    nameSection.className = 'flex-1';
    
    const name = document.createElement('h3');
    name.className = 'text-xl font-medium text-gray-900';
    name.textContent = character.name;
    
    nameSection.appendChild(name);
    
    // Show empty state message when no content
    if (!character.text) {
      const emptyMessage = document.createElement('p');
      emptyMessage.className = 'text-sm text-gray-500 mt-2';
      emptyMessage.textContent = 'Learn from current page';
      nameSection.appendChild(emptyMessage);
    }
    
    const actions = document.createElement('div');
    actions.className = 'flex items-center gap-3';
    
    const switchButton = document.createElement('button');
    switchButton.className = 'switch-button px-3 py-1.5 text-sm text-gray-700 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50';
    switchButton.textContent = 'Switch to';
    switchButton.onclick = async (e) => {
      e.stopPropagation();
      const store = await this.getCharacterStore();
      store.activeCharacterId = character.id === 'default' ? undefined : character.id;
      await this.saveCharacterStore(store);
      this.renderActiveCharacter(character);
    };
    
    // Only show delete button for non-default personalities
    if (character.id !== 'default') {
      const deleteButton = document.createElement('button');
      deleteButton.className = 'delete-button px-3 py-1.5 text-sm text-red-600 hover:text-red-700 border border-red-200 rounded-lg hover:bg-red-50';
      deleteButton.textContent = 'Delete';
      deleteButton.onclick = (e) => {
        e.stopPropagation();
        this.showDeleteModal(character);
      };
      actions.appendChild(deleteButton);
    }
    
    actions.insertBefore(switchButton, actions.firstChild);
    
    content.appendChild(nameSection);
    content.appendChild(actions);
    element.appendChild(content);
    
    this.characterList.appendChild(element);
  }

  private async learnFromCurrentPage() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab.id) return;

    chrome.tabs.sendMessage(tab.id, { type: 'ANALYZE_PAGE' });
  }

  private async updateCharacterFromPageAnalysis(analysis: {
    text?: string;
  }) {
    const store = await this.getCharacterStore();
    if (!store.activeCharacterId) return;

    const character = store.characters.find(c => c.id === store.activeCharacterId);
    if (!character) return;

    // Update character with new information
    if (analysis.text) {
      character.text = analysis.text;
    }

    character.lastModified = Date.now();
    await this.saveCharacterStore(store);
    this.renderActiveCharacter(character);
    this.renderCharacterList(store.characters);
  }
}

// Initialize the character builder when the popup loads
document.addEventListener('DOMContentLoaded', () => {
  new CharacterBuilder();
});
