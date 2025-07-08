import React, { useState, useEffect, useRef } from 'react';
import { LogIn, LogOut, User, AlertCircle } from 'lucide-react';
import {
  initializeGapi,
  signIn,
  signOut,
  getCurrentUser,
  isSignedIn,
  onAuthStateChanged,
  renderSignInButton,
  type AuthState
} from '../services/googleAuth';

interface GoogleSignInProps {
  onAuthStateChange?: (isSignedIn: boolean) => void;
}

const GoogleSignIn: React.FC<GoogleSignInProps> = ({ onAuthStateChange }) => {
  const [authState, setAuthState] = useState<AuthState>({
    isSignedIn: false,
    isLoading: true,
    user: null,
    error: null
  });
  const buttonRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const initialize = async () => {
      try {
        await initializeGapi();

        // Check initial auth state
        const signedIn = isSignedIn();
        const user = getCurrentUser();

        setAuthState({
          isSignedIn: signedIn,
          isLoading: false,
          user: user,
          error: null
        });

        // Listen for auth state changes
        onAuthStateChanged((signedIn) => {
          const user = getCurrentUser();
          setAuthState(prev => ({
            ...prev,
            isSignedIn: signedIn,
            user: user
          }));

          // Notify parent component
          if (onAuthStateChange) {
            onAuthStateChange(signedIn);
          }
        });

        // Render the Google sign-in button if not signed in
        if (!signedIn && buttonRef.current) {
          renderSignInButton(buttonRef.current);
        }

      } catch (error) {
        console.error('Failed to initialize Google Identity Services:', error);
        setAuthState({
          isSignedIn: false,
          isLoading: false,
          user: null,
          error: 'Failed to initialize Google authentication'
        });
      }
    };

    initialize();
  }, [onAuthStateChange]);

  // Re-render button when component updates
  useEffect(() => {
    if (!authState.isSignedIn && !authState.isLoading && buttonRef.current) {
      renderSignInButton(buttonRef.current);
    }
  }, [authState.isSignedIn, authState.isLoading]);

  const handleSignIn = async () => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      await signIn();
      // Auth state will be updated by the listener
    } catch (error) {
      console.error('Sign in failed:', error);
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Sign in failed. Please try again.'
      }));
    }
  };

  const handleSignOut = async () => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      await signOut();
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        isSignedIn: false,
        user: null
      }));
    } catch (error) {
      console.error('Sign out failed:', error);
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Sign out failed'
      }));
    }
  };

  if (authState.isLoading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
        <span className="text-sm text-gray-600">Loading...</span>
      </div>
    );
  }

  if (authState.error) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-red-100 text-red-800 rounded-lg">
        <AlertCircle className="w-4 h-4" />
        <span className="text-sm">{authState.error}</span>
      </div>
    );
  }

  if (authState.isSignedIn && authState.user) {
    return (
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-2 bg-green-100 text-green-800 rounded-lg">
          <User className="w-4 h-4" />
          <span className="text-sm font-medium">{authState.user.name}</span>
        </div>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <div className="text-sm text-gray-600">
        Sign in to edit playlist
      </div>
      {/* Google Sign-In button will be rendered here */}
      <div ref={buttonRef} className="google-signin-button"></div>
    </div>
  );
};

export default GoogleSignIn;
