# Google OAuth2 Setup Guide

This guide will help you configure Google OAuth2 authentication for the Interactive Song List app so users can edit the playlist.

## Prerequisites

- Google Cloud Console account
- GitHub Pages deployment (for redirect URI)

## Step 1: Create OAuth2 Credentials

1. **Go to Google Cloud Console**
   - Visit [Google Cloud Console](https://console.cloud.google.com/)
   - Select your project or create a new one

2. **Enable Required APIs**
   - Go to "APIs & Services" > "Library"
   - Search for and enable:
     - Google Drive API
     - Google Sheets API

3. **Create OAuth2 Credentials**
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth 2.0 Client IDs"
   - Choose "Web application" as the application type
   - Set the name (e.g., "Interactive Song List")

4. **Configure Authorized Origins**
   - Add your GitHub Pages URL: `https://[username].github.io`
   - Add localhost for development: `http://localhost:5173`

5. **Configure Authorized Redirect URIs**
   - Add your GitHub Pages URL: `https://[username].github.io/interactive-song-list`
   - Add localhost for development: `http://localhost:5173`

6. **Save and Copy Client ID**
   - Click "Create" and copy the Client ID
   - You'll need this for the next step

## Step 2: Update Your Code

1. **Update OAuth2 Configuration**
   - Open `src/services/googleAuth.ts`
   - Replace `YOUR_CLIENT_ID.apps.googleusercontent.com` with your actual Client ID:

```typescript
const CLIENT_ID = 'your-actual-client-id.apps.googleusercontent.com';
```

## Step 3: Create and Configure Google Sheets

1. **Create a Google Sheet**
   - Go to [Google Sheets](https://sheets.google.com/)
   - Create a new spreadsheet
   - Name it "Interactive Song List" or similar

2. **Set Up the Sheet Structure**
   - Create a sheet tab named "Playlist"
   - Add headers in row 1:
     - Column A: "Song UUID"
     - Column B: "Selected"

3. **Share the Sheet**
   - Click "Share" in the top right
   - Make sure the authenticated user has "Editor" permissions
   - Note: The sheet needs to be accessible to the Google account that will sign in

4. **Copy the Spreadsheet ID**
   - From the URL: `https://docs.google.com/spreadsheets/d/[SPREADSHEET_ID]/edit`
   - Update `src/services/googleSheets.ts` with your ID:

```typescript
const SPREADSHEET_ID = 'your-spreadsheet-id-here';
```

## Step 4: Google Drive Setup

1. **Create a Google Drive Folder**
   - Create a folder in Google Drive for your song documents
   - Add song documents (Google Docs) to this folder

2. **Make the Folder Public**
   - Right-click the folder > "Share"
   - Set to "Anyone with the link can view"
   - Copy the folder ID from the URL

3. **Update the Folder ID**
   - In `src/App.tsx`, update the `GOOGLE_DRIVE_FOLDER_ID`:

```typescript
const GOOGLE_DRIVE_FOLDER_ID = 'your-folder-id-here';
```

## Step 5: Test Your Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Run Development Server**
   ```bash
   npm run dev
   ```

3. **Test Authentication**
   - Open the app in your browser
   - Click "Sign in with Google"
   - Grant permissions for Google Drive and Sheets access
   - Verify you can toggle songs and reorder the playlist

## Step 6: Deploy to GitHub Pages

1. **Build and Deploy**
   ```bash
   npm run build
   npm run deploy
   ```

2. **Test Production**
   - Visit your GitHub Pages URL
   - Test the sign-in flow
   - Verify all functionality works

## Security Considerations

1. **API Key Restrictions**
   - In Google Cloud Console, restrict your Drive API key to:
     - Specific APIs: Google Drive API only
     - HTTP referrers: Your GitHub Pages domain

2. **OAuth2 Client Restrictions**
   - Only add trusted domains to authorized origins
   - Regularly review and rotate credentials if needed

3. **Sheet Permissions**
   - Only share the Google Sheet with users who need editing access
   - Consider using a shared Google account for public playlists

## Troubleshooting

### Common Issues

1. **"API keys are not supported" Error**
   - This means OAuth2 is working correctly
   - The app needs signed-in users for write operations

2. **"Authentication failed" Error**
   - Check that your Client ID is correct
   - Verify authorized origins include your domain
   - Make sure Google Sheets API is enabled

3. **"Permission denied" Error**
   - Ensure the signed-in user has edit access to the Google Sheet
   - Check that the spreadsheet ID is correct

4. **Songs not loading**
   - Verify the Google Drive folder ID is correct
   - Check that the folder is publicly accessible
   - Ensure Google Drive API is enabled

### Getting Help

If you encounter issues:
1. Check the browser console for error messages
2. Verify all IDs and URLs are correct
3. Test API access using Google's API Explorer
4. Ensure all required APIs are enabled in Cloud Console

## Configuration Summary

After completing setup, you should have updated:

- `src/services/googleAuth.ts`: OAuth2 Client ID
- `src/services/googleSheets.ts`: Spreadsheet ID
- `src/App.tsx`: Google Drive folder ID
- Google Cloud Console: OAuth2 credentials and API restrictions
- Google Sheets: Properly configured spreadsheet with correct permissions
