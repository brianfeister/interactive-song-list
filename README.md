# Interactive Song List

A beautiful React/TypeScript application that connects to Google Drive to manage your music playlist. Built with modern web technologies and deployed automatically to GitHub Pages.

## Features

- 🎵 **Google Drive Integration**: Automatically fetch song documents from your Google Drive folder
- 📊 **Google Sheets Database**: Simple 2-column spreadsheet for collaborative playlist management
- 🤝 **Collaborative Editing**: Multiple users can edit the shared Google Sheet
- 📝 **Interactive Playlist**: Drag and drop songs to reorder your playlist
- 🎨 **Modern UI**: Clean, responsive design with Tailwind CSS
- 🚀 **Fast Performance**: Built with Vite for lightning-fast development and optimized builds
- 📱 **Mobile Friendly**: Responsive design that works on all devices
- 🔄 **Auto-deployment**: Automatically deploys to GitHub Pages on every push

## Tech Stack

- **Frontend**: React 18, TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Build Tool**: Vite
- **Deployment**: GitHub Pages with GitHub Actions
- **Database**: Google Sheets (collaborative spreadsheet)
- **APIs**: Google Drive API v3, Google Sheets API v4

## Quick Start

### 1. Clone and Setup

```bash
git clone https://github.com/YOUR_USERNAME/interactive-song-list.git
cd interactive-song-list
npm install
```

### 2. Configure Google APIs

1. **Create a Google Cloud Project**:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one

2. **Enable APIs**:
   - Navigate to "APIs & Services" > "Library"
   - Search for "Google Drive API" and enable it
   - Search for "Google Sheets API" and enable it

3. **Create API Key**:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "API Key"
   - Copy the API key

4. **Configure the Application**:
   - Open `src/App.tsx`
   - Replace `'YOUR_API_KEY_HERE'` with your actual API key
   - Replace `FOLDER_ID` with your Google Drive folder ID
   - Open `src/services/googleSheets.ts`
   - Replace `'YOUR_SPREADSHEET_ID'` with your Google Sheets ID

### 3. Get Your Google Drive Folder ID

1. Open Google Drive and navigate to your music folder
2. Copy the folder ID from the URL (the long string after `/folders/`)
3. Update the `FOLDER_ID` constant in `src/App.tsx`

### 4. Set Up Google Sheets Database

1. **Create a new Google Sheet**:
   - Go to [Google Sheets](https://sheets.google.com/)
   - Create a new blank spreadsheet
   - Name it "Music Playlist" (or whatever you prefer)

2. **Set up columns**:
   - **A1**: `Song UUID`
   - **B1**: `Selected`

3. **Get the Sheet ID**:
   - Copy the URL of your Google Sheet
   - Extract the ID from the URL (the long string between `/d/` and `/edit`)
   - Update `SPREADSHEET_ID` in `src/services/googleSheets.ts`

4. **Set permissions**:
   - Click "Share" in your Google Sheet
   - Set to "Anyone with the link" can view
   - Or share with specific collaborators

**📖 Detailed instructions**: See `GOOGLE_SHEETS_SETUP.md`

### 5. Development

```bash
npm run dev
```

The app will be available at `http://localhost:3000`

### 6. Deploy to GitHub Pages

#### Option A: Automatic Deployment (Recommended)

1. **Update Configuration**:
   - In `package.json`, update the `homepage` field:
     ```json
     "homepage": "https://YOUR_USERNAME.github.io/YOUR_REPOSITORY_NAME"
     ```
   - In `vite.config.ts`, update the base path:
     ```typescript
     base: process.env.NODE_ENV === 'production' ? '/YOUR_REPOSITORY_NAME/' : '/',
     ```

2. **Enable GitHub Pages**:
   - Go to your repository settings
   - Navigate to "Pages" section
   - Set Source to "GitHub Actions"

3. **Push to Main Branch**:
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

   The GitHub Action will automatically build and deploy your app!

#### Option B: Manual Deployment

```bash
npm run build
npm run deploy
```

## Project Structure

```
interactive-song-list/
├── src/
│   ├── App.tsx          # Main application component
│   ├── main.tsx         # React entry point
│   └── index.css        # Global styles with Tailwind
├── public/              # Static assets
├── .github/workflows/   # GitHub Actions for deployment
├── package.json         # Dependencies and scripts
├── vite.config.ts       # Vite configuration
├── tsconfig.json        # TypeScript configuration
└── tailwind.config.js   # Tailwind CSS configuration
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint
- `npm run deploy` - Deploy to GitHub Pages (manual)

## How It Works

### Google Drive Integration

Create a folder in Google Drive with your song documents. Each document should be a Google Doc containing:
- Song lyrics
- Chord progressions
- Any additional notes

The app will automatically detect and highlight:
- **Chord lines**: Lines containing chord symbols (A, Am, F#, etc.)
- **Lyrics**: Regular text lines
- **Structure**: Verses, choruses, bridges

### Google Sheets Database

The collaborative playlist is stored in a simple 2-column Google Sheet:
- **Column A**: Song UUID (Google Doc ID)
- **Column B**: Selected (TRUE/FALSE)
- **Row order**: Determines playlist order

### Manual Refresh Collaboration

- **On-demand updates**: Click refresh to get latest playlist changes
- **API quota friendly**: No continuous polling to respect Google's limits
- **Visual feedback**: Last updated time shown in UI
- **Manual refresh**: Refresh button to get latest data from Google Sheets

### API Permissions

The app uses read-only permissions for Google Drive and read/write for Google Sheets:
- ✅ Read song document names and content from Drive
- ✅ Read/write playlist data in Sheets
- ✅ Export documents as plain text
- ❌ Never modify or delete your original documents

## Customization

### Styling

The app uses Tailwind CSS for styling. You can customize:
- Colors in `tailwind.config.js`
- Components in `src/App.tsx`
- Global styles in `src/index.css`

### Features

You can extend the app by:
- Adding more Google Drive integrations
- Implementing local storage for offline use
- Adding export functionality
- Creating playlist sharing features

## Troubleshooting

### Common Issues

1. **API Key Error**: Make sure your Google Drive API key is valid and the API is enabled
2. **Folder Access**: Ensure your Google Drive folder is accessible with the API key
3. **Build Errors**: Check that all dependencies are installed with `npm install`
4. **GitHub Pages 404**: Verify the base path in `vite.config.ts` matches your repository name

### Getting Help

If you encounter issues:
1. Check the browser console for error messages
2. Verify your Google Drive API setup
3. Ensure all configuration values are correct
4. Try building locally first with `npm run build`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is open source and available under the [MIT License](LICENSE).

---

Built with ❤️ using React, TypeScript, and Vite. Deployed automatically to GitHub Pages.
