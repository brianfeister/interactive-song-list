import React, { useState, useEffect } from 'react';
import { GripVertical, Music, ExternalLink, ChevronUp, ChevronDown, RefreshCw } from 'lucide-react';
import {
  getPlaylistData,
  toggleSongSelection,
  reorderPlaylist,
  initializePlaylistSheet,
  type PlaylistItem
} from './services/googleSheets';
import { isGapiReady } from './services/googleAuth';
import GoogleSignIn from './components/GoogleSignIn';

// Google Drive API configuration
const GOOGLE_DRIVE_API_KEY = 'AIzaSyAebmwoQxwP6HJs66n7DVbz1Cy6mgmZ7uE';
const FOLDER_ID = '1FkV3S3E62-kBe_pKmm6B8XA7YnG9oj2t';

// Rate limiting configuration
const RATE_LIMIT_DELAY = 1000;
let lastRequestTime = 0;

// TypeScript interfaces
interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  webViewLink: string;
}

interface Song {
  id: string;
  title: string;
  driveFileId: string;
  isSelected: boolean;
  playlistOrder: number | null;
  content: string;
  webViewLink: string;
}

// Rate limiting helper
const rateLimitedFetch = async (url: string): Promise<Response> => {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;

  if (timeSinceLastRequest < RATE_LIMIT_DELAY) {
    await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY - timeSinceLastRequest));
  }

  lastRequestTime = Date.now();
  return fetch(url);
};

// Google Drive API functions
const fetchFolderContents = async (): Promise<DriveFile[]> => {
  try {
    const response = await rateLimitedFetch(
      `https://www.googleapis.com/drive/v3/files?q='${FOLDER_ID}'+in+parents&key=${GOOGLE_DRIVE_API_KEY}&fields=files(id,name,mimeType,webViewLink)`
    );

    if (!response.ok) {
      if (response.status === 403) {
        throw new Error('API quota exceeded or access denied. Please check your API key restrictions.');
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.files || [];
  } catch (error) {
    console.error('Error fetching folder contents:', error);
    return [];
  }
};

const fetchDocumentContent = async (fileId: string): Promise<string> => {
  try {
    const response = await rateLimitedFetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=text/plain&key=${GOOGLE_DRIVE_API_KEY}`
    );

    if (!response.ok) {
      if (response.status === 403) {
        throw new Error('API quota exceeded or access denied.');
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const content = await response.text();
    return content;
  } catch (error) {
    console.error('Error fetching document content:', error);
    return 'Error loading content - API quota may be exceeded';
  }
};

// Helper function to create song objects from Google Drive files
const createSongFromFile = (file: DriveFile): Song => {
  return {
    id: file.id,
    title: file.name.replace(/\..*$/, ''), // Remove file extension
    driveFileId: file.id,
    isSelected: false,
    playlistOrder: null,
    content: '', // Will be loaded when needed
    webViewLink: file.webViewLink
  };
};

const App: React.FC = () => {
  const [songs, setSongs] = useState<Song[]>([]);
  const [playlistData, setPlaylistData] = useState<PlaylistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingContent, setLoadingContent] = useState(new Set<string>());
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isUpdating, setIsUpdating] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check authentication state on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const authenticated = isGapiReady();
        setIsAuthenticated(authenticated);
      } catch (error) {
        console.error('Error checking auth state:', error);
      }
    };

    checkAuth();
  }, []);

  // Load songs from Google Drive on component mount
  useEffect(() => {
    const loadSongs = async () => {
      setLoading(true);
      setError(null);

      try {
        const files = await fetchFolderContents();

        if (files.length === 0) {
          setError('No files found in the folder or API key not configured');
          setLoading(false);
          return;
        }

        // Filter for Google Docs only
        const docFiles = files.filter(file =>
          file.mimeType === 'application/vnd.google-apps.document'
        );

        const songObjects = docFiles.map(file => createSongFromFile(file));
        setSongs(songObjects);

        // Initialize Google Sheets if needed
        await initializePlaylistSheet();

      } catch (err) {
        setError('Failed to load songs from Google Drive: ' + (err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    loadSongs();
  }, []);

    // Load initial playlist data
  useEffect(() => {
    const loadPlaylistData = async () => {
      if (songs.length === 0) return;

      try {
        const playlist = await getPlaylistData();
        setPlaylistData(playlist);
        setLastUpdated(new Date());

        // Update songs with playlist information
        setSongs(prevSongs =>
          prevSongs.map(song => {
            const playlistItem = playlist.find(p => p.songId === song.id);
            return {
              ...song,
              isSelected: playlistItem?.selected || false,
              playlistOrder: playlistItem?.order || null
            };
          })
        );
      } catch (err) {
        console.error('Error loading playlist data:', err);
      }
    };

    loadPlaylistData();
  }, [songs.length]);

  // Load content for selected songs
  useEffect(() => {
    const loadContentForSelectedSongs = async () => {
      const selectedSongs = songs.filter(song => song.isSelected && !song.content);

      for (const song of selectedSongs) {
        if (!loadingContent.has(song.id)) {
          await loadSongContent(song.id);
        }
      }
    };

    loadContentForSelectedSongs();
  }, [songs, loadingContent]);

  // Load content for a specific song
  const loadSongContent = async (songId: string) => {
    setLoadingContent(prev => new Set(prev).add(songId));

    try {
      const song = songs.find(s => s.id === songId);
      if (!song) return;

      const content = await fetchDocumentContent(song.driveFileId);

      setSongs(prevSongs =>
        prevSongs.map(s =>
          s.id === songId ? { ...s, content } : s
        )
      );
    } catch (err) {
      console.error('Error loading song content:', err);
    } finally {
      setLoadingContent(prev => {
        const newSet = new Set(prev);
        newSet.delete(songId);
        return newSet;
      });
    }
  };

  // Get selected songs sorted by playlist order
  const selectedSongs = songs
    .filter(song => song.isSelected)
    .sort((a, b) => (a.playlistOrder || 0) - (b.playlistOrder || 0));

  // Get unselected songs
  const unselectedSongs = songs.filter(song => !song.isSelected);

  // Handle moving songs up/down in playlist
  const moveSong = async (songId: string, direction: 'up' | 'down') => {
    if (!isAuthenticated) {
      alert('Please sign in with Google to reorder the playlist');
      return;
    }

    const currentIndex = selectedSongs.findIndex(s => s.id === songId);
    if (
      (direction === 'up' && currentIndex === 0) ||
      (direction === 'down' && currentIndex === selectedSongs.length - 1)
    ) {
      return;
    }

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    const newSelectedSongs = [...selectedSongs];
    const [movedSong] = newSelectedSongs.splice(currentIndex, 1);
    newSelectedSongs.splice(newIndex, 0, movedSong);

    // Update playlist order in Google Sheets
    const reorderedSongIds = newSelectedSongs.map(song => song.id);

    setIsUpdating(true);
    try {
      await reorderPlaylist(reorderedSongIds);
      console.log('Playlist reordered successfully');
    } catch (err) {
      console.error('Error reordering playlist:', err);
      alert('Failed to reorder playlist: ' + (err as Error).message);
    } finally {
      setIsUpdating(false);
    }
  };

  // Toggle song selection
  const toggleSong = async (songId: string) => {
    if (!isAuthenticated) {
      alert('Please sign in with Google to edit the playlist');
      return;
    }

    const song = songs.find(s => s.id === songId);
    if (!song) return;

    setIsUpdating(true);
    try {
      await toggleSongSelection(songId);
      console.log('Song selection toggled successfully');

      // Load content if song is being selected and doesn't have content yet
      if (!song.isSelected && !song.content) {
        await loadSongContent(songId);
      }
    } catch (err) {
      console.error('Error toggling song selection:', err);
      alert('Failed to update playlist: ' + (err as Error).message);
    } finally {
      setIsUpdating(false);
    }
  };

  // Manual refresh function
  const refreshPlaylist = async () => {
    setIsUpdating(true);
    try {
      const playlist = await getPlaylistData();
      setPlaylistData(playlist);
      setLastUpdated(new Date());

      // Update songs with playlist information
      setSongs(prevSongs =>
        prevSongs.map(song => {
          const playlistItem = playlist.find(p => p.songId === song.id);
          return {
            ...song,
            isSelected: playlistItem?.selected || false,
            playlistOrder: playlistItem?.order || null
          };
        })
      );

      console.log('Playlist refreshed manually');
    } catch (err) {
      console.error('Error refreshing playlist:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  // Format song content for display
  const formatSongContent = (content: string) => {
    if (!content) return <div className="text-gray-500 italic">Loading content...</div>;

    return content.split('\n').map((line, index) => {
      // Check if line contains chords (contains letters in brackets or chord patterns)
      const hasChords = /\[.*?\]|^[A-G]|Am|Dm|Em|F#|Bb|C#/.test(line);

      return (
        <div key={index} className={`font-mono text-sm ${hasChords ? 'text-blue-600 font-semibold' : 'text-gray-700'} ${line.trim() === '' ? 'h-3' : ''}`}>
          {line || '\u00A0'}
        </div>
      );
    });
  };

  // Show loading state
  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6 bg-gray-50 min-h-screen">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading songs from Google Drive...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    console.log(error);
    return (
      <div className="max-w-4xl mx-auto p-6 bg-gray-50 min-h-screen">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="text-center py-12">
            <div className="text-red-500 mb-4">
              <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Error Loading Songs</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-left">
              <h3 className="font-semibold text-yellow-800 mb-2">Setup Required:</h3>
              <ol className="text-sm text-yellow-700 space-y-1">
                <li>1. Create a Google Sheet and update SPREADSHEET_ID in src/services/googleSheets.ts</li>
                <li>2. Get a Google Drive API key from Google Cloud Console</li>
                <li>3. Enable Google Drive API and Google Sheets API</li>
                <li>4. Replace API keys in the code with your actual keys</li>
                <li>5. Note: This app uses manual refresh to respect API quotas</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-gray-50 min-h-screen">
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                {/* Header with sync status */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center gap-2">
              <Music className="text-blue-600" />
              Music Playlist Manager
            </h1>
            <p className="text-gray-600">Collaborative playlist from Google Sheets</p>
          </div>

          <div className="flex items-center gap-4">
            {/* Google Sign In */}
            <GoogleSignIn onAuthStateChange={setIsAuthenticated} />
          </div>
        </div>

        {/* Sync status bar */}
        <div className="flex items-center justify-between mb-6 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-600">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </div>
            {isAuthenticated && (
              <div className="text-sm text-green-600 flex items-center gap-1">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                Can edit playlist
              </div>
            )}
            {!isAuthenticated && (
              <div className="text-sm text-amber-600 flex items-center gap-1">
                <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
                Read-only mode
              </div>
            )}
          </div>

          {/* Refresh button */}
          <button
            onClick={refreshPlaylist}
            disabled={isUpdating}
            className={`flex items-center gap-2 px-3 py-1 rounded-lg text-sm ${
              isUpdating
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
            }`}
          >
            <RefreshCw className={`w-4 h-4 ${isUpdating ? 'animate-spin' : ''}`} />
            {isUpdating ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        {/* Today's Playlist Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            Today's Playlist ({selectedSongs.length} songs)
            {selectedSongs.length > 0 && (
              <span className="ml-2 text-sm text-blue-600">
                📋 From Google Sheets
              </span>
            )}
          </h2>

          {selectedSongs.length === 0 ? (
            <div className="text-gray-500 text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
              No songs selected for today's playlist. Toggle songs below to add them.
            </div>
          ) : (
            <div className="space-y-4">
              {selectedSongs.map((song, index) => (
                <div key={song.id} className="bg-white border rounded-lg p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col gap-1">
                        <button
                          onClick={() => moveSong(song.id, 'up')}
                          disabled={index === 0 || isUpdating || !isAuthenticated}
                          className={`p-1 rounded ${
                            index === 0 || isUpdating || !isAuthenticated
                              ? 'text-gray-300 cursor-not-allowed'
                              : 'text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          <ChevronUp className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => moveSong(song.id, 'down')}
                          disabled={index === selectedSongs.length - 1 || isUpdating || !isAuthenticated}
                          className={`p-1 rounded ${
                            index === selectedSongs.length - 1 || isUpdating || !isAuthenticated
                              ? 'text-gray-300 cursor-not-allowed'
                              : 'text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          <ChevronDown className="w-4 h-4" />
                        </button>
                      </div>
                      <GripVertical className="w-5 h-5 text-gray-400" />
                      <h3 className="text-lg font-semibold text-gray-800">{song.title}</h3>
                    </div>
                    <label className={`flex items-center gap-2 ${isAuthenticated ? 'cursor-pointer' : 'cursor-not-allowed'}`}>
                      <input
                        type="checkbox"
                        checked={song.isSelected}
                        onChange={() => toggleSong(song.id)}
                        disabled={isUpdating || !isAuthenticated}
                        className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 disabled:opacity-50"
                      />
                      <span className={`text-sm ${isAuthenticated ? 'text-gray-600' : 'text-gray-400'}`}>
                        {isAuthenticated ? 'In Playlist' : 'Sign in to edit'}
                      </span>
                    </label>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg border-l-4 border-blue-500">
                    {formatSongContent(song.content)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* All Songs Index */}
        <div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">All Songs ({songs.length} total)</h2>

          <div className="space-y-3">
            {unselectedSongs.map((song) => (
              <div key={song.id} className="bg-white border rounded-lg p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <ExternalLink className="w-4 h-4 text-gray-400" />
                    <h3 className="text-lg font-medium text-gray-800">{song.title}</h3>
                  </div>
                  <label className={`flex items-center gap-2 ${isAuthenticated ? 'cursor-pointer' : 'cursor-not-allowed'}`}>
                    <input
                      type="checkbox"
                      checked={song.isSelected}
                      onChange={() => toggleSong(song.id)}
                      disabled={isUpdating || !isAuthenticated}
                      className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 disabled:opacity-50"
                    />
                    <span className={`text-sm ${isAuthenticated ? 'text-gray-600' : 'text-gray-400'}`}>
                      {isAuthenticated ? 'Add to Playlist' : 'Sign in to edit'}
                    </span>
                  </label>
                </div>
                <p className="text-gray-500 text-sm mt-1">
                  Click the checkbox to add to today's playlist and view full content
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
