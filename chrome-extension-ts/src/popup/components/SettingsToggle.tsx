import React, { useState, useEffect } from 'react';
import { safeStorageGet, safeStorageSet } from '../../lib/storage';

interface ExtensionSettings {
  autoSubmit: boolean;
  closeTab: boolean;
  enableAutoReply: boolean;
}

const SettingsToggle: React.FC = () => {
  const [settings, setSettings] = useState<ExtensionSettings>({
    autoSubmit: true,
    closeTab: true,
    enableAutoReply: true
  });

  useEffect(() => {
    // Load saved settings
    safeStorageGet<ExtensionSettings>(['autoSubmit', 'closeTab', 'enableAutoReply']).then((result) => {
      setSettings({
        autoSubmit: result.autoSubmit !== false,
        closeTab: result.closeTab !== false,
        enableAutoReply: result.enableAutoReply !== false
      });
    });
  }, []);

  const handleToggle = async (setting: keyof ExtensionSettings) => {
    const newSettings = {
      ...settings,
      [setting]: !settings[setting]
    };
    
    setSettings(newSettings);
    await safeStorageSet({ [setting]: newSettings[setting] });
    
    // If we're toggling the auto-reply setting, update the visibility of buttons
    if (setting === 'enableAutoReply') {
      // Send message to all Edge Posting tabs to update button visibility
      const tabs = await chrome.tabs.query({ 
        url: [
          "http://localhost:*/buzz*",
          "https://edge-posting.vercel.app/buzz*",
          "https://*.vercel.app/buzz*"
        ]
      });
      
      tabs.forEach(tab => {
        if (tab.id) {
          chrome.tabs.sendMessage(tab.id, {
            action: 'updateAutoReplyVisibility',
            enabled: newSettings.enableAutoReply
          });
        }
      });
    }
  };

  return (
    <div className="settings-toggle">
      <h2>Extension Settings</h2>
      
      <div className="toggle-group">
        <label className="toggle">
          <input
            type="checkbox"
            checked={settings.autoSubmit}
            onChange={() => handleToggle('autoSubmit')}
          />
          <span className="toggle-label">Auto-submit replies</span>
        </label>
        <p className="toggle-description">
          Automatically submit the reply URL after capturing it
        </p>
      </div>
      
      <div className="toggle-group">
        <label className="toggle">
          <input
            type="checkbox"
            checked={settings.closeTab}
            onChange={() => handleToggle('closeTab')}
          />
          <span className="toggle-label">Auto-close Twitter tabs</span>
        </label>
        <p className="toggle-description">
          Automatically close Twitter tabs after capturing reply URLs
        </p>
      </div>
      
      <div className="toggle-group">
        <label className="toggle">
          <input
            type="checkbox"
            checked={settings.enableAutoReply}
            onChange={() => handleToggle('enableAutoReply')}
          />
          <span className="toggle-label">Show Auto Reply buttons</span>
        </label>
        <p className="toggle-description">
          Show Auto Reply buttons next to Reply & Earn buttons on Edge Posting
        </p>
      </div>
    </div>
  );
};

export default SettingsToggle; 