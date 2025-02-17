import config from '../config.js';

export async function checkAuth() {
  try {
    const response = await fetch(`${config.BACKEND_URL}/api/auth/status`);
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Auth check failed:', error);
    return { isAuthenticated: false, user: null };
  }
}

export async function logout() {
  try {
    await fetch(`${config.BACKEND_URL}/api/auth/logout`, { method: 'POST' });
    return true;
  } catch (error) {
    console.error('Logout failed:', error);
    return false;
  }
}

export async function getUserPlaylists() {
  try {
    const response = await fetch(`${config.BACKEND_URL}/api/playlists`);
    const data = await response.json();
    return data.success ? data.data : [];
  } catch (error) {
    console.error('Failed to fetch playlists:', error);
    return [];
  }
}

export async function createPlaylist(name, songs) {
  try {
    const response = await fetch(`${config.BACKEND_URL}/api/playlists`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, songs })
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to create playlist:', error);
    return { success: false, error: 'Failed to create playlist' };
  }
}

export async function addSongsToPlaylist(playlistId, songs) {
  try {
    const response = await fetch(`${config.BACKEND_URL}/api/playlists/${playlistId}/songs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ songs })
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to add songs to playlist:', error);
    return { success: false, error: 'Failed to add songs to playlist' };
  }
}

export async function initiateLogin() {
  try {
    const response = await fetch(`${config.BACKEND_URL}/auth/ext-login`);
    const { authUrl } = await response.json();
    
    return new Promise((resolve) => {
      let isAuthenticated = false;
      
      // Open popup for OAuth flow
      chrome.windows.create({
        url: authUrl,
        type: 'popup',
        width: 500,
        height: 600
      }, (popupWindow) => {
        const checkAuthStatus = async () => {
          try {
            const response = await fetch(`${config.BACKEND_URL}/api/auth/status`);
            const data = await response.json();
            if (data.data && data.data.isAuthenticated && !isAuthenticated) {
              isAuthenticated = true;
              chrome.runtime.sendMessage({ 
                type: 'AUTH_STATUS_CHANGED', 
                data: data.data 
              });
              resolve({ success: true });
              return true;
            }
            return false;
          } catch (error) {
            console.error('Auth check failed:', error);
            return false;
          }
        };

        // Start checking auth status immediately and periodically
        checkAuthStatus();
        const interval = setInterval(checkAuthStatus, 1000);

        // Monitor popup window
        const windowCheck = setInterval(() => {
          if (!popupWindow || !popupWindow.id) {
            clearInterval(windowCheck);
            clearInterval(interval);
            if (!isAuthenticated) {
              resolve({ success: false });
            }
            return;
          }
          
          chrome.windows.get(popupWindow.id, async (window) => {
            if (chrome.runtime.lastError || !window) {
              clearInterval(windowCheck);
              clearInterval(interval);
              
              // One final check after window closes
              if (!isAuthenticated) {
                await checkAuthStatus();
                resolve({ success: false });
              }
            }
          });
        }, 500);

        // Cleanup after 2 minutes
        setTimeout(() => {
          clearInterval(interval);
          clearInterval(windowCheck);
          if (!isAuthenticated) {
            resolve({ success: false });
          }
        }, 120000);
      });
    });
  } catch (error) {
    console.error('Login initiation failed:', error);
    return { success: false, error: 'Failed to initiate login' };
  }
}
