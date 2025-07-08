// Google Sheets API service for playlist management
// Sheet structure: [Song UUID, Selected]
// Row order determines playlist order

import { getAccessToken, isGapiReady } from './googleAuth';

const GOOGLE_SHEETS_API_KEY = import.meta.env.VITE_GOOGLE_DRIVE_API_KEY; // For read operations only
const SPREADSHEET_ID = '1lU3pCXLU1STTZVweOLVsgI8OjFZ1bkgn6CDCZIgi9CY';
const SHEET_NAME = 'Playlist'; // Name of the sheet tab

// Rate limiting
const RATE_LIMIT_DELAY = 1000;
let lastRequestTime = 0;

const rateLimitedFetch = async (url: string, options?: RequestInit): Promise<Response> => {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;

  if (timeSinceLastRequest < RATE_LIMIT_DELAY) {
    await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY - timeSinceLastRequest));
  }

  lastRequestTime = Date.now();
  return fetch(url, options);
};

export interface PlaylistItem {
  songId: string;
  selected: boolean;
  order: number; // Based on row position
}

// Get all playlist data from Google Sheets
export const getPlaylistData = async (): Promise<PlaylistItem[]> => {
  try {
    const range = `${SHEET_NAME}!A:B`; // Columns A (Song UUID) and B (Selected)
    const response = await rateLimitedFetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${range}?key=${GOOGLE_SHEETS_API_KEY}`
    );

    if (!response.ok) {
      if (response.status === 403) {
        throw new Error('Sheets API quota exceeded or access denied');
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const rows = data.values || [];

    // Skip header row and convert to PlaylistItem array
    return rows.slice(1).map((row: string[], index: number) => ({
      songId: row[0] || '',
      selected: row[1] === 'TRUE' || row[1] === 'true' || row[1] === '1',
      order: index
    })).filter((item: PlaylistItem) => item.songId); // Filter out empty rows

  } catch (error) {
    console.error('Error fetching playlist data:', error);
    return [];
  }
};

// Update the entire playlist in Google Sheets (requires OAuth2)
export const updatePlaylistData = async (playlistItems: PlaylistItem[]): Promise<void> => {
  if (!isGapiReady()) {
    throw new Error('User must be signed in to make changes');
  }

  try {
    // Sort by order to maintain correct sequence
    const sortedItems = [...playlistItems].sort((a, b) => a.order - b.order);

    // Create the values array with header
    const values = [
      ['Song UUID', 'Selected'], // Header row
      ...sortedItems.map(item => [item.songId, item.selected ? 'TRUE' : 'FALSE'])
    ];

    const range = `${SHEET_NAME}!A:B`;
    const accessToken = getAccessToken();

    if (!accessToken) {
      throw new Error('No access token available');
    }

    const response = await rateLimitedFetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${range}?valueInputOption=RAW`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({ values })
      }
    );

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Authentication failed. Please sign in again.');
      }
      if (response.status === 403) {
        throw new Error('Permission denied. Check sheet sharing settings.');
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    console.log('Playlist updated successfully');
  } catch (error) {
    console.error('Error updating playlist:', error);
    throw error;
  }
};

// Add a song to the playlist (append to end)
export const addSongToPlaylist = async (songId: string): Promise<void> => {
  try {
    const currentPlaylist = await getPlaylistData();
    const newItem: PlaylistItem = {
      songId,
      selected: true,
      order: currentPlaylist.length
    };

    await updatePlaylistData([...currentPlaylist, newItem]);
  } catch (error) {
    console.error('Error adding song to playlist:', error);
    throw error;
  }
};

// Remove a song from the playlist
export const removeSongFromPlaylist = async (songId: string): Promise<void> => {
  try {
    const currentPlaylist = await getPlaylistData();
    const updatedPlaylist = currentPlaylist
      .filter(item => item.songId !== songId)
      .map((item, index) => ({ ...item, order: index })); // Reorder after removal

    await updatePlaylistData(updatedPlaylist);
  } catch (error) {
    console.error('Error removing song from playlist:', error);
    throw error;
  }
};

// Toggle song selection
export const toggleSongSelection = async (songId: string): Promise<void> => {
  try {
    const currentPlaylist = await getPlaylistData();
    const existingItem = currentPlaylist.find(item => item.songId === songId);

    if (existingItem) {
      if (existingItem.selected) {
        // Remove from playlist
        await removeSongFromPlaylist(songId);
      } else {
        // Mark as selected
        const updatedPlaylist = currentPlaylist.map(item =>
          item.songId === songId ? { ...item, selected: true } : item
        );
        await updatePlaylistData(updatedPlaylist);
      }
    } else {
      // Add new song to playlist
      await addSongToPlaylist(songId);
    }
  } catch (error) {
    console.error('Error toggling song selection:', error);
    throw error;
  }
};

// Reorder playlist items
export const reorderPlaylist = async (reorderedSongIds: string[]): Promise<void> => {
  try {
    const currentPlaylist = await getPlaylistData();

    // Create new playlist with updated order
    const updatedPlaylist = reorderedSongIds.map((songId, index) => {
      const existingItem = currentPlaylist.find(item => item.songId === songId);
      return {
        songId,
        selected: existingItem?.selected ?? true,
        order: index
      };
    });

    await updatePlaylistData(updatedPlaylist);
  } catch (error) {
    console.error('Error reordering playlist:', error);
    throw error;
  }
};

// Initialize the Google Sheet with headers if empty (requires OAuth2)
export const initializePlaylistSheet = async (): Promise<void> => {
  try {
    const currentData = await getPlaylistData();

    // If no data exists, create the headers
    if (currentData.length === 0) {
      if (!isGapiReady()) {
        console.log('User not signed in, skipping sheet initialization');
        return;
      }

      const values = [['Song UUID', 'Selected']];
      const range = `${SHEET_NAME}!A1:B1`;
      const accessToken = getAccessToken();

      if (!accessToken) {
        console.log('No access token, skipping sheet initialization');
        return;
      }

      await rateLimitedFetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${range}?valueInputOption=RAW`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify({ values })
        }
      );

      console.log('Playlist sheet initialized with headers');
    }
  } catch (error) {
    console.error('Error initializing playlist sheet:', error);
  }
};

// Helper function to check if sheet is accessible
export const checkSheetAccess = async (): Promise<boolean> => {
  try {
    await getPlaylistData();
    return true;
  } catch (error) {
    return false;
  }
};
