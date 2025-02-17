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
    
    document.getElementById('logout-button')?.addEventListener('click', async () => {
      const button = document.getElementById('logout-button');
      button.disabled = true;
      button.textContent = 'Logging out...';
      const success = await SpotifyService.logout();
      if (!success) {
        button.disabled = false;
        button.textContent = 'Logout';
        alert('Logout failed. Please try again.');
      }
    });
    
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
    loginButton.onclick = async () => {
      await SpotifyService.initiateLogin();
    };
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
  
  if (request.type === 'AUTH_STATUS_CHANGED') {
    console.log('Auth status changed, reloading panel...');
    // Clear any existing content
    const authContainer = document.getElementById('auth-container');
    if (authContainer) {
      authContainer.innerHTML = '';
    }
    // Reload after a short delay to ensure state is updated
    setTimeout(() => {
      window.location.reload();
    }, 500);
  }

  if (request.type === 'LOGIN_SUCCESS') {
    window.location.reload();
  }
});

// Initialize both scan button and Spotify auth when the panel loads
document.addEventListener('DOMContentLoaded', () => {
  initializeScanButton();
  initializeSpotifyAuth();
});
