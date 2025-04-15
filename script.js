document.addEventListener('DOMContentLoaded', () => {
    const noteList = document.getElementById('note-list');
    const newNoteBtn = document.getElementById('new-note-btn');
    const noteTitleInput = document.getElementById('note-title-input');
    const noteContentInput = document.getElementById('note-content-input');
    const rightPanel = document.querySelector('.right-panel');
    const noteEditor = document.querySelector('.note-editor');
    const welcomeScreen = document.querySelector('.welcome-screen');
    const editPaletteBtn = document.getElementById('edit-palette-btn');
    const colorPaletteEditor = document.getElementById('color-palette-editor');
    const neonColorPicker = document.getElementById('neon-color-picker');
    const addImageBtn = document.getElementById('add-image-btn');
    const imageUploadInput = document.getElementById('image-upload-input');
    const exportNoteBtn = document.getElementById('export-note-btn');
    const deleteNoteBtn = document.getElementById('delete-note-btn');
    const confirmationModal = document.getElementById('confirmation-modal');
    const modalMessage = document.getElementById('modal-message');
    const modalConfirmBtn = document.getElementById('modal-confirm-btn');
    const modalCancelBtn = document.getElementById('modal-cancel-btn');
    const noteMetadataDiv = document.getElementById('note-metadata');
    const wordCountSpan = document.getElementById('word-count');
    const createdDateSpan = document.getElementById('created-date');
    const modifiedDateSpan = document.getElementById('modified-date');

    let notes = [];
    let activeNoteId = null;
    let modalConfirmCallback = null;
    let debounceTimer;

    const formatDate = (isoString) => {
        if (!isoString) return '---';
        try {
            const options = {
                year: 'numeric', month: 'short', day: 'numeric',
                hour: '2-digit', minute: '2-digit'
            };
            return new Date(isoString).toLocaleString(['es-VE', 'es', 'en'], options);
        } catch (e) {
            console.error("Error formatting date:", e);
            return 'Fecha inválida';
        }
    };

    const countWords = (htmlContent) => {
        if (!htmlContent) return 0;
        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = htmlContent;
        const plainText = tempDiv.textContent || tempDiv.innerText || "";
        const words = plainText.trim().split(/\s+/).filter(word => word.length > 0);
        return words.length;
    };

    const updateMetadataDisplay = (note) => {
        if (note) {
            wordCountSpan.textContent = `Palabras: ${countWords(note.content)}`;
            createdDateSpan.textContent = `Creado: ${formatDate(note.createdAt)}`;
            modifiedDateSpan.textContent = `Modificado: ${formatDate(note.updatedAt)}`;
            noteMetadataDiv.classList.remove('hidden');
        } else {
            wordCountSpan.textContent = 'Palabras: 0';
            createdDateSpan.textContent = 'Creado: ---';
            modifiedDateSpan.textContent = 'Modificado: ---';
        }
    };

    const loadNotes = () => {
        const storedNotes = localStorage.getItem('notesApp_notes');
        notes = storedNotes ? JSON.parse(storedNotes) : [];
        notes.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    };

    const saveNotes = () => {
        localStorage.setItem('notesApp_notes', JSON.stringify(notes));
    };

    const renderNoteList = () => {
        notes.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        noteList.innerHTML = '';
        if (notes.length === 0) {
             noteList.innerHTML = '<li class="no-notes">Crea tu primera nota</li>';
        } else {
            notes.forEach(note => {
                const li = document.createElement('li');
                li.textContent = note.title.trim() || 'Nota sin título';
                li.title = note.title.trim() || 'Nota sin título';
                li.dataset.noteId = note.id;
                if (note.id === activeNoteId) {
                    li.classList.add('selected');
                }
                noteList.appendChild(li);
            });
        }
    };

    const showEditor = (show = true) => {
        if (show) {
            noteEditor.classList.add('active');
            welcomeScreen.classList.add('hidden');
        } else {
            noteEditor.classList.remove('active');
            welcomeScreen.classList.remove('hidden');
            activeNoteId = null;
            renderNoteList();
            updateMetadataDisplay(null);
        }
    };

    const loadNoteIntoEditor = (noteId) => {
        const note = notes.find(n => n.id === noteId);
        if (note) {
            activeNoteId = noteId;
            noteTitleInput.value = note.title;
            noteContentInput.innerHTML = note.content;
            showEditor(true);
            renderNoteList();
            updateMetadataDisplay(note);
            noteContentInput.scrollTop = 0;
            noteTitleInput.focus();
        } else {
            console.warn(`Nota con ID ${noteId} no encontrada.`);
            showEditor(false);
        }
    };

    const createNewNote = () => {
        const now = new Date().toISOString();
        const newNote = {
            id: Date.now().toString(),
            title: '',
            content: '',
            createdAt: now,
            updatedAt: now
        };
        notes.unshift(newNote);
        saveNotes();
        activeNoteId = newNote.id;
        loadNoteIntoEditor(activeNoteId);
    };

    const updateNote = () => {
        if (!activeNoteId) return;

        const noteIndex = notes.findIndex(n => n.id === activeNoteId);
        if (noteIndex > -1) {
            const updatedTitle = noteTitleInput.value;
            const updatedContent = noteContentInput.innerHTML;
            const currentNote = notes[noteIndex];

            if (currentNote.title !== updatedTitle || currentNote.content !== updatedContent) {
                currentNote.title = updatedTitle;
                currentNote.content = updatedContent;
                currentNote.updatedAt = new Date().toISOString();

                saveNotes();
                renderNoteList();
                updateMetadataDisplay(currentNote);
            }
        }
    };

    const deleteNote = (noteId) => {
        const noteToDelete = notes.find(n => n.id === noteId);
        const title = noteToDelete?.title.trim() || 'Nota sin título';
        const message = `¿Estás seguro de que quieres eliminar la nota "${title}"? Esta acción no se puede deshacer.`;

        showConfirmationModal(message, () => {
            notes = notes.filter(n => n.id !== noteId);
            saveNotes();
            if (activeNoteId === noteId) {
                 showEditor(false);
            }
            renderNoteList();
        });
    };

    const exportNote = () => {
        if (!activeNoteId) {
            alert("Selecciona una nota para exportar.");
            return;
        }
        const note = notes.find(n => n.id === activeNoteId);
        if (!note) return;

        const contentToExport = `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>${note.title || 'Nota Exportada'}</title>
    <style>
        body { font-family: sans-serif; line-height: 1.6; padding: 20px; }
        h1 { border-bottom: 1px solid #ccc; padding-bottom: 10px; }
        img { max-width: 100%; height: auto; display: block; margin: 10px 0; }
    </style>
</head>
<body>
    <h1>${note.title}</h1>
    <div>${note.content}</div>
    <hr>
    <p><small>Exportado el: ${formatDate(new Date().toISOString())}</small></p>
    <p><small>Creado originalmente: ${formatDate(note.createdAt)}</small></p>
</body>
</html>`;

        const blob = new Blob([contentToExport], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const safeTitle = (note.title.trim() || 'nota_sin_titulo').replace(/[^a-z0-9]/gi, '_').toLowerCase();
        a.download = `${safeTitle}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const triggerImageUpload = () => {
        if (!activeNoteId) {
             alert("Selecciona o crea una nota antes de añadir una imagen.");
             return;
        }
        imageUploadInput.click();
    };

    const handleImageUpload = (event) => {
        const file = event.target.files[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = document.createElement('img');
                img.src = e.target.result;
                img.alt = file.name || "Imagen cargada";
                img.style.maxWidth = '80%';
                img.style.height = 'auto';

                insertElementAtCursor(img);
                imageUploadInput.value = null;
                updateNote();
            };
            reader.onerror = (error) => {
                 console.error("Error leyendo el archivo de imagen:", error);
                 alert("Hubo un error al cargar la imagen.");
            };
            reader.readAsDataURL(file);
        } else if (file) {
            alert('Por favor, selecciona un archivo de imagen válido (JPG, PNG, GIF, etc.).');
            imageUploadInput.value = null;
        }
    };

    const insertElementAtCursor = (element) => {
        const selection = window.getSelection();
        if (!selection.rangeCount) {
             noteContentInput.appendChild(element);
        } else {
            let range = selection.getRangeAt(0);

            if (!noteContentInput.contains(range.commonAncestorContainer)) {
                 range.selectNodeContents(noteContentInput);
                 range.collapse(false);
            }

            range.deleteContents();

            range.insertNode(element);
            const space = document.createTextNode(' ');
            range.insertNode(space);

            range.setStartAfter(space);
            range.collapse(true);
            selection.removeAllRanges();
            selection.addRange(range);
        }
         noteContentInput.focus();
    };

     const loadNeonColor = () => {
        const savedColor = localStorage.getItem('notesApp_neonColor') || '#00ffff';
        neonColorPicker.value = savedColor;
        applyNeonColor(savedColor);
     };

     const applyNeonColor = (color) => {
        document.documentElement.style.setProperty('--neon-color', color);
         const rgb = hexToRgb(color);
         if (rgb) {
             document.documentElement.style.setProperty('--neon-rgb', `${rgb.r}, ${rgb.g}, ${rgb.b}`);
         } else {
              document.documentElement.style.setProperty('--neon-rgb', '0, 255, 255');
         }
     };

     const saveNeonColor = (color) => {
        localStorage.setItem('notesApp_neonColor', color);
        applyNeonColor(color);
     }

    function hexToRgb(hex) {
        const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
        hex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }

    const togglePaletteEditor = () => {
        colorPaletteEditor.classList.toggle('hidden');
    };

     const showConfirmationModal = (message, onConfirm) => {
         modalMessage.textContent = message;
         modalConfirmCallback = onConfirm;
         confirmationModal.classList.remove('hidden');
         modalConfirmBtn.focus();
     };

     const hideConfirmationModal = () => {
         confirmationModal.classList.add('hidden');
         modalConfirmCallback = null;
     };

    newNoteBtn.addEventListener('click', createNewNote);

    noteList.addEventListener('click', (e) => {
        const listItem = e.target.closest('li[data-note-id]');
        if (listItem) {
            const noteId = listItem.dataset.noteId;
            if (noteId !== activeNoteId) {
                 loadNoteIntoEditor(noteId);
            }
        }
    });

    const debouncedUpdate = () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            updateNote();
        }, 600);
    };
    noteTitleInput.addEventListener('input', debouncedUpdate);
    noteContentInput.addEventListener('input', debouncedUpdate);

    deleteNoteBtn.addEventListener('click', () => {
        if (activeNoteId) {
            deleteNote(activeNoteId);
        } else {
            alert("No hay ninguna nota seleccionada para eliminar.");
        }
    });

    exportNoteBtn.addEventListener('click', exportNote);

    editPaletteBtn.addEventListener('click', togglePaletteEditor);

    neonColorPicker.addEventListener('input', (e) => {
        saveNeonColor(e.target.value);
    });
    neonColorPicker.addEventListener('change', (e) => {
        saveNeonColor(e.target.value);
    });

    addImageBtn.addEventListener('click', triggerImageUpload);
    imageUploadInput.addEventListener('change', handleImageUpload);

    modalConfirmBtn.addEventListener('click', () => {
        if (modalConfirmCallback) {
            modalConfirmCallback();
        }
        hideConfirmationModal();
    });
    modalCancelBtn.addEventListener('click', hideConfirmationModal);
    confirmationModal.addEventListener('click', (e) => {
        if (e.target === confirmationModal) {
            hideConfirmationModal();
        }
    });
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !confirmationModal.classList.contains('hidden')) {
            hideConfirmationModal();
        }
    });

    loadNeonColor();
    loadNotes();
    renderNoteList();
    showEditor(false);

});
