import { Profile, ProfileStore, Settings } from '../types';

class ProfileBuilder {
  private activeProfileSection: HTMLDivElement;
  private profileList: HTMLDivElement;
  private createProfileButton: HTMLButtonElement;
  private learnFromPageButton: HTMLButtonElement;
  private settingsButton: HTMLButtonElement;
  private profileModal: HTMLDivElement;
  private deleteModal: HTMLDivElement;
  private detailsModal: HTMLDivElement;
  private detailsTitle: HTMLHeadingElement;
  private detailsContent: HTMLDivElement;
  private closeDetailsButton: HTMLButtonElement;
  private profileForm: HTMLFormElement;
  private cancelProfileButton: HTMLButtonElement;
  private cancelDeleteButton: HTMLButtonElement;
  private confirmDeleteButton: HTMLButtonElement;
  private profileToDelete: Profile | null = null;

  private readonly DEFAULT_PROFILE: Profile = {
    id: 'default',
    name: 'Default',
    text: '',
    createdAt: 0,
    lastModified: 0,
  };

  constructor() {
    this.activeProfileSection = document.getElementById('activeProfile') as HTMLDivElement;
    this.profileList = document.getElementById('profileList') as HTMLDivElement;
    this.createProfileButton = document.getElementById('createProfile') as HTMLButtonElement;
    this.learnFromPageButton = document.getElementById('learnFromPage') as HTMLButtonElement;
    this.settingsButton = document.getElementById('settingsButton') as HTMLButtonElement;
    this.profileModal = document.getElementById('profileModal') as HTMLDivElement;
    this.deleteModal = document.getElementById('deleteModal') as HTMLDivElement;
    this.detailsModal = document.getElementById('detailsModal') as HTMLDivElement;
    this.detailsTitle = document.getElementById('detailsTitle') as HTMLHeadingElement;
    this.detailsContent = document.getElementById('detailsContent') as HTMLDivElement;
    this.closeDetailsButton = document.getElementById('closeDetails') as HTMLButtonElement;
    this.profileForm = document.getElementById('profileForm') as HTMLFormElement;
    this.cancelProfileButton = document.getElementById('cancelProfile') as HTMLButtonElement;
    this.cancelDeleteButton = document.getElementById('cancelDelete') as HTMLButtonElement;
    this.confirmDeleteButton = document.getElementById('confirmDelete') as HTMLButtonElement;

    this.initializeEventListeners();
    this.loadProfiles();
  }

  private initializeEventListeners() {
    this.createProfileButton.addEventListener('click', () => this.showProfileModal());
    this.cancelProfileButton.addEventListener('click', () => this.hideProfileModal());
    this.profileForm.addEventListener('submit', (e) => this.handleProfileSubmit(e));
    this.settingsButton.addEventListener('click', () => {
      window.location.href = 'options.html';
    });
    this.learnFromPageButton.addEventListener('click', () => this.learnFromCurrentPage());
    this.cancelDeleteButton.addEventListener('click', () => this.hideDeleteModal());
    this.confirmDeleteButton.addEventListener('click', () => this.handleDeleteConfirm());
    this.closeDetailsButton.addEventListener('click', () => this.hideDetailsModal());

    // Close modals when clicking outside
    this.profileModal.addEventListener('click', (e) => {
      if (e.target === this.profileModal) {
        this.hideProfileModal();
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

    // Listen for profile updates from content script
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.type === 'PAGE_ANALYSIS') {
        this.updateProfileFromPageAnalysis(message.data);
      }
    });
  }

  private showProfileModal() {
    this.profileModal.classList.add('show');
    this.profileForm.reset();
  }

  private hideProfileModal() {
    this.profileModal.classList.remove('show');
  }

  private showDeleteModal(profile: Profile) {
    this.deleteModal.classList.add('show');
    this.profileToDelete = profile;
  }

  private hideDeleteModal() {
    this.deleteModal.classList.remove('show');
    this.profileToDelete = null;
  }

  private showDetailsModal(profile: Profile) {
    this.detailsTitle.textContent = profile.name;
    this.detailsContent.textContent = profile.text || 'No content yet';
    this.detailsModal.classList.add('show');
  }

  private hideDetailsModal() {
    this.detailsModal.classList.remove('show');
  }

  private async handleDeleteConfirm() {
    if (!this.profileToDelete) return;

    const store = await this.getProfileStore();
    store.profiles = store.profiles.filter(p => p.id !== this.profileToDelete!.id);
    
    if (store.activeProfileId === this.profileToDelete.id) {
      store.activeProfileId = undefined;
      this.renderActiveProfile(this.DEFAULT_PROFILE);
    }
    
    await this.saveProfileStore(store);
    this.renderProfileList(store.profiles);
    this.hideDeleteModal();
  }

  private async handleProfileSubmit(e: Event) {
    e.preventDefault();
    
    const form = e.target as HTMLFormElement;
    const profileNameInput = form.querySelector('input[name="profileName"]') as HTMLInputElement;
    
    const profile: Profile = {
      id: crypto.randomUUID(),
      name: profileNameInput.value,
      text: '',
      createdAt: Date.now(),
      lastModified: Date.now(),
    };

    const store = await this.getProfileStore();
    store.profiles.push(profile);
    await this.saveProfileStore(store);
    
    this.hideProfileModal();
    this.loadProfiles();
  }

  private renderActiveProfile(profile: Profile) {
    this.activeProfileSection.textContent = profile.name;
  }

  private async loadProfiles() {
    const store = await this.getProfileStore();
    this.renderProfileList(store.profiles);
    
    // Set active profile or default if none is set
    const activeProfile = store.activeProfileId 
      ? store.profiles.find(p => p.id === store.activeProfileId)
      : this.DEFAULT_PROFILE;
      
    if (activeProfile) {
      this.renderActiveProfile(activeProfile);
    }
  }

  private async getProfileStore(): Promise<ProfileStore> {
    return new Promise((resolve) => {
      chrome.storage.local.get(['profileStore'], (result) => {
        resolve(result.profileStore || { profiles: [] });
      });
    });
  }

  private async saveProfileStore(store: ProfileStore) {
    return new Promise<void>((resolve) => {
      chrome.storage.local.set({ profileStore: store }, resolve);
    });
  }

  private renderProfileList(profiles: Profile[]) {
    this.profileList.innerHTML = '';
    
    // Add default profile first
    this.renderProfileItem(this.DEFAULT_PROFILE);
    
    // Then add other profiles
    profiles.forEach(profile => {
      this.renderProfileItem(profile);
    });
  }

  private renderProfileItem(profile: Profile) {
    const element = document.createElement('div');
    element.className = 'profile-item bg-white rounded-xl shadow-sm p-6 border border-gray-200';
    element.addEventListener('click', () => this.showDetailsModal(profile));
    
    const content = document.createElement('div');
    content.className = 'flex justify-between items-center';
    
    const nameSection = document.createElement('div');
    nameSection.className = 'flex-1';
    
    const name = document.createElement('h3');
    name.className = 'text-xl font-medium text-gray-900';
    name.textContent = profile.name;
    
    nameSection.appendChild(name);
    
    // Show empty state message when no content
    if (!profile.text) {
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
      const store = await this.getProfileStore();
      store.activeProfileId = profile.id === 'default' ? undefined : profile.id;
      await this.saveProfileStore(store);
      this.renderActiveProfile(profile);
    };
    
    // Only show delete button for non-default profiles
    if (profile.id !== 'default') {
      const deleteButton = document.createElement('button');
      deleteButton.className = 'delete-button px-3 py-1.5 text-sm text-red-600 hover:text-red-700 border border-red-200 rounded-lg hover:bg-red-50';
      deleteButton.textContent = 'Delete';
      deleteButton.onclick = (e) => {
        e.stopPropagation();
        this.showDeleteModal(profile);
      };
      actions.appendChild(deleteButton);
    }
    
    actions.insertBefore(switchButton, actions.firstChild);
    
    content.appendChild(nameSection);
    content.appendChild(actions);
    element.appendChild(content);
    
    this.profileList.appendChild(element);
  }

  private async learnFromCurrentPage() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab.id) return;

    chrome.tabs.sendMessage(tab.id, { type: 'ANALYZE_PAGE' });
  }

  private async updateProfileFromPageAnalysis(analysis: {
    text?: string;
  }) {
    const store = await this.getProfileStore();
    if (!store.activeProfileId) return;

    const profile = store.profiles.find(p => p.id === store.activeProfileId);
    if (!profile) return;

    // Update profile with new information
    if (analysis.text) {
      profile.text = analysis.text;
    }

    profile.lastModified = Date.now();
    await this.saveProfileStore(store);
    this.renderActiveProfile(profile);
    this.renderProfileList(store.profiles);
  }
}

// Initialize the profile builder when the popup loads
document.addEventListener('DOMContentLoaded', () => {
  new ProfileBuilder();
});
