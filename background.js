chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'scanYleSongs') {
    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      try {
        const tab = tabs[0];
        if (!tab) {
          chrome.runtime.sendMessage({ 
            action: 'updateSongList', 
            error: 'No active tab found. Please refresh the page and try again.' 
          });
          return;
        }

        if (!tab.url || !tab.url.includes('areena.yle.fi')) {
          chrome.runtime.sendMessage({ 
            action: 'updateSongList', 
            error: 'Please navigate to YLE Areena first (areena.yle.fi)' 
          });
          return;
        }

        chrome.tabs.sendMessage(tab.id, { action: 'scanYleSongs' }, (response) => {
          if (chrome.runtime.lastError) {
            chrome.runtime.sendMessage({ 
              action: 'updateSongList', 
              error: 'Could not scan the page. Please refresh and try again.' 
            });
          }
        });
      } catch (error) {
        chrome.runtime.sendMessage({ 
          action: 'updateSongList', 
          error: error.message || 'An unexpected error occurred' 
        });
      }
    });
  } else if (request.action === 'updateSongList') {
    chrome.runtime.sendMessage(request);
  }
});
