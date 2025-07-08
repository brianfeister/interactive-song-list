# Google Sheets Setup Guide

## 🎯 Overview

This setup creates a simple, collaborative playlist using Google Sheets as the database. The sheet will have just 2 columns:
- **Song UUID** (Google Doc ID)
- **Selected** (TRUE/FALSE)

Row order determines playlist order - super simple!

## 📋 Step-by-Step Setup

### 1. Create Google Sheet

1. **Go to** [Google Sheets](https://sheets.google.com/)
2. **Create** a new blank spreadsheet
3. **Rename** it to "Music Playlist" (or whatever you prefer)
4. **Set up columns** in row 1:
   - **A1**: `Song UUID`
   - **B1**: `Selected`

### 2. Get Sheet ID

1. **Copy the URL** of your Google Sheet
2. **Extract the ID** from the URL (the long string between `/d/` and `/edit`)
   ```
   https://docs.google.com/spreadsheets/d/1ABC123DEF456GHI789JKL/edit#gid=0
                                     ^^^^^^^^^^^^^^^^^^^
                                     This is your Sheet ID
   ```

### 3. Enable Google Sheets API

1. **Go to** [Google Cloud Console](https://console.cloud.google.com/)
2. **Select** your existing project (same one for Drive API)
3. **Go to** "APIs & Services" → "Library"
4. **Search** for "Google Sheets API"
5. **Click** "Enable"

### 4. Update Code Configuration

1. **Open** `src/services/googleSheets.ts`
2. **Replace** `'YOUR_SPREADSHEET_ID'` with your actual Sheet ID:
   ```typescript
   const SPREADSHEET_ID = '1ABC123DEF456GHI789JKL'; // Your actual Sheet ID
   ```

### 5. Set Sheet Permissions

**Option A: Public Access (Simplest)**
1. **Click** "Share" in your Google Sheet
2. **Click** "Change to anyone with the link"
3. **Set** to "Viewer" permissions
4. **Click** "Done"

**Option B: Restricted Access**
1. **Share** with specific email addresses
2. **Set** to "Editor" permissions for collaborators

### 6. Test the Setup

1. **Run** your app: `npm run dev`
2. **Toggle** some songs to add them to the playlist
3. **Check** your Google Sheet - you should see:
   ```
   Song UUID          | Selected
   1FkV3S3E62-kBe...  | TRUE
   2GlW4T4F73-lCf...  | FALSE
   ```
4. **Edit** the sheet manually or open another browser tab and click refresh to see updates!

## 🔧 How It Works

### Manual Refresh Collaboration
- **On-demand**: Click refresh button to check for updates
- **API friendly**: No continuous polling to respect Google quotas
- **Updates**: Last updated time shown in UI

### Data Structure
```
Row 1: Headers (Song UUID, Selected)
Row 2: Song ID 1, TRUE
Row 3: Song ID 2, FALSE
Row 4: Song ID 3, TRUE
...
```

### Playlist Order
- **Row position = playlist order**
- **Moving songs up/down = reordering rows**
- **Adding songs = append to end**
- **Removing songs = delete row**

## 🛡️ Security & Permissions

### API Restrictions
Your existing Google Drive API key works for Sheets too! Just ensure:
1. **Google Sheets API** is enabled in your project
2. **API restrictions** include both Drive and Sheets APIs
3. **HTTP referrers** are set correctly

### Sheet Security
- **Viewer access**: Anyone with link can view (safest for public apps)
- **Editor access**: Only for trusted collaborators
- **Private**: Only you can access (defeats the purpose)

## 💡 Benefits of This Approach

✅ **Simple**: Just a 2-column spreadsheet
✅ **Collaborative**: Multiple people can edit simultaneously
✅ **Visual**: You can see/edit playlist directly in Google Sheets
✅ **Free**: No additional costs
✅ **Familiar**: Everyone knows how to use Google Sheets
✅ **Backup**: Your data is safely stored in Google Drive
✅ **Mobile**: Works on mobile devices
✅ **Sharing**: Easy to share with team members

## 📊 Expected Usage

### Google Sheets API Limits (Free)
- **100 requests per 100 seconds per user**
- **1,000 requests per 100 seconds**
- **Read/Write operations count as 1 request each**

### Your App's Usage
- **Initial load**: 1 read when app starts
- **Manual refresh**: 1 read when user clicks refresh
- **Song toggle**: 1 write per toggle (requires OAuth2)
- **Reordering**: 1 write per reorder operation (requires OAuth2)

**Very low API usage - well within free limits!**

## 🎉 What You Get

With this setup, you now have:
- **Collaborative editing** - Multiple users can edit the same Google Sheet
- **Persistent storage** - Playlist survives browser refreshes
- **Simple management** - Edit directly in Google Sheets
- **Manual refresh** - Click to get latest changes from the sheet
- **Mobile support** - Works on all devices
- **API quota friendly** - Very low API usage

## 🚀 Next Steps

1. **Test locally** with multiple browser tabs
2. **Deploy** to GitHub Pages
3. **Share** the link with your team
4. **Enjoy** collaborative playlist management!

## 🐛 Troubleshooting

**Songs not appearing?**
- Check your Google Drive folder ID
- Verify API key has Drive API access

**Playlist not updating?**
- Check spreadsheet ID is correct
- Verify Sheets API is enabled
- Confirm sheet permissions allow access

**403 Errors?**
- Check API quotas in Google Cloud Console
- Verify HTTP referrers are set correctly
- Ensure both Drive and Sheets APIs are enabled
