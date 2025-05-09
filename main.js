const { app, BrowserWindow, ipcMain, Menu, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
require('@electron/remote/main').initialize();

// Ensure notes directory exists
const notesDir = path.join(__dirname, 'notes');
if (!fs.existsSync(notesDir)) {
    fs.mkdirSync(notesDir, { recursive: true });
}

let mainWindow;
let notesWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    frame: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  mainWindow.loadFile('src/index.html');

  const menu = Menu.buildFromTemplate([
    {
      label: 'File',
      submenu: [
        { 
          label: 'Manage Notes',
          click: () => {
            if (!notesWindow) {
              createNotesWindow();
            } else {
              notesWindow.focus();
            }
          }
        },
        { type: 'separator' },
        { label: 'Exit', click: () => app.quit() }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'toggledevtools' },
        { type: 'separator' },
        { role: 'resetzoom' },
        { role: 'zoomin' },
        { role: 'zoomout' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    }
  ]);

  Menu.setApplicationMenu(menu);
}

function createNotesWindow() {
  notesWindow = new BrowserWindow({
    width: 1000,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true
    }
  });

  require('@electron/remote/main').enable(notesWindow.webContents);
  notesWindow.loadFile('src/notes.html');
  
  notesWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('Window failed to load:', errorCode, errorDescription);
  });

  // Clean up the window reference when closed
  notesWindow.on('closed', () => {
    notesWindow = null;
  });
}

// Set up IPC handlers only once
ipcMain.on('window-control', (event, action) => {
  if (!mainWindow) return;
  
  switch (action) {
    case 'minimize':
      mainWindow.minimize();
      break;
    case 'maximize':
      if (mainWindow.isMaximized()) {
        mainWindow.unmaximize();
      } else {
        mainWindow.maximize();
      }
      break;
    case 'close':
      mainWindow.close();
      break;
  }
});

ipcMain.on('save-solution', (event, filename, content) => {
  const dir = path.join(__dirname, 'solutions');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir);
  fs.writeFileSync(path.join(dir, filename + '.cpp'), content);
});

ipcMain.on('open-notes-window', () => {
  if (!notesWindow) {
    createNotesWindow();
  } else {
    notesWindow.focus();
  }
});

ipcMain.handle('create-note', async (event, { folderPath, content }) => {
  console.log('create-note called with:', { folderPath, content });
  try {
    // If this is a folder creation request (no content and no .md extension)
    if (!content && !folderPath.endsWith('.md')) {
      console.log('Creating folder at:', folderPath);
      await fs.promises.mkdir(folderPath, { recursive: true });
      return { success: true, path: folderPath };
    }

    // For notes
    console.log('Creating note at:', folderPath);
    const dir = path.dirname(folderPath);
    await fs.promises.mkdir(dir, { recursive: true });
    await fs.promises.writeFile(folderPath, content);
    console.log('Note created successfully');
    return { success: true, path: folderPath };
  } catch (error) {
    console.error('Error in create-note:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('read-note', async (event, filePath) => {
  try {
    const content = await fs.promises.readFile(filePath, 'utf-8');
    return { success: true, content };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('save-note', async (event, { filePath, content }) => {
  try {
    await fs.promises.writeFile(filePath, content);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('list-notes', async (event, dirPath) => {
  try {
    const items = await fs.promises.readdir(dirPath, { withFileTypes: true });
    return items.map(item => ({
      name: item.name,
      isDirectory: item.isDirectory(),
      path: path.join(dirPath, item.name)
    }));
  } catch (error) {
    return [];
  }
});

// Add these IPC handlers for dialogs
ipcMain.handle('show-dialog', async (event, options) => {
  return dialog.showMessageBox(notesWindow, {
    title: options.title || 'Input',
    message: options.message || 'Enter value:',
    buttons: ['OK', 'Cancel'],
    defaultId: 0,
    cancelId: 1,
    inputPlaceholder: options.placeholder || '',
    type: 'question',
    promptText: options.placeholder || '',
    prompt: true  // This enables the input box
  });
});

ipcMain.handle('show-input-dialog', async (event, options) => {
  const result = await dialog.showSaveDialog(notesWindow, {
    title: options.title || 'Input',
    defaultPath: options.defaultPath || '',
    buttonLabel: 'Create',
    properties: ['createDirectory', 'showOverwriteConfirmation'],
    filters: options.defaultPath.endsWith('.md') ? 
      [{ name: 'Markdown', extensions: ['md'] }] : 
      [{ name: 'Folders' }]
  });
  
  if (!result.canceled) {
    return {
      confirmed: true,
      value: result.filePath // Return full path instead of just basename
    };
  }
  
  return {
    confirmed: false,
    value: null
  };
});

ipcMain.handle('move-file', async (event, { sourcePath, targetPath }) => {
  try {
    // Check if target folder exists
    const targetDir = path.dirname(targetPath);
    if (!fs.existsSync(targetDir)) {
      await fs.promises.mkdir(targetDir, { recursive: true });
    }
    
    // Move the file
    await fs.promises.rename(sourcePath, targetPath);
    return { success: true };
  } catch (error) {
    console.error('Error moving file:', error);
    return { success: false, error: error.message };
  }
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
