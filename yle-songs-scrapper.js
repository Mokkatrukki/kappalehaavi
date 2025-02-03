function extractSongs(text) {
  if (!text) return [];
  
  const lines = text.split('\n');
  const songPatterns = [
    /^\d+\.\s*(.+?)(?::|-)(.+)$/, // numbered pattern: "1. Artist: Song"
    /^(?:\d+\.\s*)?(.+?)(?::|-)(.+)$/, // optional number pattern
    /^(.+?)\s*[:-]\s*(.+)$/, // basic pattern without numbers
  ];

  const MAX_LINE_LENGTH = 150;
  const MIN_LINE_LENGTH = 3; // Avoid one or two character matches
  
  const songs = lines
    .map(line => {
      line = line.trim();
      if (!line || line.length < MIN_LINE_LENGTH || line.length > MAX_LINE_LENGTH) return null;
      
      for (const pattern of songPatterns) {
        const match = line.match(pattern);
        if (match) {
          const artist = match[1].trim();
          const title = match[2].trim();
          
          // Enhanced validation
          if (artist.length > 50 || title.length > 50) return null;
          if (artist.length < 2 || title.length < 2) return null; // Skip too short entries
          if (artist.includes('.') && !artist.match(/^\d+\./)) return null;
          if (artist.toLowerCase().includes('existing code')) return null; // Skip code comments
          
          return { artist, title };
        }
      }
      return null;
    })
    .filter(song => song !== null);
  
  return songs;
}

function getCardDescriptions() {
  try {
    console.log('🔍 Searching for card descriptions...');
    
    const verticalList = document.querySelector('.VerticalList_wrapper__JTotL');
    const elements = verticalList?.querySelectorAll('.Card_textContentWrapper__65Uqg');
    
    if (!elements || elements.length === 0) {
      throw new Error('No song entries found. Please make sure you are on a YLE Areena page with song listings.');
    }
    
    const descriptions = Array.from(elements).map((element, index) => {
      const description = element.querySelector('.Card_description__MExCG')?.textContent?.trim() || '';
      
      return {
        id: index + 1,
        title: element.querySelector('.Card_title__snUTV')?.textContent?.trim() || '',
        description: description,
        songs: extractSongs(description),
        date: element.querySelector('.CardLabels_genericLabel__MddZ0:last-child')?.textContent?.trim() || '',
        duration: element.querySelector('.CardLabels_genericLabel__MddZ0:first-child')?.textContent?.trim() || ''
      };
    });
    
    console.log(`✅ Found ${elements.length} items in vertical list:`);
    console.log(JSON.stringify(descriptions, null, 2));
    
    return descriptions;
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    return { error: error.message };
  }
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'scanYleSongs') {
    const descriptions = getCardDescriptions();
    chrome.runtime.sendMessage({ 
      action: 'updateSongList', 
      descriptions 
    });
    sendResponse({ success: true });
  }
});