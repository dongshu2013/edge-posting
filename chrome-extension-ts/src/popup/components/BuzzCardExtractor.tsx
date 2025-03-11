import React, { useState, useEffect } from 'react';
import { safeStorageGet } from '../../lib/storage';
import { extractBuzzCardsWithAI } from '../../lib/api';
import { BuzzCard } from '../../lib/types';
import { simplifyHTML } from '../../lib/twitter';

const BuzzCardExtractor: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [buzzCards, setBuzzCards] = useState<BuzzCard[]>([]);
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('');

  useEffect(() => {
    // Load API key and model
    safeStorageGet<{ apiKey?: string, model?: string }>(['apiKey', 'model']).then((result) => {
      if (result.apiKey) setApiKey(result.apiKey);
      if (result.model) setModel(result.model);
    });
  }, []);

  const extractBuzzCards = async () => {
    if (!apiKey) {
      setError('Please set your OpenRouter API key in the Settings tab');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Get the current active tab
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tabs.length === 0) {
        throw new Error('No active tab found');
      }

      const tab = tabs[0];
      if (!tab.id) {
        throw new Error('Tab ID not found');
      }

      // Define the getPageHTML function that will be injected into the page
      function pageHTMLGetter() {
        // This function runs in the context of the web page
        return document.documentElement.outerHTML;
      }

      // Execute script to get the page HTML
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: pageHTMLGetter
      });

      if (!results || results.length === 0) {
        throw new Error('Failed to get page HTML');
      }

      const html = results[0].result;
      if (!html) {
        throw new Error('No HTML content found');
      }

      // Simplify the HTML here in the extension context, not in the page context
      const simplifiedHtml = simplifyHTML(html);

      // Extract buzz cards using AI
      const response = await extractBuzzCardsWithAI(simplifiedHtml, apiKey, model);
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to extract buzz cards');
      }

      setBuzzCards(response.data || []);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
      console.error('Error extracting buzz cards:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAutoReply = async (buzzCard: BuzzCard) => {
    if (!buzzCard.tweetLink) {
      setError('No tweet link found for this buzz card');
      return;
    }

    try {
      // Send message to background script to open Twitter with auto-reply
      await chrome.runtime.sendMessage({
        action: 'openTwitterWithReply',
        tweetLink: buzzCard.tweetLink,
        replyText: buzzCard.instructions || 'Great post!',
        buzzId: buzzCard.id
      });

      // Close the popup
      window.close();
    } catch (err: any) {
      setError(err.message || 'Failed to open Twitter');
      console.error('Error opening Twitter:', err);
    }
  };

  return (
    <div className="buzz-card-extractor">
      <div className="extractor-header">
        <h2>Extract Buzz Cards</h2>
        <button 
          onClick={extractBuzzCards} 
          disabled={loading || !apiKey}
          className="extract-button"
        >
          {loading ? 'Extracting...' : 'Extract Buzz Cards'}
        </button>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {loading ? (
        <div className="loading">
          <div className="spinner"></div>
          <span>Extracting buzz cards...</span>
        </div>
      ) : buzzCards.length > 0 ? (
        <div className="buzz-card-list">
          {buzzCards.map((card, index) => (
            <div key={card.id || index} className="buzz-card">
              <div className="buzz-card-header">
                <h3 className="buzz-card-title">Buzz Card #{index + 1}</h3>
                <span className="buzz-card-price">{card.price} BUZZ</span>
              </div>
              <div className="buzz-card-instructions">
                {card.instructions || 'No instructions provided'}
              </div>
              <div className="buzz-card-footer">
                <span>Created by: {card.createdBy || 'Unknown'}</span>
                <span>Replies: {card.replyCount || 0}/{card.totalReplies || '∞'}</span>
              </div>
              <div className="buzz-card-actions">
                <button onClick={() => handleAutoReply(card)}>
                  Auto Reply
                </button>
                <button onClick={() => window.open(card.tweetLink, '_blank')}>
                  Open Tweet
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="no-cards">
          <p>No buzz cards extracted yet. Click the "Extract Buzz Cards" button to get started.</p>
          {!apiKey && (
            <p className="api-key-warning">
              Please set your OpenRouter API key in the Settings tab first.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default BuzzCardExtractor; 