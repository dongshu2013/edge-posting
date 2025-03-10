// Function to get the HTML of the current page
// This needs to be in the global scope to be accessible from executeScript
function getPageHTML() {
  // Get the full HTML
  const fullHTML = document.documentElement.outerHTML;
  
  // Simplify HTML to reduce token usage
  return simplifyHTML(fullHTML);
}

// Function to simplify HTML
// This needs to be in the global scope to be accessible from getPageHTML
function simplifyHTML(html) {
  // Remove scripts, styles, and unnecessary attributes to reduce token count
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/ (onclick|onload|onunload|onchange|onsubmit|ondblclick|onmouseover|onmouseout|onkeydown|onkeypress)="[^"]*"/gi, '')
    .replace(/ class="[^"]*"/gi, '')
    .replace(/ id="[^"]*"/gi, '')
    .replace(/ data-[^=]*="[^"]*"/gi, '');
}

document.addEventListener('DOMContentLoaded', function() {
  // Tab switching functionality
  const tabs = document.querySelectorAll('.tab');
  const tabContents = document.querySelectorAll('.tab-content');
  
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      // Remove active class from all tabs and contents
      tabs.forEach(t => t.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));
      
      // Add active class to clicked tab and corresponding content
      tab.classList.add('active');
      const tabId = tab.getAttribute('data-tab');
      document.getElementById(`${tabId}-tab`).classList.add('active');
    });
  });
  
  // Get UI elements
  const autoSubmitCheckbox = document.getElementById('autoSubmitCheckbox');
  const closeTabCheckbox = document.getElementById('closeTabCheckbox');
  const apiKeyInput = document.getElementById('apiKeyInput');
  const toggleApiKey = document.getElementById('toggleApiKey');
  const modelSelect = document.getElementById('modelSelect');
  const refreshButton = document.getElementById('refreshButton');
  const buzzListContainer = document.getElementById('buzzList');
  
  // Toggle API key visibility
  toggleApiKey.addEventListener('click', function() {
    if (apiKeyInput.type === 'password') {
      apiKeyInput.type = 'text';
      toggleApiKey.textContent = '🔒';
    } else {
      apiKeyInput.type = 'password';
      toggleApiKey.textContent = '👁️';
    }
  });
  
  // Load saved settings
  chrome.storage.local.get(['autoSubmit', 'closeTab', 'apiKey', 'model'], function(result) {
    autoSubmitCheckbox.checked = result.autoSubmit !== false; // Default to true
    closeTabCheckbox.checked = result.closeTab !== false; // Default to true
    
    if (result.apiKey) {
      apiKeyInput.value = result.apiKey;
    }
    
    if (result.model) {
      modelSelect.value = result.model;
    }
  });
  
  // Save settings when changed
  autoSubmitCheckbox.addEventListener('change', function() {
    chrome.storage.local.set({ autoSubmit: this.checked });
  });
  
  closeTabCheckbox.addEventListener('change', function() {
    chrome.storage.local.set({ closeTab: this.checked });
  });
  
  apiKeyInput.addEventListener('change', function() {
    chrome.storage.local.set({ apiKey: this.value });
  });
  
  modelSelect.addEventListener('change', function() {
    chrome.storage.local.set({ model: this.value });
  });
  
  // Function to refresh the buzz list
  refreshButton.addEventListener('click', function() {
    // Clear the cached buzz cards when manually refreshing
    chrome.storage.local.remove(['cachedBuzzCards', 'cachedBuzzTimestamp', 'cachedBuzzUrl'], function() {
      console.log('Cleared buzz card cache');
      loadBuzzCards(true); // Pass true to force refresh
    });
  });
  
  // Function to load buzz cards from the active tab using AI only
  async function loadBuzzCards(forceRefresh = false) {
    buzzListContainer.innerHTML = '<div class="loading">Loading buzz cards...</div>';
    
    try {
      // Get the active tab
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      const activeTab = tabs[0];
      const currentUrl = activeTab.url;
      
      // Check if we're on an Edge Posting page
      if (!currentUrl.includes('edge-posting') && 
          !currentUrl.includes('localhost') && 
          !currentUrl.includes('vercel.app')) {
        buzzListContainer.innerHTML = `
          <div class="empty-state">
            <p>Please navigate to the Edge Posting website to see buzz cards.</p>
          </div>
        `;
        return;
      }
      
      // Check if we have cached buzz cards for this URL and they're not too old
      if (!forceRefresh) {
        const cachedData = await new Promise(resolve => {
          chrome.storage.local.get(['cachedBuzzCards', 'cachedBuzzTimestamp', 'cachedBuzzUrl'], resolve);
        });
        
        const now = Date.now();
        const cacheAge = now - (cachedData.cachedBuzzTimestamp || 0);
        const cacheMaxAge = 5 * 60 * 1000; // 5 minutes
        
        // Use cached data if it exists, is for the current URL, and is not too old
        if (cachedData.cachedBuzzCards && 
            cachedData.cachedBuzzCards.length > 0 && 
            cachedData.cachedBuzzUrl === currentUrl &&
            cacheAge < cacheMaxAge) {
          console.log('Using cached buzz cards, age:', Math.round(cacheAge / 1000), 'seconds');
          buzzListContainer.innerHTML = '<div class="status">Using cached data. <button id="forceCacheRefresh">Force Refresh</button></div>';
          renderBuzzCards(cachedData.cachedBuzzCards, activeTab.id);
          
          // Add event listener to the force refresh button
          document.getElementById('forceCacheRefresh').addEventListener('click', function() {
            chrome.storage.local.remove(['cachedBuzzCards', 'cachedBuzzTimestamp', 'cachedBuzzUrl'], function() {
              console.log('Cleared buzz card cache');
              loadBuzzCards(true); // Force refresh
            });
          });
          
          return;
        }
      }
      
      buzzListContainer.innerHTML = '<div class="loading">Analyzing page with AI...</div>';
      
      // Get API key and model
      const settings = await new Promise(resolve => {
        chrome.storage.local.get(['apiKey', 'model'], resolve);
      });
      
      if (!settings.apiKey) {
        buzzListContainer.innerHTML = `
          <div class="error">
            <p>Please enter your OpenRouter API key in the Settings tab.</p>
          </div>
        `;
        return;
      }
      
      // Execute script to get page HTML - include both functions in the same script
      const htmlResults = await chrome.scripting.executeScript({
        target: { tabId: activeTab.id },
        func: () => {
          // Define simplifyHTML inside the executed script
          function simplifyHTML(html) {
            return html
              .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
              .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
              .replace(/ (onclick|onload|onunload|onchange|onsubmit|ondblclick|onmouseover|onmouseout|onkeydown|onkeypress)="[^"]*"/gi, '')
              .replace(/ class="[^"]*"/gi, '')
              .replace(/ id="[^"]*"/gi, '')
              .replace(/ data-[^=]*="[^"]*"/gi, '');
          }
          
          // Get the full HTML and simplify it
          const fullHTML = document.documentElement.outerHTML;
          return simplifyHTML(fullHTML);
        }
      });
      
      const html = htmlResults[0].result;
      
      // Use AI to extract buzz cards
      try {
        const buzzCards = await extractBuzzCardsWithAI(html, settings.apiKey, settings.model);
        
        if (buzzCards && buzzCards.length > 0) {
          // Cache the buzz cards
          chrome.storage.local.set({
            cachedBuzzCards: buzzCards,
            cachedBuzzTimestamp: Date.now(),
            cachedBuzzUrl: currentUrl
          });
          console.log('Cached', buzzCards.length, 'buzz cards');
          
          // Render the AI-extracted buzz cards
          renderBuzzCards(buzzCards, activeTab.id);
        } else {
          buzzListContainer.innerHTML = `
            <div class="empty-state">
              <p>No buzz cards found on this page.</p>
              <p>Make sure you're on the Edge Posting buzz page.</p>
            </div>
          `;
        }
      } catch (aiError) {
        console.error('AI extraction error:', aiError);
        buzzListContainer.innerHTML = `
          <div class="error">
            <p>AI analysis failed: ${aiError.message}</p>
            <p>Please check your API key and try again.</p>
          </div>
        `;
      }
    } catch (error) {
      buzzListContainer.innerHTML = `
        <div class="error">
          <p>Error: ${error.message}</p>
        </div>
      `;
    }
  }
  
  // Function to extract buzz cards using AI
  async function extractBuzzCardsWithAI(html, apiKey, model) {
    try {
      // Check if html is null or undefined
      if (!html) {
        console.error('HTML is null or undefined');
        return [];
      }
      
      // Prepare the prompt for the AI
      const prompt = `
        You are an AI specialized in extracting structured data from HTML, with expertise in CSS selectors and DOM analysis.
        
        I need you to analyze the HTML from the Edge Posting website and extract all buzz card information with extreme precision.
        
        CRITICAL REQUIREMENTS:
        1. Each buzz card MUST have a unique and correct ID
        2. Each buzz card MUST have a precise CSS selector that targets ONLY its specific "Reply & Earn X BUZZ" button
        3. Each buzz card MUST have the correct tweet link
        
        For each buzz card, identify:
        - id: The exact unique identifier for this specific buzz card (string, often a UUID or data attribute)
        - buttonSelector: A precise CSS selector that will target ONLY the "Reply & Earn X BUZZ" button for this specific buzz card
        - tweetLink: The exact Twitter/X URL that users need to reply to (string)
        - instructions: The instructions for replying (string)
        - price: The BUZZ token reward amount (number)
        - replyCount: Current number of replies (number)
        - totalReplies: Maximum number of replies allowed (number)
        - createdBy: Creator's address or username (string)
        - username: Display name of creator (string)
        
        For the buttonSelector:
        - Use data attributes, IDs, or other unique identifiers whenever possible
        - Ensure the selector is specific enough to target only one button on the page
        - If needed, use parent-child relationships to ensure uniqueness
        - Example: '[data-buzz-id="123456"] button.reply-button' or '#buzz-card-123456 .reply-button'
        
        For the ID:
        - Look for data-id, data-buzz-id attributes, or any other unique identifier in the HTML
        - If no explicit ID is found, use any unique attribute or combination that can identify this specific buzz card
        - The ID must be different for each buzz card
        
        Return the data as a JSON array of objects with these fields. Each object must represent a single, unique buzz card.
        
        HTML: ${html ? html.substring(0, Math.min(15000, html.length)) : 'No HTML available'}...
      `;
      
      // Make the API request to OpenRouter
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'HTTP-Referer': 'chrome-extension://buzz-reply-helper',
          'X-Title': 'BUZZ Reply Helper'
        },
        body: JSON.stringify({
          model: model || 'google/gemini-2.0-flash-001',
          messages: [
            {
              role: "user",
              content: prompt
            }
          ],
          response_format: { type: "json_object" },
          temperature: 0.2 // Lower temperature for more precise extraction
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`API error (${response.status}): ${errorData.error?.message || 'Unknown error'}`);
      }
      
      const data = await response.json();
      const content = data.choices[0].message.content;
      
      // Parse the JSON from the content
      try {
        const parsedContent = JSON.parse(content);
        
        // Handle different response formats from different models
        let buzzCards = [];
        
        if (Array.isArray(parsedContent)) {
          buzzCards = parsedContent; // Direct array of buzz cards
        } else if (parsedContent.buzzCards && Array.isArray(parsedContent.buzzCards)) {
          buzzCards = parsedContent.buzzCards; // Nested under buzzCards property
        } else if (parsedContent.data && Array.isArray(parsedContent.data)) {
          buzzCards = parsedContent.data; // Nested under data property (some models do this)
        } else if (parsedContent.results && Array.isArray(parsedContent.results)) {
          buzzCards = parsedContent.results; // Nested under results property
        } else {
          // Try to find any array property that might contain the buzz cards
          for (const key in parsedContent) {
            if (Array.isArray(parsedContent[key]) && parsedContent[key].length > 0) {
              buzzCards = parsedContent[key];
              break;
            }
          }
        }
        
        // Validate and clean up the buzz cards
        const validatedBuzzCards = buzzCards.filter(card => {
          // Each card must have an id and buttonSelector
          return card && card.id && card.buttonSelector && card.tweetLink;
        }).map(card => {
          // Ensure all required fields exist
          return {
            id: card.id,
            buttonSelector: card.buttonSelector,
            tweetLink: card.tweetLink,
            instructions: card.instructions || 'No instructions provided',
            price: card.price || 0,
            replyCount: card.replyCount || 0,
            totalReplies: card.totalReplies || 0,
            createdBy: card.createdBy || 'Unknown',
            username: card.username || 'Unknown'
          };
        });
        
        console.log('Extracted buzz cards:', validatedBuzzCards);
        return validatedBuzzCards;
      } catch (parseError) {
        console.error('Error parsing AI response:', parseError);
        
        // Try to extract JSON from the text response
        const jsonMatch = content.match(/\[\s*\{.*\}\s*\]/s);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
        
        throw new Error('Failed to parse AI response');
      }
    } catch (error) {
      console.error('Error calling AI API:', error);
      throw error;
    }
  }
  
  // Function to render buzz cards in the popup
  function renderBuzzCards(buzzCards, tabId) {
    buzzListContainer.innerHTML = '';
    
    // Add a counter to display the number of buzz cards found
    const headerDiv = document.createElement('div');
    headerDiv.className = 'status';
    headerDiv.innerHTML = `Found ${buzzCards.length} buzz cards on this page`;
    buzzListContainer.appendChild(headerDiv);
    
    buzzCards.forEach((buzz, index) => {
      const buzzCard = document.createElement('div');
      buzzCard.className = 'buzz-card';
      buzzCard.innerHTML = `
        <h3>${truncateText(buzz.instructions, 50)}</h3>
        <p class="creator">Created by: ${buzz.username || 'Unknown'}</p>
        <p>Tweet: ${truncateText(buzz.tweetLink, 30)}</p>
        <p class="price">Reward: ${buzz.price} BUZZ</p>
        <p>Replies: ${buzz.replyCount || 0}/${buzz.totalReplies || '?'}</p>
        <p class="buzz-id">ID: ${truncateText(buzz.id, 15)}</p>
        <div class="actions">
          <button class="reply-btn" data-buzz-id="${buzz.id}" data-button-selector="${buzz.buttonSelector || ''}" data-tweet-link="${buzz.tweetLink || ''}">Reply Now</button>
        </div>
      `;
      
      buzzListContainer.appendChild(buzzCard);
      
      // Add click event to the reply button
      const replyBtn = buzzCard.querySelector('.reply-btn');
      replyBtn.addEventListener('click', function() {
        const buzzId = this.getAttribute('data-buzz-id');
        const buttonSelector = this.getAttribute('data-button-selector');
        const tweetLink = this.getAttribute('data-tweet-link');
        
        console.log(`Clicking Reply button for buzz #${index + 1}:`, { 
          buzzId, 
          buttonSelector, 
          tweetLink 
        });
        
        // Execute script to click the corresponding Reply & Earn button
        chrome.scripting.executeScript({
          target: { tabId: tabId },
          func: (buzzId, buttonSelector, tweetLink) => {
            console.log('Looking for Reply & Earn button for buzz ID:', buzzId);
            console.log('Using button selector:', buttonSelector);
            
            // If we have a button selector from AI, try to use it first
            if (buttonSelector) {
              try {
                // For :contains pseudo-selector (not standard CSS)
                if (buttonSelector.includes(':contains(')) {
                  const selectorParts = buttonSelector.match(/(.*):contains\("(.*)"\)/);
                  if (selectorParts) {
                    const baseSelector = selectorParts[1];
                    const containsText = selectorParts[2];
                    
                    const elements = document.querySelectorAll(baseSelector);
                    for (const element of elements) {
                      if (element.textContent.includes(containsText)) {
                        console.log('Found button using AI selector with :contains:', element);
                        element.click();
                        return true;
                      }
                    }
                  }
                } else {
                  // Standard CSS selector
                  const button = document.querySelector(buttonSelector);
                  if (button) {
                    console.log('Found button using AI selector:', button);
                    button.click();
                    return true;
                  } else {
                    console.log('Button not found with selector:', buttonSelector);
                    
                    // Try a more relaxed approach by looking for parts of the selector
                    const selectorParts = buttonSelector.split(' ');
                    if (selectorParts.length > 1) {
                      // Try the last part of the selector which might be more specific
                      const lastPart = selectorParts[selectorParts.length - 1];
                      const buttons = document.querySelectorAll(lastPart);
                      if (buttons.length > 0) {
                        console.log('Found button using partial selector:', buttons[0]);
                        buttons[0].click();
                        return true;
                      }
                    }
                  }
                }
              } catch (error) {
                console.error('Error using AI selector:', error);
              }
            }
            
            // If AI selector failed, try to find the button by ID
            try {
              const buttonById = document.querySelector(`[data-buzz-id="${buzzId}"]`);
              if (buttonById) {
                console.log('Found button by ID:', buttonById);
                buttonById.click();
                return true;
              }
            } catch (error) {
              console.error('Error finding button by ID:', error);
            }
            
            // If all else fails, use a generic approach to find buttons
            const allButtons = document.querySelectorAll('button');
            const replyButtons = Array.from(allButtons).filter(button => 
              button.textContent.toLowerCase().includes('reply') && 
              button.textContent.toLowerCase().includes('earn')
            );
            
            if (replyButtons.length > 0) {
              console.log('Found Reply & Earn button (generic approach), clicking it');
              replyButtons[0].click();
              return true;
            }
            
            // If we couldn't find any button but have a tweet link, open it directly in a popup
            if (tweetLink) {
              console.log('No Reply & Earn button found, opening tweet link directly:', tweetLink);
              
              // Send a message to the background script to open Twitter with auto-reply
              if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
                chrome.runtime.sendMessage({
                  action: 'openTwitterWithReply',
                  tweetLink: tweetLink,
                  buzzId: buzzId
                });
                return true;
              } else {
                // Configure popup window dimensions
                const width = 600;
                const height = 700;
                const left = (window.screen.width - width) / 2;
                const top = (window.screen.height - height) / 2;
                
                // Open Twitter in a popup window
                window.open(
                  tweetLink,
                  "twitter_popup",
                  `width=${width},height=${height},left=${left},top=${top},popup=yes,toolbar=no,location=no,status=no,menubar=no,scrollbars=yes,resizable=yes`
                );
                
                return true;
              }
            }
            
            console.log('Could not find Reply & Earn button or tweet link');
            return false;
          },
          args: [buzzId, buttonSelector, tweetLink]
        });
        
        // Close the popup
        window.close();
      });
    });
  }
  
  // Helper function to truncate text
  function truncateText(text, maxLength) {
    if (!text) return 'N/A';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  }
  
  // Load buzz cards when popup opens
  loadBuzzCards();
}); 