# CareTag Desktop App (Electron)

This guide explains how to build and run CareTag as a Windows desktop application.

## Prerequisites

1. **Node.js** (v18 or higher)
2. **Git** installed on your system
3. **Windows 10/11** for building Windows apps

## Setup Instructions

### Step 1: Clone the Repository

1. Clone the repository to your local machine:
   ```bash
   git clone <your-repo-url>
   cd <your-project-folder>
   ```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Add Scripts to package.json

Add these scripts to your `package.json`:

```json
{
  "main": "electron/main.js",
  "scripts": {
    "electron:dev": "concurrently \"npm run dev\" \"wait-on http://localhost:8080 && cross-env ELECTRON_DEV=true electron .\"",
    "electron:build": "npm run build && electron-builder",
    "electron:build:win": "npm run build && electron-builder --win"
  }
}
```

> **Note:** You may need to install `cross-env`: `npm install --save-dev cross-env`

### Step 4: Development Mode

To run the app in development mode with hot-reload:

```bash
npm run electron:dev
```

This will:
- Start the Vite dev server on port 8080
- Launch Electron pointing to the dev server
- Enable DevTools for debugging

### Step 5: Build for Production

To create a Windows installer:

```bash
npm run electron:build:win
```

This will:
1. Build the React app to the `dist` folder
2. Package it with Electron
3. Create an installer in the `release` folder

## Output Files

After building, you'll find:
- `release/CareTag-Setup-{version}.exe` - Windows installer

## Troubleshooting

### "electron-squirrel-startup" error
Install the package: `npm install electron-squirrel-startup`

### App shows blank screen
Make sure the build completed successfully and `dist/index.html` exists.

### Icons not showing
Replace `public/favicon.ico` with a proper 256x256 ICO file for Windows.

## Recommended: Create Proper App Icons

For best results, create these icon files:
- `public/favicon.ico` - 256x256 ICO file for Windows
- `build/icon.png` - 512x512 PNG for other platforms

You can use tools like [icoconvert.com](https://icoconvert.com/) to create ICO files.
