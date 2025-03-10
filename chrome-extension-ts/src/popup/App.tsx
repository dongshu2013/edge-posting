import React, { useState } from 'react';
import ApiKeyForm from './components/ApiKeyForm';
import SettingsToggle from './components/SettingsToggle';
import BuzzCardExtractor from './components/BuzzCardExtractor';
import './styles.css';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'extract' | 'settings'>('extract');

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>BUZZ Reply Helper</h1>
        <div className="tab-navigation">
          <button 
            className={activeTab === 'extract' ? 'active' : ''} 
            onClick={() => setActiveTab('extract')}
          >
            Extract Buzz Cards
          </button>
          <button 
            className={activeTab === 'settings' ? 'active' : ''} 
            onClick={() => setActiveTab('settings')}
          >
            Settings
          </button>
        </div>
      </header>

      <main className="app-content">
        {activeTab === 'extract' ? (
          <BuzzCardExtractor />
        ) : (
          <div className="settings-container">
            <ApiKeyForm />
            <SettingsToggle />
          </div>
        )}
      </main>

      <footer className="app-footer">
        <p>BUZZ Reply Helper v1.0.0</p>
      </footer>
    </div>
  );
};

export default App; 