document.addEventListener('DOMContentLoaded', function() {
  const autoSubmitCheckbox = document.getElementById('autoSubmitCheckbox');
  const closeTabCheckbox = document.getElementById('closeTabCheckbox');
  const buzzEarnedElement = document.getElementById('buzzEarned');
  const resetStatsBtn = document.getElementById('resetStatsBtn');
  
  // Load saved settings
  chrome.storage.local.get(
    ['autoSubmit', 'closeTab', 'buzzEarned'], 
    function(result) {
      // Auto-submit setting
      if (result.autoSubmit !== undefined) {
        autoSubmitCheckbox.checked = result.autoSubmit;
      } else {
        chrome.storage.local.set({ autoSubmit: true });
      }
      
      // Close tab setting
      if (result.closeTab !== undefined) {
        closeTabCheckbox.checked = result.closeTab;
      } else {
        chrome.storage.local.set({ closeTab: true });
      }
      
      // BUZZ earned
      if (result.buzzEarned) {
        buzzEarnedElement.textContent = result.buzzEarned.toFixed(2);
      } else {
        chrome.storage.local.set({ buzzEarned: 0 });
      }
    }
  );
  
  // Save settings when changed
  autoSubmitCheckbox.addEventListener('change', function() {
    chrome.storage.local.set({ autoSubmit: this.checked });
  });
  
  closeTabCheckbox.addEventListener('change', function() {
    chrome.storage.local.set({ closeTab: this.checked });
  });
  
  // Reset stats button
  resetStatsBtn.addEventListener('click', function() {
    if (confirm('Are you sure you want to reset your BUZZ earnings stats?')) {
      chrome.storage.local.set({ buzzEarned: 0 });
      buzzEarnedElement.textContent = '0';
    }
  });
  
  // Listen for messages from background script to update stats
  chrome.runtime.onMessage.addListener(function(message) {
    if (message.action === 'updateBuzzEarned' && message.amount) {
      const currentAmount = parseFloat(buzzEarnedElement.textContent) || 0;
      const newAmount = currentAmount + parseFloat(message.amount);
      buzzEarnedElement.textContent = newAmount.toFixed(2);
      chrome.storage.local.set({ buzzEarned: newAmount });
    }
  });

  console.log('Looking for buzz elements...');
  const allButtons = document.querySelectorAll('button');
  console.log('All buttons on page:', allButtons.length);
  
  const replyButtons = Array.from(allButtons).filter(button => 
    button.textContent.toLowerCase().includes('reply') && 
    button.textContent.toLowerCase().includes('earn')
  );
  console.log('Reply & Earn buttons found:', replyButtons.length, replyButtons);
}); 