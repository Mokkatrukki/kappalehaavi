import config from './config.js';
import * as SpotifyService from './services/spotify-service.js';

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

async function initializeSpotifyAuth() {
  const authContainer = document.createElement('div');
  authContainer.id = 'auth-container';
  authContainer.className = 'auth-container';
  
  const authStatus = await SpotifyService.checkAuth();
  
  if (authStatus.isAuthenticated) {
    const userInfo = document.createElement('div');
    userInfo.className = 'user-info';
    userInfo.innerHTML = `
      <span>Logged in as ${authStatus.user.displayName}</span>
      <button id="logout-button">Logout</button>
    `;
    authContainer.appendChild(userInfo);
    
    const playlistSelect = document.createElement('select');
    playlistSelect.id = 'playlist-select';
    const playlists = await SpotifyService.getUserPlaylists();
    playlistSelect.innerHTML = `
      <option value="">Create New Playlist</option>
      ${playlists.map(p => `<option value="${p.id}">${p.name}</option>`).join('')}
    `;
    authContainer.appendChild(playlistSelect);
  } else {
    const loginButton = document.createElement('button');
    loginButton.textContent = 'Login with Spotify';
    loginButton.onclick = () => window.location.href = `${config.BACKEND_URL}/auth/login`;
    authContainer.appendChild(loginButton);
  }
  
  document.getElementById('controls').prepend(authContainer);
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
      <button class="add-to-spotify">Add to Spotify</button>
      <div class="songs" ${index !== 0 ? 'style="display:none;"' : ''}>
        ${desc.songs.map(song => `<p>${song.artist} - ${song.title}</p>`).join('')}
      </div>
    `;
    section.querySelector('h2').addEventListener('click', () => {
      const songsDiv = section.querySelector('.songs');
      songsDiv.style.display = songsDiv.style.display === 'none' ? 'block' : 'none';
    });

    section.querySelector('.add-to-spotify').addEventListener('click', async () => {
      const authStatus = await SpotifyService.checkAuth();
      if (!authStatus.isAuthenticated) {
        window.location.href = `${config.BACKEND_URL}/auth/login`;
        return;
      }

      const playlistSelect = document.getElementById('playlist-select');
      const songs = desc.songs.filter(song => song.artist && song.title);

      try {
        let result;
        if (playlistSelect.value) {
          // Add to existing playlist
          result = await SpotifyService.addSongsToPlaylist(playlistSelect.value, songs);
        } else {
          // Create new playlist
          result = await SpotifyService.createPlaylist(desc.title, songs);
        }

        if (result.success) {
          alert(playlistSelect.value ? 'Songs added to playlist successfully!' : 'New playlist created successfully!');
        } else {
          alert('Failed: ' + (result.error || 'Unknown error'));
        }
      } catch (error) {
        alert('Operation failed: ' + error.message);
      }
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

// Initialize both scan button and Spotify auth when the panel loads
document.addEventListener('DOMContentLoaded', () => {
  initializeScanButton();
  initializeSpotifyAuth();
});
