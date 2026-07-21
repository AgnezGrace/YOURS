let state = {
    books: [],
    activeBookId: null,
    activeChapterId: null
};

const bookshelfView = document.getElementById('bookshelf-view');
const editorView = document.getElementById('editor-view');
const readingView = document.getElementById('reading-view');
const bookGrid = document.getElementById('book-grid');

const btnNewBook = document.getElementById('btn-new-book');
const newBookModal = document.getElementById('new-book-modal');
const btnCloseModal = document.getElementById('btn-close-modal');
const btnCancelModal = document.getElementById('btn-cancel-modal');
const btnSubmitBook = document.getElementById('btn-submit-book');
const bookTitleInput = document.getElementById('book-title');

const customSelect = document.getElementById('custom-genre-select');
const selectTrigger = document.getElementById('genre-select-trigger');
const bookGenreInput = document.getElementById('book-genre');

const editCoverModal = document.getElementById('edit-cover-modal');
const customCoverSelect = document.getElementById('custom-cover-select');
const coverSelectTrigger = document.getElementById('cover-select-trigger');
const selectedCoverText = document.getElementById('selected-cover-text');
const coverSourceSelect = document.getElementById('cover-source-select');
const coverUrlGroup = document.getElementById('cover-url-group');
const coverFileGroup = document.getElementById('cover-file-group');
const coverUrlInput = document.getElementById('cover-url-input');
const coverFileInput = document.getElementById('cover-file-input');
const btnCancelCoverModal = document.getElementById('btn-cancel-cover-modal');
const btnCloseCoverModal = document.getElementById('btn-close-cover-modal');
const btnSaveCover = document.getElementById('btn-save-cover');

const btnSettings = document.getElementById('btn-settings');
const settingsModal = document.getElementById('settings-modal');
const btnCloseSettings = document.getElementById('btn-close-settings');
const btnExportJson = document.getElementById('btn-export-json');
const btnImportJson = document.getElementById('btn-import-json');
const importFileInput = document.getElementById('import-file-input');

const deleteConfirmModal = document.getElementById('delete-confirm-modal');
const deleteBookTitleSpan = document.getElementById('delete-book-title');
const btnCloseDeleteModal = document.getElementById('btn-close-delete-modal');
const btnCancelDelete = document.getElementById('btn-cancel-delete');
const btnConfirmDelete = document.getElementById('btn-confirm-delete');

const deleteChapterModal = document.getElementById('delete-chapter-modal');
const deleteChapterTitleSpan = document.getElementById('delete-chapter-title');
const btnCloseChapterModal = document.getElementById('btn-close-chapter-modal');
const btnCancelChapterDelete = document.getElementById('btn-cancel-chapter-delete');
const btnConfirmChapterDelete = document.getElementById('btn-confirm-chapter-delete');

const sidebarNovelTitle = document.getElementById('sidebar-novel-title');
const btnBackToLibrary = document.getElementById('btn-back-to-library');
const btnAddChapter = document.getElementById('btn-add-chapter');
const chapterList = document.getElementById('chapter-list');
const sidebar = document.getElementById('sidebar');
const btnToggleSidebar = document.getElementById('btn-toggle-sidebar');
const sidebarOverlay = document.getElementById('sidebar-overlay');

const editorTitle = document.getElementById('editor-title');
const editorContent = document.getElementById('editor-content');
const btnBold = document.getElementById('btn-bold');
const btnItalic = document.getElementById('btn-italic');
const wordCountSpan = document.getElementById('word-count');
const statusDot = document.querySelector('.status-dot');
const statusText = document.querySelector('.status-text');

const btnReadingMode = document.getElementById('btn-reading-mode');
const btnExitReading = document.getElementById('btn-exit-reading');
const btnToggleReadingTheme = document.getElementById('btn-toggle-reading-theme');
const readingTitle = document.getElementById('reading-title');
const readingBody = document.getElementById('reading-body');

let autoSaveTimeout = null;
let bookIdToDelete = null;
let chapterIdToDelete = null;
let bookIdToEditCover = null;
let logoClicks = 0;

function handleScreenResize() {
    const width = window.innerWidth;
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
    if (width > 768) {
        closeSidebarOnMobile();
    }
}

function handleRouting() {
    const hash = location.hash;
    const activeModal = document.querySelector('.modal-overlay.active');
    
    if (activeModal && !hash.includes('/modal/')) {
        activeModal.classList.remove('active');
        bookTitleInput.value = '';
        customSelect.classList.remove('open');
        bookIdToEditCover = null;
        bookIdToDelete = null;
        chapterIdToDelete = null;
        return;
    }

    if (hash.startsWith('#/editor/')) {
        const parts = hash.split('/');
        const bookId = parts[2];
        state.activeBookId = bookId;
        saveToLocalStorage();
        loadBook(bookId);
        showView('editor-view');
        closeSidebarOnMobile();
    } else if (hash.startsWith('#/reading/')) {
        const parts = hash.split('/');
        const bookId = parts[2];
        const chapterId = parts[3];
        state.activeBookId = bookId;
        state.activeChapterId = chapterId;
        saveToLocalStorage();
        
        const book = state.books.find(b => b.id === bookId);
        if (book) {
            const chapter = book.chapters.find(ch => ch.id === chapterId);
            if (chapter) {
                readingTitle.textContent = chapter.title || 'Untitled Chapter';
                readingBody.innerHTML = chapter.content || '<p><i>This chapter is empty.</i></p>';
                showView('reading-view');
            }
        }
    } else {
        state.activeBookId = null;
        state.activeChapterId = null;
        saveToLocalStorage();
        renderBookshelf();
        showView('bookshelf-view');
        closeSidebarOnMobile();
    }
}

function openModalWithHistory(modal) {
    modal.classList.add('active');
    const currentHash = location.hash || '#/bookshelf';
    if (!currentHash.includes('/modal/')) {
        location.hash = `${currentHash}/modal/${modal.id}`;
    }
}

function closeModalWithHistory() {
    const activeModal = document.querySelector('.modal-overlay.active');
    if (activeModal) {
        history.back();
    }
}

function init() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js').catch(() => {});
    }
    handleScreenResize();
    const savedData = localStorage.getItem('novel_studio_library');
    if (savedData) {
        state = JSON.parse(savedData);
    }
    
    if (!location.hash) {
        if (state.activeBookId) {
            location.hash = `#/editor/${state.activeBookId}`;
        } else {
            location.hash = '#/bookshelf';
        }
    } else {
        handleRouting();
    }
    
    setupEventListeners();

    setTimeout(() => {
        const splash = document.getElementById('splash-screen');
        if (splash) {
            splash.classList.add('fade-out');
            setTimeout(() => {
                splash.remove();
            }, 1000);
        }
    }, 2000);
}

function showView(viewId) {
    bookshelfView.classList.remove('active');
    editorView.classList.remove('active');
    readingView.classList.remove('active');
    
    document.getElementById(viewId).classList.add('active');
}

function getGenreSvg(genre) {
    const svgHeader = '<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="book-cover-icon">';
    const svgFooter = '</svg>';
    let paths = '';
    switch (genre) {
        case 'Fantasy':
            paths = '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>';
            break;
        case 'Sci-Fi':
            paths = '<path d="M4.5 16.5c-1.5 1.25-2.5 3.5-2.5 3.5s2.25-1 3.5-2.5M14 2s2 2 2 4M20 8s2 2 2 4M12 12l-4 4M21 3s-7 1-10 4-4 7-4 7l4 4s4-1 7-4 4-10 4-10z"/>';
            break;
        case 'Mystery':
            paths = '<circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line>';
            break;
        case 'Romance':
            paths = '<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>';
            break;
        case 'Thriller':
            paths = '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>';
            break;
        case 'Drama':
            paths = '<circle cx="12" cy="12" r="10"></circle><path d="M8 14s1.5 2 4 2 4-2 4-2"></path><line x1="9" y1="9" x2="9.01" y2="9"></line><line x1="15" y1="9" x2="15.01" y2="9"></line>';
            break;
        case 'Horror':
            paths = '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10zM12 8v4M12 16h.01"/>';
            break;
        case 'Adventure':
            paths = '<circle cx="12" cy="12" r="10"></circle><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon>';
            break;
        case 'Historical':
            paths = '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2zM22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>';
            break;
        case 'Non-Fiction':
            paths = '<path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6.5 6.5 0 0 0 11.5 1.5c-3.5 0-6.5 3-6.5 6.5 0 1.3.5 2.6 1.5 3.5.8.8 1.3 1.5 1.5 2.5"></path><path d="M9 18h6M10 22h4"></path>';
            break;
        default:
            paths = '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>';
    }
    return svgHeader + paths + svgFooter;
}

function renderBookshelf() {
    bookGrid.innerHTML = '';
    
    state.books.forEach(book => {
        const bookCard = document.createElement('div');
        bookCard.className = 'book-card';
        bookCard.dataset.id = book.id;
        
        const coverWrapper = document.createElement('div');
        coverWrapper.className = 'book-cover-wrapper';
        
        const cover = document.createElement('div');
        cover.className = 'book-cover';
        
        if (book.coverType === 'url' || book.coverType === 'upload') {
            cover.style.backgroundImage = `url(${book.coverData})`;
            cover.classList.add('has-custom-cover');
        } else {
            cover.style.backgroundImage = '';
            cover.classList.remove('has-custom-cover');
        }
        
        const coverTitle = document.createElement('div');
        coverTitle.className = 'book-cover-title';
        coverTitle.textContent = book.title;

        const coverIconWrapper = document.createElement('div');
        coverIconWrapper.className = 'book-cover-icon-wrapper';
        coverIconWrapper.innerHTML = getGenreSvg(book.genre);
        
        const coverGenre = document.createElement('div');
        coverGenre.className = 'book-cover-genre';
        coverGenre.textContent = book.genre;
        
        cover.appendChild(coverTitle);
        cover.appendChild(coverIconWrapper);
        cover.appendChild(coverGenre);
        coverWrapper.appendChild(cover);
        
        const cardInfo = document.createElement('div');
        cardInfo.className = 'book-card-info';
        
        const cardDetails = document.createElement('div');
        cardDetails.className = 'book-card-details';
        
        const cardTitle = document.createElement('div');
        cardTitle.className = 'book-card-title';
        cardTitle.textContent = book.title;
        
        const cardChapters = document.createElement('div');
        cardChapters.className = 'book-card-chapters';
        cardChapters.textContent = `${book.chapters.length} chapter${book.chapters.length === 1 ? '' : 's'}`;
        
        cardDetails.appendChild(cardTitle);
        cardDetails.appendChild(cardChapters);
        
        const cardActions = document.createElement('div');
        cardActions.className = 'book-card-actions';

        const btnEditCover = document.createElement('button');
        btnEditCover.className = 'btn-edit-book';
        btnEditCover.title = 'Edit Cover';
        btnEditCover.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>`;
        btnEditCover.addEventListener('click', (e) => {
            e.stopPropagation();
            openEditCoverModal(book.id);
        });
        
        const btnDelete = document.createElement('button');
        btnDelete.className = 'btn-delete-book';
        btnDelete.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>`;
        
        btnDelete.addEventListener('click', (e) => {
            e.stopPropagation();
            openDeleteModal(book.id, book.title);
        });
        
        cardActions.appendChild(btnEditCover);
        cardActions.appendChild(btnDelete);
        
        cardInfo.appendChild(cardDetails);
        cardInfo.appendChild(cardActions);
        
        bookCard.appendChild(coverWrapper);
        bookCard.appendChild(cardInfo);
        
        bookCard.addEventListener('click', () => {
            openBook(book.id);
        });
        
        bookGrid.appendChild(bookCard);
    });
}

function openEditCoverModal(bookId) {
    bookIdToEditCover = bookId;
    const book = state.books.find(b => b.id === bookId);
    if (book) {
        const coverType = book.coverType || 'default';
        coverSourceSelect.value = coverType;
        
        const selectedOption = document.querySelector(`#cover-options .option[data-value="${coverType}"]`);
        if (selectedOption) {
            document.querySelectorAll('#cover-options .option').forEach(opt => opt.classList.remove('selected'));
            selectedOption.classList.add('selected');
            selectedCoverText.textContent = selectedOption.querySelector('span').textContent;
        }
        
        coverUrlInput.value = (book.coverType === 'url') ? book.coverData : '';
        coverFileInput.value = '';
        triggerCoverSourceChange();
        openModalWithHistory(editCoverModal);
    }
}

function closeEditCoverModal() {
    closeModalWithHistory();
}

function triggerCoverSourceChange() {
    const val = coverSourceSelect.value;
    if (val === 'url') {
        coverUrlGroup.style.display = 'block';
        coverFileGroup.style.display = 'none';
    } else if (val === 'upload') {
        coverUrlGroup.style.display = 'none';
        coverFileGroup.style.display = 'block';
    } else {
        coverUrlGroup.style.display = 'none';
        coverFileGroup.style.display = 'none';
    }
}

function openBook(bookId) {
    state.activeBookId = bookId;
    const book = state.books.find(b => b.id === bookId);
    
    if (book) {
        if (book.chapters.length > 0) {
            state.activeChapterId = book.activeChapterId || book.chapters[0].id;
        } else {
            const newChapterId = 'ch-' + Date.now();
            book.chapters.push({
                id: newChapterId,
                title: '',
                content: ''
            });
            state.activeChapterId = newChapterId;
            book.activeChapterId = newChapterId;
        }
        
        saveToLocalStorage();
        location.hash = `#/editor/${bookId}`;
    }
}

function loadBook(bookId) {
    const book = state.books.find(b => b.id === bookId);
    if (book) {
        sidebarNovelTitle.textContent = book.title;
        renderChapterList();
        loadActiveChapter();
    }
}

function renderChapterList() {
    chapterList.innerHTML = '';
    const book = state.books.find(b => b.id === state.activeBookId);
    
    if (book) {
        book.chapters.forEach(chapter => {
            const itemWrapper = document.createElement('div');
            itemWrapper.className = `chapter-item-wrapper ${chapter.id === state.activeChapterId ? 'active' : ''}`;
            itemWrapper.dataset.id = chapter.id;

            const li = document.createElement('li');
            li.className = 'chapter-item';
            li.textContent = chapter.title || 'Untitled Chapter';
            
            li.addEventListener('click', () => {
                switchChapter(chapter.id);
                closeSidebarOnMobile();
            });

            const btnDeleteChapter = document.createElement('button');
            btnDeleteChapter.className = 'btn-delete-chapter';
            btnDeleteChapter.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>`;
            
            btnDeleteChapter.addEventListener('click', (e) => {
                e.stopPropagation();
                openDeleteChapterModal(chapter.id, chapter.title);
            });

            itemWrapper.appendChild(li);
            itemWrapper.appendChild(btnDeleteChapter);
            chapterList.appendChild(itemWrapper);
        });
    }
}

function loadActiveChapter() {
    const book = state.books.find(b => b.id === state.activeBookId);
    if (book) {
        const chapter = book.chapters.find(ch => ch.id === state.activeChapterId);
        if (chapter) {
            editorTitle.value = chapter.title;
            editorContent.innerHTML = chapter.content;
            updateWordCount();
        } else {
            editorTitle.value = '';
            editorContent.innerHTML = '';
            wordCountSpan.textContent = '0 words';
        }
    }
}

function switchChapter(chapterId) {
    saveCurrentDraftImmediately();
    state.activeChapterId = chapterId;
    
    const book = state.books.find(b => b.id === state.activeBookId);
    if (book) {
        book.activeChapterId = chapterId;
    }
    
    saveToLocalStorage();
    renderChapterList();
    loadActiveChapter();
}

function triggerAutoSave() {
    statusDot.classList.add('saving');
    statusText.textContent = 'Saving...';
    
    clearTimeout(autoSaveTimeout);
    
    autoSaveTimeout = setTimeout(() => {
        saveCurrentDraftImmediately();
    }, 1200);
}

function saveCurrentDraftImmediately() {
    const book = state.books.find(b => b.id === state.activeBookId);
    if (book) {
        const chapter = book.chapters.find(ch => ch.id === state.activeChapterId);
        if (chapter) {
            chapter.title = editorTitle.value;
            chapter.content = editorContent.innerHTML;
            
            saveToLocalStorage();
            
            const activeItem = document.querySelector(`.chapter-item-wrapper[data-id="${state.activeChapterId}"] .chapter-item`);
            if (activeItem) {
                activeItem.textContent = editorTitle.value || 'Untitled Chapter';
            }
        }
    }
    
    statusDot.classList.remove('saving');
    statusText.textContent = 'Draft saved';
}

function saveToLocalStorage() {
    localStorage.setItem('novel_studio_library', JSON.stringify(state));
}

function updateWordCount() {
    const text = editorContent.innerText.trim();
    if (text === '') {
        wordCountSpan.textContent = '0 words';
        return;
    }
    const words = text.split(/\s+/);
    wordCountSpan.textContent = `${words.length} word${words.length === 1 ? '' : 's'}`;
}

function openModal() {
    openModalWithHistory(newBookModal);
    bookTitleInput.focus();
}

function closeModal() {
    closeModalWithHistory();
}

function openDeleteModal(bookId, bookTitle) {
    bookIdToDelete = bookId;
    deleteBookTitleSpan.textContent = bookTitle;
    openModalWithHistory(deleteConfirmModal);
}

function closeDeleteModal() {
    closeModalWithHistory();
}

function openDeleteChapterModal(chapterId, chapterTitle) {
    chapterIdToDelete = chapterId;
    deleteChapterTitleSpan.textContent = chapterTitle || 'Untitled Chapter';
    openModalWithHistory(deleteChapterModal);
}

function closeDeleteChapterModal() {
    closeModalWithHistory();
}

function toggleSidebar() {
    sidebar.classList.toggle('open');
    sidebarOverlay.classList.toggle('open');
}

function closeSidebarOnMobile() {
    sidebar.classList.remove('open');
    sidebarOverlay.classList.remove('open');
}

function setupEventListeners() {
    window.addEventListener('resize', handleScreenResize);
    window.addEventListener('hashchange', handleRouting);

    btnNewBook.addEventListener('click', openModal);
    btnCloseModal.addEventListener('click', closeModal);
    btnCancelModal.addEventListener('click', closeModal);
    
    selectTrigger.addEventListener('click', (e) => {
        e.stopPropagation();
        customSelect.classList.toggle('open');
    });

    document.querySelectorAll('#genre-options .option').forEach(option => {
        option.addEventListener('click', (e) => {
            const value = option.dataset.value;
            const svgHtml = option.querySelector('svg').outerHTML;
            const text = option.querySelector('span').textContent;
            
            document.getElementById('selected-genre-text').innerHTML = `${svgHtml} ${text}`;
            bookGenreInput.value = value;
            
            document.querySelectorAll('#genre-options .option').forEach(opt => opt.classList.remove('selected'));
            option.classList.add('selected');
            
            customSelect.classList.remove('open');
        });
    });

    coverSelectTrigger.addEventListener('click', (e) => {
        e.stopPropagation();
        customCoverSelect.classList.toggle('open');
    });

    document.querySelectorAll('#cover-options .option').forEach(option => {
        option.addEventListener('click', (e) => {
            const value = option.dataset.value;
            const text = option.querySelector('span').textContent;
            
            selectedCoverText.textContent = text;
            coverSourceSelect.value = value;
            
            document.querySelectorAll('#cover-options .option').forEach(opt => opt.classList.remove('selected'));
            option.classList.add('selected');
            
            customCoverSelect.classList.remove('open');
            triggerCoverSourceChange();
        });
    });

    document.addEventListener('click', () => {
        customSelect.classList.remove('open');
        customCoverSelect.classList.remove('open');
    });

    btnCloseCoverModal.addEventListener('click', closeEditCoverModal);
    btnCancelCoverModal.addEventListener('click', closeEditCoverModal);
    
    btnSaveCover.addEventListener('click', () => {
        const book = state.books.find(b => b.id === bookIdToEditCover);
        if (book) {
            const source = coverSourceSelect.value;
            if (source === 'default') {
                book.coverType = 'default';
                book.coverData = '';
                saveAndReloadBookshelf();
            } else if (source === 'url') {
                book.coverType = 'url';
                book.coverData = coverUrlInput.value.trim();
                saveAndReloadBookshelf();
            } else if (source === 'upload') {
                const file = coverFileInput.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = function(e) {
                        book.coverType = 'upload';
                        book.coverData = e.target.result;
                        saveAndReloadBookshelf();
                    };
                    reader.readAsDataURL(file);
                } else {
                    saveAndReloadBookshelf();
                }
            }
        }
    });

    function saveAndReloadBookshelf() {
        saveToLocalStorage();
        renderBookshelf();
        closeEditCoverModal();
    }

    btnSettings.addEventListener('click', () => {
        openModalWithHistory(settingsModal);
    });

    btnCloseSettings.addEventListener('click', () => {
        closeModalWithHistory();
    });

    btnExportJson.addEventListener('click', () => {
        const dataStr = JSON.stringify(state, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const exportFileDefaultName = 'novel_studio_backup.json';
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', url);
        linkElement.setAttribute('download', exportFileDefaultName);
        document.body.appendChild(linkElement);
        linkElement.click();
        document.body.removeChild(linkElement);
        URL.revokeObjectURL(url);
    });

    btnImportJson.addEventListener('click', () => {
        importFileInput.click();
    });

    importFileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function(event) {
            try {
                const importedState = JSON.parse(event.target.result);
                if (importedState && Array.isArray(importedState.books)) {
                    state = importedState;
                    saveToLocalStorage();
                    renderBookshelf();
                    closeModalWithHistory();
                    alert('Library successfully restored!');
                } else {
                    alert('Invalid backup file format.');
                }
            } catch (err) {
                alert('Error reading backup file.');
            }
        };
        reader.readAsText(file);
    });

    btnSubmitBook.addEventListener('click', () => {
        const title = bookTitleInput.value.trim();
        const genre = bookGenreInput.value;
        
        if (title) {
            const newBookId = 'bk-' + Date.now();
            const firstChapterId = 'ch-' + Date.now();
            
            const newBook = {
                id: newBookId,
                title: title,
                genre: genre,
                coverType: 'default',
                coverData: '',
                activeChapterId: firstChapterId,
                chapters: [{
                    id: firstChapterId,
                    title: '',
                    content: ''
                }]
            };
            
            state.books.push(newBook);
            saveToLocalStorage();
            closeModalWithHistory();
            renderBookshelf();
            openBook(newBookId);
        }
    });
    
    btnCloseDeleteModal.addEventListener('click', closeDeleteModal);
    btnCancelDelete.addEventListener('click', closeDeleteModal);
    btnConfirmDelete.addEventListener('click', () => {
        if (bookIdToDelete) {
            state.books = state.books.filter(b => b.id !== bookIdToDelete);
            if (state.activeBookId === bookIdToDelete) {
                state.activeBookId = null;
                state.activeChapterId = null;
            }
            saveToLocalStorage();
            closeDeleteModal();
            renderBookshelf();
        }
    });

    btnCloseChapterModal.addEventListener('click', closeDeleteChapterModal);
    btnCancelChapterDelete.addEventListener('click', closeDeleteChapterModal);
    btnConfirmChapterDelete.addEventListener('click', () => {
        if (chapterIdToDelete) {
            const book = state.books.find(b => b.id === state.activeBookId);
            if (book) {
                book.chapters = book.chapters.filter(ch => ch.id !== chapterIdToDelete);
                
                if (state.activeChapterId === chapterIdToDelete) {
                    if (book.chapters.length > 0) {
                        state.activeChapterId = book.chapters[0].id;
                        book.activeChapterId = book.chapters[0].id;
                    } else {
                        state.activeChapterId = null;
                        book.activeChapterId = null;
                    }
                }
                
                saveToLocalStorage();
                closeDeleteChapterModal();
                renderChapterList();
                loadActiveChapter();
            }
        }
    });
    
    btnBackToLibrary.addEventListener('click', () => {
        saveCurrentDraftImmediately();
        location.hash = '#/bookshelf';
    });
    
    btnAddChapter.addEventListener('click', () => {
        const book = state.books.find(b => b.id === state.activeBookId);
        if (book) {
            saveCurrentDraftImmediately();

            const newId = 'ch-' + Date.now();
            book.chapters.push({
                id: newId,
                title: '',
                content: ''
            });

            state.activeChapterId = newId;
            book.activeChapterId = newId;
            
            saveToLocalStorage();
            renderChapterList();
            loadActiveChapter();
            editorTitle.focus();
            closeSidebarOnMobile();
        }
    });
    
    btnToggleSidebar.addEventListener('click', toggleSidebar);
    sidebarOverlay.addEventListener('click', closeSidebarOnMobile);
    
    btnBold.addEventListener('click', () => {
        document.execCommand('bold', false, null);
        editorContent.focus();
    });

    btnItalic.addEventListener('click', () => {
        document.execCommand('italic', false, null);
        editorContent.focus();
    });

    editorTitle.addEventListener('input', triggerAutoSave);
    editorContent.addEventListener('input', () => {
        triggerAutoSave();
        updateWordCount();
    });

    editorContent.addEventListener('keydown', (e) => {
        if (e.ctrlKey || e.metaKey) {
            if (e.key === 'b' || e.key === 'B') {
                e.preventDefault();
                document.execCommand('bold', false, null);
            }
            if (e.key === 'i' || e.key === 'I') {
                e.preventDefault();
                document.execCommand('italic', false, null);
            }
        }
    });

    btnReadingMode.addEventListener('click', () => {
        const book = state.books.find(b => b.id === state.activeBookId);
        if (book) {
            const chapter = book.chapters.find(ch => ch.id === state.activeChapterId);
            if (chapter) {
                saveCurrentDraftImmediately();
                location.hash = `#/reading/${state.activeBookId}/${state.activeChapterId}`;
            }
        }
    });

    btnExitReading.addEventListener('click', () => {
        location.hash = `#/editor/${state.activeBookId}`;
    });

    btnToggleReadingTheme.addEventListener('click', () => {
        readingView.classList.toggle('dark-theme');
        const isDark = readingView.classList.contains('dark-theme');
        btnToggleReadingTheme.textContent = isDark ? 'Toggle Light Theme' : 'Toggle Dark Theme';
    });

    const brandLogo = document.querySelector('.brand h1');
    const brandSubtitle = document.querySelector('.brand .subtitle');
    if (brandLogo && brandSubtitle) {
        brandLogo.addEventListener('click', () => {
            logoClicks++;
            if (logoClicks === 7) {
                brandSubtitle.textContent = "I Miss Her... ";
                brandSubtitle.style.color = "#8c6239";
                setTimeout(() => {
                    brandSubtitle.textContent = "Your Personal Library";
                    brandSubtitle.style.color = "";
                    logoClicks = 0;
                }, 5000);
            }
        });
    }
}

window.onload = init;