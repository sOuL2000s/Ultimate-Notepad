document.addEventListener('DOMContentLoaded', () => {
    // --- AI Configuration (Hardcoded as requested) ---
    const API_KEY = 'AIzaSyCzx6ReMk8ohPJcCjGwHHzu7SvFccJqAbA';
    const MODEL_NAME = 'gemini-2.5-flash-preview-09-2025';
    const API_BASE_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${API_KEY}`;
    
    // --- DOM Elements ---
    const noteList = document.getElementById('note-list');
    const newNoteBtn = document.getElementById('new-note-btn');
    const noteTitleInput = document.getElementById('note-title');
    const noteContentEditor = document.getElementById('note-content');
    const deleteNoteBtn = document.getElementById('delete-note-btn');
    const searchNotesInput = document.getElementById('search-notes');
    const toolbarButtons = document.querySelectorAll('.tool-btn');
    const themeToggleButton = document.getElementById('theme-toggle-btn');
    const accentColorPicker = document.getElementById('accent-color-picker');
    const fontSizeSlider = document.getElementById('font-size-slider');

    // Chatbot Elements
    const chatbotToggleButton = document.getElementById('chatbot-toggle-btn');
    const chatbotWindow = document.getElementById('chatbot-window');
    const chatbotCloseBtn = document.getElementById('chatbot-close-btn');
    const chatbotMessages = document.getElementById('chatbot-messages');
    const chatbotInput = document.getElementById('chatbot-input');
    const chatbotSendBtn = document.getElementById('chatbot-send-btn');
    const chatbotVoiceBtn = document.getElementById('chatbot-voice-btn');
    const chatbotUploadBtn = document.getElementById('chatbot-upload-btn');
    const chatbotFileInput = document.getElementById('chatbot-file-input');
    const uploadedFilesList = document.getElementById('uploaded-files-list');

    // Editor Enhancement Elements
    const insertCodeBtn = document.getElementById('insert-code-btn');
    const beautifyTextBtn = document.getElementById('beautify-text-btn');
    const openFindReplaceBtn = document.getElementById('open-find-replace-btn');
    const findReplaceDialog = document.getElementById('find-replace-dialog');
    const findInput = document.getElementById('find-input');
    const replaceInput = document.getElementById('replace-input');
    const findNextBtn = document.getElementById('find-next-btn');
    const replaceOneBtn = document.getElementById('replace-one-btn');
    const replaceAllBtn = document.getElementById('replace-all-btn');
    const closeFindBtn = document.getElementById('close-find-btn');

    // --- State Variables ---
    let notes = []; 
    let activeNoteId = null; 
    let uploadedFiles = [];
    let findMatches = [];
    let currentMatchIndex = -1;

    // --- Utility Functions ---

    const generateId = () => Date.now().toString();

    // Save notes to LocalStorage
    const saveNotes = () => {
        localStorage.setItem('ultimate-notepad-notes', JSON.stringify(notes));
    };

    // Load notes from LocalStorage
    const loadNotes = () => {
        const storedNotes = localStorage.getItem('ultimate-notepad-notes');
        notes = storedNotes ? JSON.parse(storedNotes) : [];
        if (notes.length === 0) {
            createNote('Welcome to Ultimate Notepad!', 'Start typing your amazing notes here!');
        }
    };

    // --- Theme Customization Functions ---

    const hexToRgb = hex => {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `${r}, ${g}, ${b}`;
    };

    const applyThemeSettings = () => {
        const savedTheme = localStorage.getItem('ultimate-notepad-theme') || 'light';
        document.body.classList.toggle('dark-mode', savedTheme === 'dark');

        const savedAccentColor = localStorage.getItem('ultimate-notepad-accent-color') || '#007bff';
        document.documentElement.style.setProperty('--accent-color', savedAccentColor);
        accentColorPicker.value = savedAccentColor;
        document.documentElement.style.setProperty('--accent-color-rgb', hexToRgb(savedAccentColor));

        const savedFontSize = localStorage.getItem('ultimate-notepad-font-size') || '16';
        document.documentElement.style.setProperty('--font-size-base', `${savedFontSize}px`);
        fontSizeSlider.value = savedFontSize;
    };

    const toggleTheme = () => {
        document.body.classList.toggle('dark-mode');
        const currentTheme = document.body.classList.contains('dark-mode') ? 'dark' : 'light';
        localStorage.setItem('ultimate-notepad-theme', currentTheme);
    };

    const changeAccentColor = (event) => {
        const newColor = event.target.value;
        document.documentElement.style.setProperty('--accent-color', newColor);
        localStorage.setItem('ultimate-notepad-accent-color', newColor);
        document.documentElement.style.setProperty('--accent-color-rgb', hexToRgb(newColor));
    };

    const changeFontSize = (event) => {
        const newSize = event.target.value;
        document.documentElement.style.setProperty('--font-size-base', `${newSize}px`);
        localStorage.setItem('ultimate-notepad-font-size', newSize);
    };


    // --- Note Management Functions (Render, Select, Update, Delete) ---

    const renderNoteList = (filter = '') => {
        noteList.innerHTML = ''; 
        const filteredNotes = notes.filter(note =>
            note.title.toLowerCase().includes(filter.toLowerCase()) ||
            note.content.replace(/<[^>]*>?/gm, '').toLowerCase().includes(filter.toLowerCase())
        );

        filteredNotes.forEach(note => {
            const listItem = document.createElement('li');
            listItem.classList.add('note-item');
            if (note.id === activeNoteId) {
                listItem.classList.add('active');
            }
            listItem.dataset.id = note.id;
            listItem.innerHTML = `
                <h3>${note.title.substring(0, 30) || 'Untitled'}</h3>
                <p>${note.content.replace(/<[^>]*>?/gm, '').substring(0, 50) || 'No content'}</p>
            `;
            listItem.addEventListener('click', () => selectNote(note.id));
            noteList.appendChild(listItem);
        });
    };

    const createNote = (title = 'New Note', content = '') => {
        const newNote = {
            id: generateId(),
            title: title,
            content: content,
            timestamp: new Date().toISOString()
        };
        notes.unshift(newNote); 
        saveNotes();
        selectNote(newNote.id);
    };

    const selectNote = (id) => {
        activeNoteId = id;
        const note = notes.find(n => n.id === id);

        if (note) {
            noteTitleInput.value = note.title;
            noteContentEditor.innerHTML = note.content;
            noteContentEditor.focus();
            
            document.querySelectorAll('.note-item').forEach(item => item.classList.remove('active'));
            const selectedItem = document.querySelector(`.note-item[data-id="${id}"]`);
            if (selectedItem) {
                selectedItem.classList.add('active');
            }
        } else {
            activeNoteId = null;
            noteTitleInput.value = '';
            noteContentEditor.innerHTML = '';
        }
        updateToolbarState();
        renderNoteList(searchNotesInput.value); 
    };

    const updateNote = () => {
        if (!activeNoteId) return;

        const note = notes.find(n => n.id === activeNoteId);
        if (note) {
            note.title = noteTitleInput.value;
            note.content = noteContentEditor.innerHTML;
            note.timestamp = new Date().toISOString(); 
            saveNotes();
            renderNoteList(searchNotesInput.value);
        }
    };

    const deleteNote = () => {
        if (!activeNoteId || !confirm('Are you sure you want to delete this note?')) return;

        notes = notes.filter(n => n.id !== activeNoteId);
        saveNotes();
        activeNoteId = null; 
        noteTitleInput.value = '';
        noteContentEditor.innerHTML = '';
        renderNoteList(searchNotesInput.value);

        if (notes.length > 0) {
            selectNote(notes[0].id);
        } else {
            createNote('Welcome to Ultimate Notepad!', 'Start typing your amazing notes here!');
        }
    };

    // --- Rich Text Editor Functions ---

    const executeCommand = (command, value = null) => {
        document.execCommand(command, false, value);
        noteContentEditor.focus(); 
        updateToolbarState();
    };

    const updateToolbarState = () => {
        toolbarButtons.forEach(button => {
            const command = button.dataset.command;
            const value = button.dataset.value;

            if (command === 'formatBlock') {
                const parentBlock = document.queryCommandValue('formatBlock');
                if (parentBlock && parentBlock.toLowerCase() === value) {
                    button.classList.add('active');
                } else {
                    button.classList.remove('active');
                }
            } else {
                if (document.queryCommandState(command)) {
                    button.classList.add('active');
                } else {
                    button.classList.remove('active');
                }
            }
        });
    };
    
    // --- Advanced Editor Features: Markdown & AI Beautification ---
    
    // Simple Markdown to HTML Renderer (for pasted content and AI response)
    const renderMarkdown = (markdownText) => {
        let html = markdownText
            .replace(/^### (.*$)/gim, '<h3>$1</h3>')
            .replace(/^## (.*$)/gim, '<h2>$1</h2>')
            .replace(/^# (.*$)/gim, '<h1>$1</h1>')
            .replace(/\*\*\*(.*?)\*\*\*/gims, '<b><i>$1</i></b>')
            .replace(/\*\*(.*?)\*\*/gims, '<b>$1</b>')
            .replace(/\*(.*?)\*/gims, '<i>$1</i>')
            .replace(/```(\w+)?\n([\s\S]*?)```/gims, (match, lang, code) => `<pre><code>${code.trim()}</code></pre>`)
            .replace(/`(.*?)`/gims, '<code>$1</code>')
            .replace(/^> (.*$)/gim, '<blockquote>$1</blockquote>');
            
        // Basic paragraph wrapping (avoid wrapping existing block elements)
        html = html.split('\n\n').map(p => {
            p = p.trim();
            if (!p || p.match(/<(h|ul|ol|block|pre|table)/i)) return p;
            return `<p>${p.replace(/\n/g, '<br>')}</p>`;
        }).join('');

        return html;
    };

    // Handle incoming pasted text, attempting to convert Markdown
    const handleMarkdownInput = (event) => {
        if (event.type === 'paste') {
            event.preventDefault();
            const text = (event.clipboardData || window.clipboardData).getData('text');
            
            // Check for common Markdown syntax to trigger conversion
            if (text.includes('#') || text.includes('*') || text.includes('`') || text.includes('>')) {
                const html = renderMarkdown(text);
                document.execCommand('insertHTML', false, html);
            } else {
                document.execCommand('insertText', false, text);
            }
            updateNote();
        } 
    };

    // AI Function: Intelligent Beautify/Correct
    const handleBeautifyText = async () => {
        const content = noteContentEditor.innerText.trim();
        if (!content) return;

        beautifyTextBtn.disabled = true;
        beautifyTextBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
        
        const prompt = `Act as a code and content beautification specialist. Analyze the following text or code. If it is code, correct any obvious errors, suggest syntax highlighting (using markdown formatting like \`\`\`language\`), and format it beautifully. If it is natural language text, ensure perfect grammar, elegant phrasing, and readable structure. Return ONLY the final, corrected and beautified result in Markdown format. The user provided: \n\n${content}`;

        const beautifiedContent = await callGeminiApi([{ role: "user", parts: [{ text: prompt }] }]);
        
        // Re-inject content, rendering the markdown output from the AI
        noteContentEditor.innerHTML = renderMarkdown(beautifiedContent);
        
        updateNote();
        beautifyTextBtn.disabled = false;
        beautifyTextBtn.innerHTML = '<i class="fas fa-magic"></i>';
    };

    // --- Find and Replace Logic ---

    const openFindReplace = () => {
        findReplaceDialog.classList.remove('hidden');
        findInput.focus();
    };

    const closeFindReplace = () => {
        findReplaceDialog.classList.add('hidden');
        clearHighlights();
        findMatches = [];
        currentMatchIndex = -1;
    };
    
    // Utility to clear existing highlights
    const clearHighlights = () => {
        const highlightedElements = noteContentEditor.querySelectorAll('.highlight');
        highlightedElements.forEach(node => {
            // Unwrap the span, leaving content behind
            node.outerHTML = node.innerHTML;
        });
    };
    
    const findText = () => {
        // Must clear highlights *before* getting innerHTML to avoid nested spans
        clearHighlights();
        const searchTerm = findInput.value.trim();
        if (!searchTerm) {
            findMatches = [];
            currentMatchIndex = -1;
            return;
        }

        let contentHTML = noteContentEditor.innerHTML;
        
        // Escape special regex characters in the search term
        const escapedSearchTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`(?<!<[^>]*>)(${escapedSearchTerm})`, 'gmi'); 
        
        // Use a counter to track matches
        let matchCount = 0;
        const highlightedHtml = contentHTML.replace(regex, (match) => {
             matchCount++;
             return `<span class="highlight">${match}</span>`;
        });
        
        noteContentEditor.innerHTML = highlightedHtml;
        
        const highlightElements = noteContentEditor.querySelectorAll('.highlight');
        findMatches = Array.from(highlightElements);
        currentMatchIndex = -1;
        
        if (findMatches.length > 0) {
            findNext(); // Highlight the first match immediately
        }
    };
    
    const findNext = () => {
        if (findMatches.length === 0) {
            findText(); 
            if (findMatches.length === 0) return;
        }

        if (currentMatchIndex !== -1) {
            findMatches[currentMatchIndex].classList.remove('active-highlight');
        }

        currentMatchIndex = (currentMatchIndex + 1) % findMatches.length;

        const activeMatch = findMatches[currentMatchIndex];
        activeMatch.classList.add('active-highlight');
        activeMatch.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Set focus/selection on the matched text
        const range = document.createRange();
        range.selectNode(activeMatch);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
    };

    const replaceOne = () => {
        if (currentMatchIndex === -1 || findMatches.length === 0) {
            alert('Please find text first.');
            return;
        }
        
        const activeMatch = findMatches[currentMatchIndex];
        const replacementText = replaceInput.value;

        // Replace the element's content, then force a re-search
        activeMatch.outerHTML = replacementText;
        updateNote(); 
        findText();
    };

    const replaceAll = () => {
        const searchTerm = findInput.value.trim();
        const replacementText = replaceInput.value;
        if (!searchTerm) return;
        
        const escapedSearchTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(escapedSearchTerm, 'gmi');
        
        // Get clean text content, replace, and then re-inject as HTML text
        // Note: This operation removes all existing HTML formatting!
        let cleanText = noteContentEditor.innerText; 
        cleanText = cleanText.replace(regex, replacementText);
        
        noteContentEditor.innerHTML = cleanText;
        
        clearHighlights();
        findMatches = [];
        currentMatchIndex = -1;
        updateNote();
        alert(`All occurrences of "${searchTerm}" replaced.`);
        closeFindReplace();
    };

    // --- AI Assistant (Chatbot) Functions ---

    // Helper for Gemini API Call
    const callGeminiApi = async (contents) => {
        try {
            const response = await fetch(API_BASE_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: contents,
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('Gemini API Error:', errorData);
                return `Sorry, the AI assistant encountered an error (${response.status}): ${errorData.error.message}`;
            }

            const data = await response.json();
            return data.candidates[0].content.parts[0].text;

        } catch (error) {
            console.error("AI Assistant Failure:", error);
            return "Sorry, I encountered a network error or API communication problem.";
        }
    };

    // Display message in the chat window
    const displayMessage = (text, sender) => {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', `${sender}-message`);

        if (sender === 'assistant') {
            messageDiv.innerHTML = renderMarkdown(text);
        } else {
            messageDiv.textContent = text;
        }

        chatbotMessages.appendChild(messageDiv);
        chatbotMessages.scrollTop = chatbotMessages.scrollHeight; 
    };

    // Convert file to base64 for Gemini API (VLM capability)
    const fileToGenerativePart = (file) => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const base64Data = e.target.result.split(',')[1];
                resolve({
                    inlineData: {
                        data: base64Data,
                        mimeType: file.type || 'application/octet-stream'
                    }
                });
            };
            reader.readAsDataURL(file);
        });
    };

    // Handle sending the message to the AI
    const sendMessage = async () => {
        const prompt = chatbotInput.value.trim();
        if (!prompt && uploadedFiles.length === 0) return;

        // Display user message
        const fileCount = uploadedFiles.length > 0 ? ` (+${uploadedFiles.length} files)` : '';
        displayMessage(prompt + fileCount, 'user');
        
        chatbotInput.value = '';
        chatbotSendBtn.disabled = true;
        
        // Prepare contents array
        let contents = [];
        const fileParts = await Promise.all(uploadedFiles.map(fileToGenerativePart));
        
        contents.push(...fileParts);
        if (prompt) {
             contents.push({ text: prompt });
        }
        
        // Clear files display and state
        uploadedFiles = [];
        uploadedFilesList.innerHTML = '';
        chatbotFileInput.value = ''; // Reset file input

        // Call the API
        const assistantResponse = await callGeminiApi([{ role: "user", parts: contents }]);
        
        displayMessage(assistantResponse, 'assistant');
        chatbotSendBtn.disabled = false;
        chatbotInput.focus();
    };
    
    // File Upload Handling
    const handleFileChange = (event) => {
        uploadedFiles = Array.from(event.target.files);
        uploadedFilesList.innerHTML = '';
        if (uploadedFiles.length > 0) {
            uploadedFiles.forEach(file => {
                const tag = document.createElement('span');
                tag.classList.add('file-tag');
                tag.textContent = `${file.name}`;
                uploadedFilesList.appendChild(tag);
            });
        }
    };

    // Voice Typing Implementation
    const setupVoiceTyping = () => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

        if (!SpeechRecognition) {
            chatbotVoiceBtn.style.display = 'none';
            console.warn('Speech Recognition not supported in this browser.');
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.addEventListener('result', (e) => {
            const transcript = Array.from(e.results)
                .map(result => result[0])
                .map(result => result.transcript)
                .join('');
            chatbotInput.value = transcript;
        });
        
        recognition.addEventListener('start', () => {
            chatbotVoiceBtn.classList.add('active');
            chatbotVoiceBtn.title = 'Listening... Click to stop.';
        });

        recognition.addEventListener('end', () => {
            chatbotVoiceBtn.classList.remove('active');
            chatbotVoiceBtn.title = 'Voice Input';
            // Automatically send the message if something was transcribed
            if (chatbotInput.value.trim()) {
                sendMessage();
            }
        });

        recognition.addEventListener('error', (e) => {
            console.error('Speech Recognition Error:', e);
            alert('Voice input failed. Please check microphone permissions.');
            chatbotVoiceBtn.classList.remove('active');
        });

        chatbotVoiceBtn.addEventListener('click', () => {
            if (chatbotVoiceBtn.classList.contains('active')) {
                recognition.stop();
            } else {
                chatbotInput.value = ''; 
                recognition.start();
            }
        });
    };


    // --- Event Listeners ---

    // Note actions
    newNoteBtn.addEventListener('click', () => createNote());
    deleteNoteBtn.addEventListener('click', deleteNote);
    noteTitleInput.addEventListener('input', updateNote);
    noteContentEditor.addEventListener('input', updateNote);
    noteContentEditor.addEventListener('paste', handleMarkdownInput); // Markdown on Paste
    
    // Editor UI updates
    noteContentEditor.addEventListener('mouseup', updateToolbarState);
    noteContentEditor.addEventListener('keyup', updateToolbarState);
    noteContentEditor.addEventListener('focus', updateToolbarState);

    // Search
    searchNotesInput.addEventListener('input', (event) => {
        renderNoteList(event.target.value);
    });

    // Toolbar commands
    toolbarButtons.forEach(button => {
        button.addEventListener('click', () => {
            const command = button.dataset.command;
            const value = button.dataset.value || null;
            executeCommand(command, value);
        });
    });

    // AI/Enhanced Editor commands
    insertCodeBtn.addEventListener('click', () => {
        // Insert a basic pre-formatted block for code syntax
        executeCommand('insertHTML', '<pre>function example() {\n    // Code here\n}</pre>');
    });
    beautifyTextBtn.addEventListener('click', handleBeautifyText);

    // Find/Replace commands
    openFindReplaceBtn.addEventListener('click', openFindReplace);
    closeFindBtn.addEventListener('click', closeFindReplace);
    findInput.addEventListener('input', findText);
    findNextBtn.addEventListener('click', findNext);
    replaceOneBtn.addEventListener('click', replaceOne);
    replaceAllBtn.addEventListener('click', replaceAll);
    findInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') findNext(); });
    
    // Theme controls
    themeToggleButton.addEventListener('click', toggleTheme);
    accentColorPicker.addEventListener('input', changeAccentColor);
    fontSizeSlider.addEventListener('input', changeFontSize);
    
    // Chatbot controls
    chatbotToggleButton.addEventListener('click', () => {
        chatbotWindow.classList.toggle('hidden');
        if (!chatbotWindow.classList.contains('hidden')) {
            chatbotInput.focus();
        }
    });
    chatbotCloseBtn.addEventListener('click', () => {
        chatbotWindow.classList.add('hidden');
    });
    chatbotSendBtn.addEventListener('click', sendMessage);
    chatbotInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
    chatbotUploadBtn.addEventListener('click', () => {
        chatbotFileInput.click();
    });
    chatbotFileInput.addEventListener('change', handleFileChange);


    // --- Initialization ---
    const init = () => {
        applyThemeSettings(); 
        loadNotes();
        renderNoteList();

        if (notes.length > 0) {
            selectNote(notes[0].id);
        } else {
            createNote('Welcome to Ultimate Notepad!', 'Start typing your amazing notes here!');
        }
        
        setupVoiceTyping(); 
    };

    init();
});