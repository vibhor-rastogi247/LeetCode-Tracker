const { ipcRenderer } = require('electron');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

let editor;
let currentFile = null;
const notesDir = path.join(__dirname, '..', 'notes');

console.log('Notes.js loaded, notesDir:', notesDir);

// Initialize EasyMDE
document.addEventListener('DOMContentLoaded', async () => {
    try {
        console.log('DOM Content Loaded');

        // Create notes directory if it doesn't exist
        if (!fs.existsSync(notesDir)) {
            console.log('Creating notes directory');
            fs.mkdirSync(notesDir, { recursive: true });
        }

        // Initialize the markdown editor with dark theme and syntax highlighting
        editor = new EasyMDE({
            element: document.getElementById('editor'),
            autosave: {
                enabled: true,
                delay: 1000,
                uniqueId: 'notes-editor'
            },
            spellChecker: false,
            toolbar: [
                'bold', 'italic', 'heading',
                '|', 'quote', 'unordered-list', 'ordered-list',
                '|', 'link', 'image', 'code',
                '|', 'preview', 'side-by-side', 'fullscreen'
            ],
            previewRender: function(plainText, preview) {
                // Asynchronously render the preview with syntax highlighting
                setTimeout(function() {
                    // First convert markdown to HTML
                    const htmlContent = this.parent.markdown(plainText);
                    preview.innerHTML = htmlContent;
                    
                    // Find all code blocks and apply syntax highlighting
                    preview.querySelectorAll('pre code').forEach((block) => {
                        // Try to detect language from class
                        const languageMatch = block.className.match(/language-(\w+)/);
                        if (languageMatch) {
                            // Make sure we have the correct language class
                            block.classList.add(`language-${languageMatch[1]}`);
                            
                            // Use Prism's own highlighting instead of manual replacement
                            if (languageMatch[1] === 'cpp') {
                                block.innerHTML = block.textContent; // Reset any previous highlighting
                                Prism.highlightElement(block);
                            }
                        } else {
                            block.classList.add('language-javascript');
                            Prism.highlightElement(block);
                        }
                        
                        // Apply line numbers
                        block.parentElement.classList.add('line-numbers');
                    });
                    
                    // Highlight inline code
                    preview.querySelectorAll('code:not([class*="language-"])').forEach((block) => {
                        block.classList.add('language-javascript');
                        Prism.highlightElement(block);
                    });
                }.bind(this), 0);
                
                return "Loading...";
            }
        });
        console.log('Editor initialized');

        // Initialize file tree
        await refreshFileTree();
        console.log('File tree initialized');

        // Auto-save on editor changes
        editor.codemirror.on('change', async () => {
            if (currentFile) {
                await saveNote(currentFile, editor.value());
            }
        });
    } catch (error) {
        console.error('Error during initialization:', error);
        alert('Error initializing notes: ' + error.message);
    }
});

async function createNewNote() {
    try {
        const result = await ipcRenderer.invoke('show-input-dialog', {
            title: 'Create New Note',
            message: 'Enter note name:',
            defaultPath: path.join(notesDir, 'New Note.md')
        });
        
        if (!result.confirmed || !result.value) return;
        
        const notePath = result.value;
        console.log('Creating new note at:', notePath);
        const createResult = await ipcRenderer.invoke('create-note', {
            folderPath: notePath,
            content: `# ${path.basename(notePath, '.md')}\n`
        });
        
        if (!createResult.success) {
            throw new Error(createResult.error || 'Failed to create note');
        }
        
        console.log('Note created successfully');
        await refreshFileTree();
        await openNote(createResult.path);
    } catch (error) {
        console.error('Failed to create note:', error);
        alert('Failed to create note: ' + error.message);
    }
}

async function createNewFolder() {
    try {
        const result = await ipcRenderer.invoke('show-input-dialog', {
            title: 'Create New Folder',
            message: 'Enter folder name:',
            defaultPath: path.join(notesDir, 'New Folder')
        });
        
        if (!result.confirmed || !result.value) return;
        
        const folderPath = result.value;
        console.log('Creating new folder at:', folderPath);
        const createResult = await ipcRenderer.invoke('create-note', {
            folderPath: folderPath,
            content: ''  // Empty content indicates folder creation
        });
        
        if (!createResult.success) {
            throw new Error(createResult.error || 'Failed to create folder');
        }
        
        console.log('Folder created successfully');
        await refreshFileTree();
    } catch (error) {
        console.error('Failed to create folder:', error);
        alert('Failed to create folder: ' + error.message);
    }
}

async function refreshFileTree() {
    const fileTree = document.getElementById('fileTree');
    fileTree.innerHTML = '';
    
    // Create root folder item
    const rootContainer = document.createElement('div');
    rootContainer.className = 'file-tree-container';
    
    const rootItem = document.createElement('div');
    rootItem.className = 'file-tree-item';
    rootItem.dataset.path = notesDir;
    rootItem.dataset.type = 'folder';
    
    const rootExpandIcon = document.createElement('span');
    rootExpandIcon.className = 'expand-icon';
    rootExpandIcon.innerHTML = '▼';
    
    const rootIcon = document.createElement('span');
    rootIcon.className = 'icon';
    rootIcon.innerHTML = '📁';
    
    const rootName = document.createElement('span');
    rootName.className = 'name';
    rootName.textContent = 'Notes';
    
    const rootActions = document.createElement('div');
    rootActions.className = 'item-actions';
    
    const addNoteBtn = document.createElement('button');
    addNoteBtn.className = 'add-note-btn';
    addNoteBtn.innerHTML = '📄';
    addNoteBtn.title = 'Add new note';
    addNoteBtn.onclick = async (e) => {
        e.stopPropagation();
        await createNewNoteInFolder(notesDir);
    };
    
    const addFolderBtn = document.createElement('button');
    addFolderBtn.className = 'add-folder-btn';
    addFolderBtn.innerHTML = '📁';
    addFolderBtn.title = 'Add new folder';
    addFolderBtn.onclick = async (e) => {
        e.stopPropagation();
        await createNewFolder();
    };
    
    rootActions.appendChild(addNoteBtn);
    rootActions.appendChild(addFolderBtn);
    
    rootItem.appendChild(rootExpandIcon);
    rootItem.appendChild(rootIcon);
    rootItem.appendChild(rootName);
    rootItem.appendChild(rootActions);
    
    const rootContent = document.createElement('div');
    rootContent.className = 'folder';
    rootContent.style.display = 'block'; // Root folder starts expanded
    
    rootContainer.appendChild(rootItem);
    rootContainer.appendChild(rootContent);
    fileTree.appendChild(rootContainer);
    
    // Build the rest of the tree inside the root folder
    await buildFileTree(notesDir, rootContent, 1);
}

async function buildFileTree(dir, parentElement, level = 0) {
    try {
        const items = await ipcRenderer.invoke('list-notes', dir);
        
        for (const item of items) {
            const itemContainer = document.createElement('div');
            itemContainer.className = 'file-tree-container';
            
            const itemElement = document.createElement('div');
            itemElement.className = 'file-tree-item';
            itemElement.style.paddingLeft = `${level * 20}px`;
            
            // Add drag and drop attributes
            itemElement.draggable = true;
            itemElement.dataset.path = item.path;
            itemElement.dataset.type = item.isDirectory ? 'folder' : 'file';
            
            const expandIcon = document.createElement('span');
            expandIcon.className = 'expand-icon';
            expandIcon.innerHTML = item.isDirectory ? '▶' : '&nbsp;&nbsp;';
            
            const icon = document.createElement('span');
            icon.className = 'icon';
            icon.innerHTML = item.isDirectory ? '📁' : '📄';
            
            const name = document.createElement('span');
            name.className = 'name';
            name.textContent = item.name;
            
            const actions = document.createElement('div');
            actions.className = 'item-actions';
            
            if (item.isDirectory) {
                const addNoteBtn = document.createElement('button');
                addNoteBtn.className = 'add-note-btn';
                addNoteBtn.innerHTML = '📄';
                addNoteBtn.title = 'Add new note';
                addNoteBtn.onclick = async (e) => {
                    e.stopPropagation();
                    await createNewNoteInFolder(item.path);
                };
                
                const addFolderBtn = document.createElement('button');
                addFolderBtn.className = 'add-folder-btn';
                addFolderBtn.innerHTML = '📁';
                addFolderBtn.title = 'Add new folder';
                addFolderBtn.onclick = async (e) => {
                    e.stopPropagation();
                    await createNewFolderInFolder(item.path);
                };
                
                actions.appendChild(addNoteBtn);
                actions.appendChild(addFolderBtn);
            }
            
            itemElement.appendChild(expandIcon);
            itemElement.appendChild(icon);
            itemElement.appendChild(name);
            itemElement.appendChild(actions);
            itemContainer.appendChild(itemElement);
            parentElement.appendChild(itemContainer);

            if (item.isDirectory) {
                const folderContent = document.createElement('div');
                folderContent.className = 'folder';
                folderContent.style.display = 'none';
                itemContainer.appendChild(folderContent);
                await buildFileTree(item.path, folderContent, level + 1);
                
                itemElement.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const isExpanded = folderContent.style.display === 'block';
                    expandIcon.innerHTML = isExpanded ? '▶' : '▼';
                    folderContent.style.display = isExpanded ? 'none' : 'block';
                });
                
                // Add drag and drop event listeners for folders
                itemElement.addEventListener('dragover', (e) => {
                    e.preventDefault();
                    itemElement.classList.add('drag-over');
                });
                
                itemElement.addEventListener('dragleave', () => {
                    itemElement.classList.remove('drag-over');
                });
                
                itemElement.addEventListener('drop', async (e) => {
                    e.preventDefault();
                    itemElement.classList.remove('drag-over');
                    
                    const sourcePath = e.dataTransfer.getData('text/plain');
                    if (sourcePath && sourcePath !== item.path) {
                        await moveFileOrFolder(sourcePath, item.path);
                    }
                });
            } else {
                itemElement.addEventListener('click', () => openNote(item.path));
                
                // Add drag event listeners for files
                itemElement.addEventListener('dragstart', (e) => {
                    e.dataTransfer.setData('text/plain', item.path);
                    itemElement.classList.add('dragging');
                });
                
                itemElement.addEventListener('dragend', () => {
                    itemElement.classList.remove('dragging');
                });
            }
        }
    } catch (error) {
        console.error('Error building file tree:', error);
    }
}

async function createNewNoteInFolder(folderPath) {
    try {
        const result = await ipcRenderer.invoke('show-input-dialog', {
            title: 'Create New Note in Folder',
            message: 'Enter note name:',
            defaultPath: path.join(folderPath, 'New Note.md')
        });
        
        if (!result.confirmed || !result.value) return;
        
        const notePath = result.value;
        console.log('Creating new note at:', notePath);
        const createResult = await ipcRenderer.invoke('create-note', {
            folderPath: notePath,
            content: `# ${path.basename(notePath, '.md')}\n`
        });
        
        if (!createResult.success) {
            throw new Error(createResult.error || 'Failed to create note');
        }
        
        console.log('Note created successfully');
        await refreshFileTree();
        
        // Find and expand the parent folder
        const parentFolder = document.querySelector(`.file-tree-item[data-path="${folderPath}"]`);
        if (parentFolder) {
            const folderContent = parentFolder.parentElement.querySelector('.folder');
            if (folderContent) {
                const expandIcon = parentFolder.querySelector('.expand-icon');
                if (expandIcon) {
                    expandIcon.innerHTML = '▼';
                }
                folderContent.style.display = 'block';
            }
        }
        
        await openNote(createResult.path);
    } catch (error) {
        console.error('Failed to create note:', error);
        alert('Failed to create note: ' + error.message);
    }
}

async function createNewFolderInFolder(parentPath) {
    try {
        const result = await ipcRenderer.invoke('show-input-dialog', {
            title: 'Create New Folder',
            message: 'Enter folder name:',
            defaultPath: path.join(parentPath, 'New Folder')
        });
        
        if (!result.confirmed || !result.value) return;
        
        const folderPath = result.value;
        console.log('Creating new folder at:', folderPath);
        const createResult = await ipcRenderer.invoke('create-note', {
            folderPath: folderPath,
            content: ''  // Empty content indicates folder creation
        });
        
        if (!createResult.success) {
            throw new Error(createResult.error || 'Failed to create folder');
        }
        
        console.log('Folder created successfully');
        await refreshFileTree();
        
        // Find and expand the parent folder
        const parentFolder = document.querySelector(`.file-tree-item[data-path="${parentPath}"]`);
        if (parentFolder) {
            const folderContent = parentFolder.parentElement.querySelector('.folder');
            if (folderContent) {
                const expandIcon = parentFolder.querySelector('.expand-icon');
                if (expandIcon) {
                    expandIcon.innerHTML = '▼';
                }
                folderContent.style.display = 'block';
            }
        }
    } catch (error) {
        console.error('Failed to create folder:', error);
        alert('Failed to create folder: ' + error.message);
    }
}

async function moveFileOrFolder(sourcePath, targetFolderPath) {
    try {
        const fileName = path.basename(sourcePath);
        const newPath = path.join(targetFolderPath, fileName);
        
        if (sourcePath === newPath) return;
        
        console.log('Moving from:', sourcePath, 'to:', newPath);
        
        // Use the main process to handle the move
        const result = await ipcRenderer.invoke('move-file', {
            sourcePath,
            targetPath: newPath
        });
        
        if (!result.success) {
            throw new Error(result.error || 'Failed to move file');
        }
        
        await refreshFileTree();
        
        // If it was the current file being edited, update the path
        if (currentFile === sourcePath) {
            currentFile = newPath;
        }
    } catch (error) {
        console.error('Failed to move file:', error);
        alert('Failed to move file: ' + error.message);
    }
}

async function openNote(filePath) {
    try {
        const result = await ipcRenderer.invoke('read-note', filePath);
        if (result.success) {
            currentFile = filePath;
            editor.value(result.content);
            
            // Update selected state in file tree by comparing full paths
            document.querySelectorAll('.file-tree-item').forEach(item => {
                item.classList.remove('selected');
                if (item.dataset.path === filePath) {
                    item.classList.add('selected');
                }
            });
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        console.error('Failed to open note:', error);
        alert('Failed to open note: ' + error.message);
    }
}

async function saveNote(filePath, content) {
    try {
        const result = await ipcRenderer.invoke('save-note', { filePath, content });
        if (!result.success) {
            throw new Error(result.error);
        }
    } catch (error) {
        console.error('Failed to save note:', error);
        alert('Failed to save note: ' + error.message);
    }
}