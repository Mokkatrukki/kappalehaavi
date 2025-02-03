// Add your JavaScript code here
console.log("Side panel script loaded.");

// Add scan button functionality
function initializeScanButton() {
  const scanButton = document.createElement('button');
  scanButton.textContent = 'Scan YLE Songs';
  scanButton.id = 'scanButton';
  scanButton.addEventListener('click', () => {
    console.log('Initiating YLE song scan...');
    const songListContainer = document.getElementById('song-list');
    songListContainer.innerHTML = ''; // Clear previous results
    chrome.runtime.sendMessage({ action: 'scanYleSongs' });
    scanButton.disabled = true;
    scanButton.textContent = 'Scanning...';
  });
  document.getElementById('controls').appendChild(scanButton);
}

function createSongList(descriptions) {
  const songListContainer = document.getElementById('song-list');
  songListContainer.innerHTML = ''; // Clear previous results

  if (!descriptions || descriptions.length === 0) {
    songListContainer.innerHTML = '<p class="error">No songs found. Please try again.</p>';
    return;
  }

  descriptions.forEach((desc, index) => {
    if (!desc.songs || desc.songs.length === 0) return; // Skip entries without songs

    const section = document.createElement('section');
    section.innerHTML = `
      <h2>${desc.title} - ${desc.date}</h2>
      <div class="songs" ${index !== 0 ? 'style="display:none;"' : ''}>
        ${desc.songs.map(song => `<p>${song.artist} - ${song.title}</p>`).join('')}
      </div>
    `;
    section.querySelector('h2').addEventListener('click', () => {
      const songsDiv = section.querySelector('.songs');
      songsDiv.style.display = songsDiv.style.display === 'none' ? 'block' : 'none';
    });
    songListContainer.appendChild(section);
  });
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'updateSongList') {
    const scanButton = document.getElementById('scanButton');
    if (scanButton) {
      scanButton.disabled = false;
      scanButton.textContent = 'Scan YLE Songs';
    }

    if (request.error) {
      const songList = document.getElementById('song-list');
      songList.innerHTML = `<p class="error">${request.error}</p>`;
      return;
    }

    createSongList(request.descriptions);
  }
});

// Initialize the scan button when the panel loads
document.addEventListener('DOMContentLoaded', initializeScanButton);
