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
