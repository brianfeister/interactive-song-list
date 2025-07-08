// New Google Identity Services implementation with OAuth2 authorization
declare global {
  interface Window {
    google: any;
  }
}

export interface AuthState {
  isSignedIn: boolean;
  isLoading: boolean;
  user: any | null;
  error: string | null;
}

const CLIENT_ID = '576206001901-6pqj83br2g1d03io8md5cdve3i416bgp.apps.googleusercontent.com';
const SCOPES = 'https://www.googleapis.com/auth/spreadsheets';

let isInitialized = false;
let currentUser: any = null;
let authStateCallback: ((isSignedIn: boolean) => void) | null = null;
let tokenClient: any = null;
let accessToken: string | null = null;

// Load Google Identity Services and Google Authorization scripts
const loadGoogleScripts = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.id && window.google?.accounts?.oauth2) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google Identity Services'));
    document.head.appendChild(script);
  });
};

// Handle credential response from Google Identity Services (authentication)
const handleCredentialResponse = (response: any) => {
  if (response.credential) {
    // Decode the JWT token to get user info
    const payload = JSON.parse(atob(response.credential.split('.')[1]));

    currentUser = {
      id: payload.sub,
      email: payload.email,
      name: payload.name,
      picture: payload.picture,
      credential: response.credential,
      // Add methods for compatibility
      getBasicProfile: () => ({
        getName: () => payload.name,
        getEmail: () => payload.email,
        getImageUrl: () => payload.picture
      })
    };

    console.log('User authenticated:', currentUser);

    // Now request authorization for Google Sheets access
    requestAuthorization();
  }
};

// Request authorization for Google Sheets access
const requestAuthorization = () => {
  if (!tokenClient) {
    tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPES,
      callback: (response: any) => {
        if (response.access_token) {
          accessToken = response.access_token;
          console.log('Authorization granted for Google Sheets');

          if (authStateCallback) {
            authStateCallback(true);
          }
        } else {
          console.error('Authorization failed:', response);
          if (authStateCallback) {
            authStateCallback(false);
          }
        }
      },
    });
  }

  tokenClient.requestAccessToken();
};

// Initialize Google Identity Services
export const initializeGapi = async (): Promise<void> => {
  if (isInitialized) return;

  try {
    await loadGoogleScripts();

    // Wait for Google Identity Services to be ready
    let retries = 0;
    while (!window.google?.accounts?.id && retries < 50) {
      await new Promise(resolve => setTimeout(resolve, 100));
      retries++;
    }

    if (!window.google?.accounts?.id) {
      throw new Error('Google Identity Services failed to load');
    }

    // Initialize Google Identity Services for authentication
    window.google.accounts.id.initialize({
      client_id: CLIENT_ID,
      callback: handleCredentialResponse,
      auto_select: false,
      cancel_on_tap_outside: false
    });

    isInitialized = true;
    console.log('Google Identity Services initialized successfully');
  } catch (error) {
    console.error('Error initializing Google Identity Services:', error);
    throw error;
  }
};

// Sign in with popup
export const signIn = async (): Promise<any> => {
  if (!isInitialized) {
    await initializeGapi();
  }

  return new Promise((resolve, reject) => {
    // Set up a temporary callback to resolve the promise
    const originalCallback = authStateCallback;
    authStateCallback = (isSignedIn) => {
      if (isSignedIn && currentUser && accessToken) {
        resolve(currentUser);
        authStateCallback = originalCallback;
      } else if (!isSignedIn) {
        reject(new Error('Authorization failed'));
        authStateCallback = originalCallback;
      }
    };

    // Show the One Tap prompt
    window.google.accounts.id.prompt((notification: any) => {
      if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
        // Fallback: show sign-in button if One Tap doesn't work
        authStateCallback = originalCallback;
        reject(new Error('Please click the sign-in button'));
      }
    });

    // Set a timeout to reject if no response
    setTimeout(() => {
      if (authStateCallback !== originalCallback) {
        authStateCallback = originalCallback;
        reject(new Error('Sign-in timeout'));
      }
    }, 60000);
  });
};

// Render sign-in button
export const renderSignInButton = (element: HTMLElement): void => {
  if (!isInitialized) {
    initializeGapi().then(() => {
      window.google.accounts.id.renderButton(element, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        text: 'sign_in_with',
        shape: 'rectangular',
        logo_alignment: 'left'
      });
    });
  } else {
    window.google.accounts.id.renderButton(element, {
      type: 'standard',
      theme: 'outline',
      size: 'large',
      text: 'sign_in_with',
      shape: 'rectangular',
      logo_alignment: 'left'
    });
  }
};

// Sign out
export const signOut = async (): Promise<void> => {
  currentUser = null;
  accessToken = null;
  window.google?.accounts?.id?.disableAutoSelect();

  if (tokenClient) {
    window.google.accounts.oauth2.revoke(accessToken, () => {
      console.log('Access token revoked');
    });
  }

  if (authStateCallback) {
    authStateCallback(false);
  }
};

// Get current user
export const getCurrentUser = (): any => {
  return currentUser;
};

// Check if user is signed in
export const isSignedIn = (): boolean => {
  return !!(currentUser && accessToken);
};

// Get access token - returns OAuth2 access token for Google Sheets API
export const getAccessToken = (): string | null => {
  return accessToken;
};

// Listen for sign-in status changes
export const onAuthStateChanged = (callback: (isSignedIn: boolean) => void): void => {
  authStateCallback = callback;
};

// Check if ready for making authenticated requests
export const isGapiReady = (): boolean => {
  return isInitialized && !!(currentUser && accessToken);
};
