import { app, BrowserWindow } from 'electron';
import path from 'path';
import { pathToFileURL } from 'url';
import * as fs from 'fs';
import { initDatabase } from './database';
import { setupIpcHandlers } from './ipc-handlers';

let mainWindow: BrowserWindow | null = null;

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

function createWindow(): void {
  // Initialize database before creating window
  initDatabase();

  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
    // icon: path.join(__dirname, '../../assets/icon.png'), // Uncomment when icon is added
    titleBarStyle: 'default',
    show: false, // Hide window until ready to show
  });

  // Add error handlers to catch loading issues
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    console.error('Failed to load:', {
      errorCode,
      errorDescription,
      validatedURL,
    });
  });

  mainWindow.webContents.on('did-finish-load', () => {
    console.log('Page finished loading');
  });

  mainWindow.webContents.on('console-message', (event, level, message) => {
    console.log(`[Renderer ${level}]:`, message);
  });

  // DON'T show window automatically - wait for did-finish-load
  // This prevents showing a white screen before content loads

  // Load the app
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    // In production, use __dirname to construct path relative to main.js
    // main.js is in dist-electron/main/, so dist/ is at ../../dist/
    const htmlPath = path.join(__dirname, '../../dist/index.html');
    
    // Write debug info to a log file on desktop
    const logPath = path.join(app.getPath('desktop'), 'dimuth-tirehouse-debug.txt');
    const debugInfo = [
      '=== DIMUTH TIREHOUSE DEBUG LOG ===',
      `Time: ${new Date().toISOString()}`,
      `__dirname: ${__dirname}`,
      `HTML path: ${htmlPath}`,
      `App path: ${app.getAppPath()}`,
      `User data: ${app.getPath('userData')}`,
      `Desktop: ${app.getPath('desktop')}`,
      ''
    ];
    
    // Check if file exists
    const exists = fs.existsSync(htmlPath);
    debugInfo.push(`File exists: ${exists}`);
    
    if (exists) {
      try {
        const stats = fs.statSync(htmlPath);
        debugInfo.push(`File size: ${stats.size} bytes`);
        debugInfo.push(`Modified: ${stats.mtime}`);
      } catch (err: any) {
        debugInfo.push(`Error reading file stats: ${err.message}`);
      }
    } else {
      // List what's actually in the directory
      const dir = path.dirname(htmlPath);
      debugInfo.push(`\nChecking directory: ${dir}`);
      try {
        if (fs.existsSync(dir)) {
          const files = fs.readdirSync(dir);
          debugInfo.push(`Files in directory: ${files.join(', ')}`);
        } else {
          debugInfo.push('Directory does not exist!');
        }
      } catch (err: any) {
        debugInfo.push(`Error reading directory: ${err.message}`);
      }
    }
    
    console.log(debugInfo.join('\n'));
    
    // Use loadFile with path relative to main.js location
    mainWindow.loadFile(htmlPath).then(() => {
      debugInfo.push('\n✅ loadFile SUCCESS');
      fs.writeFileSync(logPath, debugInfo.join('\n'));
    }).catch((err) => {
      debugInfo.push(`\n❌ loadFile FAILED: ${err.message}`);
      debugInfo.push(`Error code: ${err.code}`);
      
      // Fallback: try file:// URL
      const fileUrl = pathToFileURL(htmlPath).href;
      debugInfo.push(`\nTrying file:// URL: ${fileUrl}`);
      
      mainWindow?.loadURL(fileUrl).then(() => {
        debugInfo.push('✅ loadURL SUCCESS');
        fs.writeFileSync(logPath, debugInfo.join('\n'));
      }).catch((err2) => {
        debugInfo.push(`❌ loadURL FAILED: ${err2.message}`);
        
        // Last resort: try with app.getAppPath()
        const altPath = path.join(app.getAppPath(), 'dist', 'index.html');
        debugInfo.push(`\nTrying app.getAppPath() path: ${altPath}`);
        const altExists = fs.existsSync(altPath);
        debugInfo.push(`Alt path exists: ${altExists}`);
        
        const altFileUrl = pathToFileURL(altPath).href;
        debugInfo.push(`Alt file URL: ${altFileUrl}`);
        
        mainWindow?.loadURL(altFileUrl).then(() => {
          debugInfo.push('✅ Alt URL SUCCESS');
          fs.writeFileSync(logPath, debugInfo.join('\n'));
        }).catch((err3) => {
          debugInfo.push(`❌ All methods FAILED: ${err3.message}`);
          fs.writeFileSync(logPath, debugInfo.join('\n'));
          
          // Show error to user
          if (mainWindow) {
            mainWindow.loadURL(`data:text/html,<h1>Error Loading Application</h1><p>Check dimuth-tirehouse-debug.txt on your Desktop for details</p>`);
            mainWindow.show();
          }
        });
      });
    });
    
    // Enable dev tools for debugging
    mainWindow.webContents.openDevTools();
    
    // Show window when page successfully loads
    mainWindow.webContents.once('did-finish-load', () => {
      debugInfo.push('\n✅ Page loaded and rendered successfully!');
      
      // Wait a bit for React to render, then check for errors
      setTimeout(() => {
        mainWindow?.webContents.executeJavaScript(`
          (function() {
            const root = document.getElementById('root');
            const hasContent = root && root.innerHTML.trim().length > 0;
            const errorLogs = [];
            
            // Get any console errors
            return {
              hasRoot: !!root,
              rootContent: root ? root.innerHTML.substring(0, 200) : 'No root element',
              hasContent: hasContent,
              href: window.location.href,
              readyState: document.readyState
            };
          })();
        `).then((result: any) => {
          debugInfo.push('\n--- React App Status ---');
          debugInfo.push(`Has root element: ${result.hasRoot}`);
          debugInfo.push(`Has content: ${result.hasContent}`);
          debugInfo.push(`Window location: ${result.href}`);
          debugInfo.push(`Document state: ${result.readyState}`);
          debugInfo.push(`Root content preview: ${result.rootContent}`);
          fs.writeFileSync(logPath, debugInfo.join('\n'));
          
          // Show window regardless
          if (mainWindow) {
            mainWindow.show();
          }
        }).catch((err: any) => {
          debugInfo.push(`\n❌ Error checking React: ${err.message}`);
          fs.writeFileSync(logPath, debugInfo.join('\n'));
          if (mainWindow) {
            mainWindow.show();
          }
        });
      }, 1000);
      
      fs.writeFileSync(logPath, debugInfo.join('\n'));
    });
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// This method will be called when Electron has finished initialization
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed, except on macOS
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Setup IPC handlers (this will also start the backup scheduler)
setupIpcHandlers();

// Security: Prevent new window creation
app.on('web-contents-created', (_, contents) => {
  contents.setWindowOpenHandler(() => {
    return { action: 'deny' };
  });
});

