import React, { useState, useEffect } from 'react';
import { safeStorageGet, safeStorageSet } from '../../lib/storage';

const ApiKeyForm: React.FC = () => {
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('google/gemini-2.0-flash-001');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    // Load saved API key and model
    safeStorageGet<{ apiKey?: string, model?: string }>(['apiKey', 'model']).then((result) => {
      if (result.apiKey) setApiKey(result.apiKey);
      if (result.model) setModel(result.model);
    });
  }, []);

  const handleSave = async () => {
    await safeStorageSet({ apiKey, model });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="api-key-form">
      <h2>API Settings</h2>
      
      <div className="form-group">
        <label htmlFor="apiKey">OpenRouter API Key:</label>
        <input
          type="password"
          id="apiKey"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="Enter your OpenRouter API key"
        />
      </div>
      
      <div className="form-group">
        <label htmlFor="modelSelect">AI Model:</label>
        <select 
          id="modelSelect" 
          value={model}
          onChange={(e) => setModel(e.target.value)}
        >
          <option value="google/gemini-2.0-flash-001">Gemini 2.0 Flash</option>
          <option value="openai/gpt-4-turbo">GPT-4 Turbo</option>
          <option value="anthropic/claude-3-opus-20240229">Claude 3 Opus</option>
          <option value="anthropic/claude-3-sonnet-20240229">Claude 3 Sonnet</option>
          <option value="anthropic/claude-3-haiku-20240307">Claude 3 Haiku</option>
        </select>
      </div>
      
      <button onClick={handleSave} className="save-button">
        {saved ? 'Saved!' : 'Save API Settings'}
      </button>
    </div>
  );
};

export default ApiKeyForm; 