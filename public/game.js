const socket = io();

// DOM Elements
const screens = {
    menu: document.getElementById('menu'),
    waiting: document.getElementById('waiting'),
    game: document.getElementById('game')
};

const elements = {
    // Menu - Create Section
    playerNameInput: document.getElementById('playerNameInput'),
    nameError: document.getElementById('nameError'),
    createRoomBtn: document.getElementById('createRoomBtn'),
    
    // Menu - Join Section
    joinNameInput: document.getElementById('joinNameInput'),
    joinNameError: document.getElementById('joinNameError'),
    roomCodeInput: document.getElementById('roomCodeInput'),
    codeError: document.getElementById('codeError'),
    joinRoomBtn: document.getElementById('joinRoomBtn'),
    
    // Dropdown
    gameModeSelect: document.getElementById('gameModeSelect'),
    createSection: document.getElementById('createSection'),
    joinSection: document.getElementById('joinSection'),
    
    // How to Play
    howToPlayBtn: document.getElementById('howToPlayBtn'),
    howToPlayModal: document.getElementById('howToPlayModal'),
    closeHowToBtn: document.getElementById('closeHowToBtn'),
    closeHowToTopBtn: document.getElementById('closeHowToTopBtn'),
    
    // Waiting
    roomCodeDisplay: document.getElementById('roomCodeDisplay'),
    copyCodeBtn: document.getElementById('copyCodeBtn'),
    cancelWaitBtn: document.getElementById('cancelWaitBtn'),
    
    // Game
    board: document.getElementById('board'),
    playerName: document.getElementById('playerName'),
    opponentName: document.getElementById('opponentName'),
    playerScore: document.getElementById('playerScore'),
    opponentScore: document.getElementById('opponentScore'),
    playerAvatarLetter: document.getElementById('playerAvatarLetter'),
    opponentAvatarLetter: document.getElementById('opponentAvatarLetter'),
    playerProfile: document.getElementById('playerProfile'),
    opponentProfile: document.getElementById('opponentProfile'),
    turnIndicator: document.getElementById('turnIndicator'),
    turnDot: document.getElementById('turnDot'),
    turnText: document.getElementById('turnText'),
    moveCount: document.getElementById('moveCount'),
    lastMove: document.getElementById('lastMove'),
    restartBtn: document.getElementById('restartBtn'),
    leaveBtn: document.getElementById('leaveBtn'),
    
    // Game Over
    gameOverModal: document.getElementById('gameOverModal'),
    gameOverEmoji: document.getElementById('gameOverEmoji'),
    gameOverTitle: document.getElementById('gameOverTitle'),
    winnerName: document.getElementById('winnerName'),
    winnerAvatar: document.getElementById('winnerAvatar'),
    winnerAvatarLetter: document.getElementById('winnerAvatarLetter'),
    gameOverMessage: document.getElementById('gameOverMessage'),
    playAgainBtn: document.getElementById('playAgainBtn'),
    backToMenuBtn: document.getElementById('backToMenuBtn'),
    confettiContainer: document.getElementById('confettiContainer'),
    
    // Toast & Status
    toast: document.getElementById('toast'),
    connectionStatus: document.getElementById('connectionStatus'),
    
    // Chat
    chatBody: document.getElementById('chatBody'),
    chatMessages: document.getElementById('chatMessages'),
    chatInput: document.getElementById('chatInput'),
    sendMessageBtn: document.getElementById('sendMessageBtn'),
    toggleChatBtn: document.getElementById('toggleChatBtn'),
    
    // Timer
    timerDisplay: document.getElementById('timerDisplay'),
    timerBar: document.getElementById('timerBar')
};

// Game State
let currentLanguage = 'en';
let currentRoom = null;
let myColor = null;
let myName = '';
let opponentNameStr = '';
let moveCount = 0;
let timerInterval = null;
let timeRemaining = 10;

let gameState = {
    board: Array(6).fill(null).map(() => Array(7).fill(null)),
    currentPlayer: 'red',
    gameActive: false,
    winner: null,
    winningCells: []
};

// Translations
const translations = {
    en: {
        yourTurn: 'YOUR TURN',
        opponentTurn: "'s turn...",
        gameOver: 'Game Over',
        notYourTurn: "Not your turn!",
        columnFull: 'Column full!',
        gameNotActive: 'Game not active',
        enterValidCode: '❌ Enter valid 6-character code!',
        nameRequired: '❌ Name is required!',
        nameTooShort: '❌ Min 2 characters!',
        enterName: '⚠️ Enter your name!',
        selectOption: '⚠️ Select game mode first!',
        gameStarted: 'Game started!',
        youWin: 'You won!',
        youLose: 'wins!',
        draw: 'Draw!',
        opponentLeft: 'Opponent left!',
        gameRestarted: 'Game restarted!',
        codeCopied: 'Code copied!',
        connected: 'Connected',
        disconnected: 'Disconnected',
        moves: 'Moves:',
        last: 'Last:',
        column: 'Col',
        leave: 'Leave',
        winner: 'Winner!',
        autoPlaced: 'Auto-placed!'
    },
    am: {
        yourTurn: 'የእርስዎ ተራ',
        opponentTurn: ' ተራ...',
        gameOver: 'ጨዋታ አብቅቷል',
        notYourTurn: 'የእርስዎ ተራ አይደለም!',
        columnFull: 'አምዱ ሞልቷል!',
        gameNotActive: 'ጨዋታ ንቁ አይደለም',
        enterValidCode: '❌ ትክክለኛ ባለ 6-ቁምፊ ኮድ ያስገቡ!',
        nameRequired: '❌ ስም ያስፈልጋል!',
        nameTooShort: '❌ ቢያንስ 2 ቁምፊዎች!',
        enterName: '⚠️ ስምዎን ያስገቡ!',
        selectOption: '⚠️ መጀመሪያ የጨዋታ ሁነታ ይምረጡ!',
        gameStarted: 'ጨዋታ ተጀምሯል!',
        youWin: 'አሸንፈዋል!',
        youLose: 'አሸንፏል!',
        draw: 'አቻ!',
        opponentLeft: 'ተቃዋሚ ወጥቷል!',
        gameRestarted: 'እንደገና ተጀምሯል!',
        codeCopied: 'ኮድ ተቀድቷል!',
        connected: 'ተገናኝቷል',
        disconnected: 'ተቋርጧል',
        moves: 'እንቅስቃሴ:',
        last: 'የመጨረሻ:',
        column: 'አምድ',
        leave: 'ይውጡ',
        winner: 'አሸናፊ!',
        autoPlaced: 'በራስ-ሰር ተቀምጧል!'
    }
};

// Language
window.setLanguage = function(lang) {
    currentLanguage = lang;
    const langEn = document.getElementById('langEn');
    const langAm = document.getElementById('langAm');
    if (langEn && langAm) {
        langEn.classList.toggle('active', lang === 'en');
        langAm.classList.toggle('active', lang === 'am');
    }
    document.querySelectorAll('[data-en][data-am]').forEach(el => {
        el.textContent = el.getAttribute(`data-${lang}`);
    });
    
    // Update placeholders
    const createNameInput = document.getElementById('playerNameInput');
    const joinNameInput = document.getElementById('joinNameInput');
    if (createNameInput) {
        createNameInput.placeholder = createNameInput.getAttribute(`data-${lang}-placeholder`) || '';
    }
    if (joinNameInput) {
        joinNameInput.placeholder = joinNameInput.getAttribute(`data-${lang}-placeholder`) || '';
    }
    
    updateTurnIndicator();
    localStorage.setItem('connectFourLanguage', lang);
};

function loadLanguage() {
    const saved = localStorage.getItem('connectFourLanguage');
    if (saved) setLanguage(saved);
}

// Audio
let audioContext;
function playSound(freq, duration, type = 'sine') {
    try {
        if (!audioContext) audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        osc.connect(gain);
        gain.connect(audioContext.destination);
        osc.frequency.value = freq;
        osc.type = type;
        gain.gain.setValueAtTime(0.2, audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
        osc.start();
        osc.stop(audioContext.currentTime + duration);
    } catch(e) {}
}

function playDropSound() { playSound(300, 0.1); }
function playClickSound() { playSound(800, 0.05); }
function playErrorSound() { playSound(150, 0.3, 'square'); }
function playWinSound() {
    [523, 659, 784, 1047].forEach((freq, i) => {
        setTimeout(() => playSound(freq, 0.3), i * 150);
    });
}

// Timer
function startTimer(duration) {
    clearTimer();
    timeRemaining = duration / 1000;
    updateTimerDisplay();
    timerInterval = setInterval(() => {
        timeRemaining -= 0.1;
        updateTimerDisplay();
        if (timeRemaining <= 0) clearTimer();
    }, 100);
}

function clearTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}

function updateTimerDisplay() {
    const seconds = Math.ceil(timeRemaining);
    if (elements.timerDisplay) {
        elements.timerDisplay.textContent = seconds;
        elements.timerDisplay.className = 'timer-seconds';
        if (timeRemaining > 5) elements.timerDisplay.classList.add('timer-green');
        else if (timeRemaining > 2) elements.timerDisplay.classList.add('timer-orange');
        else elements.timerDisplay.classList.add('timer-red');
    }
    if (elements.timerBar) {
        const percentage = (timeRemaining / 10) * 100;
        elements.timerBar.style.width = percentage + '%';
        if (timeRemaining > 5) elements.timerBar.style.background = '#4CAF50';
        else if (timeRemaining > 2) elements.timerBar.style.background = '#FFA726';
        else elements.timerBar.style.background = '#FF4757';
    }
}

// Board
function createBoard() {
    elements.board.innerHTML = '';
    for (let row = 0; row < 6; row++) {
        for (let col = 0; col < 7; col++) {
            const cell = document.createElement('div');
            cell.className = 'cell empty';
            cell.dataset.row = row;
            cell.dataset.col = col;
            cell.addEventListener('click', () => handleCellClick(col));
            elements.board.appendChild(cell);
        }
    }
}

function handleCellClick(col) {
    playClickSound();
    const t = translations[currentLanguage];
    if (!gameState.gameActive || gameState.winner) {
        playErrorSound();
        showToast(t.gameNotActive, 'error');
        return;
    }
    if (gameState.currentPlayer !== myColor) {
        playErrorSound();
        showToast(t.notYourTurn, 'error');
        return;
    }
    if (gameState.board[0][col] !== null) {
        playErrorSound();
        showToast(t.columnFull, 'error');
        return;
    }
    socket.emit('dropPiece', { roomCode: currentRoom, column: col });
}

function updateBoard() {
    const cells = elements.board.querySelectorAll('.cell');
    cells.forEach(cell => {
        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);
        const value = gameState.board[row][col];
        cell.className = 'cell';
        if (value === null) cell.classList.add('empty');
        else cell.classList.add(value);
        if (gameState.winningCells.some(([r, c]) => r === row && c === col)) {
            cell.classList.add('winner');
        }
    });
}

function updateTurnIndicator() {
    const t = translations[currentLanguage];
    elements.turnIndicator.className = 'turn-indicator';
    elements.playerProfile.classList.remove('active-turn');
    elements.opponentProfile.classList.remove('active-turn');
    
    if (!gameState.gameActive || gameState.winner) {
        elements.turnText.textContent = t.gameOver;
        elements.turnDot.className = 'turn-dot';
        clearTimer();
        return;
    }
    
    if (gameState.currentPlayer === myColor) {
        elements.turnIndicator.classList.add('your-turn-blink');
        elements.turnText.textContent = t.yourTurn;
        elements.turnDot.className = 'turn-dot green-dot';
        elements.playerProfile.classList.add('active-turn');
    } else {
        elements.turnIndicator.classList.add('opponent-turn-blink');
        elements.turnText.textContent = opponentNameStr + t.opponentTurn;
        elements.turnDot.className = 'turn-dot red-dot';
        elements.opponentProfile.classList.add('active-turn');
    }
}

// Chat
function sendChatMessage() {
    const message = elements.chatInput.value.trim();
    if (!message || !currentRoom) return;
    socket.emit('sendMessage', { roomCode: currentRoom, message: message, senderName: myName });
    elements.chatInput.value = '';
}

function addChatMessage(data) {
    const isSent = data.sender === myName;
    const isSystem = data.senderColor === 'system';
    const msgDiv = document.createElement('div');
    msgDiv.className = 'chat-message ' + (isSystem ? 'received' : (isSent ? 'sent' : 'received'));
    
    if (!isSystem) {
        const senderSpan = document.createElement('span');
        senderSpan.className = 'message-sender';
        senderSpan.textContent = isSent ? 'You' : data.sender;
        msgDiv.appendChild(senderSpan);
    }
    
    const bubble = document.createElement('div');
    bubble.className = 'message-bubble' + (isSystem ? ' system-message' : '');
    bubble.textContent = data.message;
    msgDiv.appendChild(bubble);
    
    elements.chatMessages.appendChild(msgDiv);
    elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
}

function clearChat() {
    elements.chatMessages.innerHTML = '';
}

function showToast(message, type = 'error') {
    elements.toast.textContent = message;
    elements.toast.className = 'toast';
    if (type) elements.toast.classList.add(type);
    void elements.toast.offsetWidth;
    elements.toast.classList.add('show');
    clearTimeout(elements.toast.timeout);
    elements.toast.timeout = setTimeout(() => elements.toast.classList.remove('show'), 3000);
}

function showScreen(name) {
    Object.keys(screens).forEach(k => screens[k].classList.remove('active'));
    screens[name].classList.add('active');
}

function createConfetti() {
    elements.confettiContainer.innerHTML = '';
    const colors = ['#FF4757', '#FFA502', '#4CAF50', '#6C63FF'];
    for (let i = 0; i < 40; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.left = Math.random() * 100 + '%';
        confetti.style.background = colors[i % 4];
        confetti.style.animationDelay = Math.random() + 's';
        elements.confettiContainer.appendChild(confetti);
    }
}

// ============ DROPDOWN HANDLER ============
elements.gameModeSelect.addEventListener('change', () => {
    const selectedMode = elements.gameModeSelect.value;
    
    // Hide both sections
    elements.createSection.classList.add('hidden');
    elements.joinSection.classList.add('hidden');
    
    // Clear previous errors
    if (elements.nameError) elements.nameError.textContent = '';
    if (elements.joinNameError) elements.joinNameError.textContent = '';
    if (elements.codeError) elements.codeError.textContent = '';
    
    // Show selected section
    if (selectedMode === 'create') {
        elements.createSection.classList.remove('hidden');
        setTimeout(() => elements.playerNameInput.focus(), 100);
    } else if (selectedMode === 'join') {
        elements.joinSection.classList.remove('hidden');
        setTimeout(() => elements.joinNameInput.focus(), 100);
    }
});

// ============ HOW TO PLAY ============
elements.howToPlayBtn.addEventListener('click', () => {
    playClickSound();
    elements.howToPlayModal.classList.add('active');
});

elements.closeHowToBtn.addEventListener('click', () => {
    elements.howToPlayModal.classList.remove('active');
});

if (elements.closeHowToTopBtn) {
    elements.closeHowToTopBtn.addEventListener('click', () => {
        elements.howToPlayModal.classList.remove('active');
    });
}

elements.howToPlayModal.addEventListener('click', (e) => {
    if (e.target === elements.howToPlayModal) {
        elements.howToPlayModal.classList.remove('active');
    }
});

// ============ CREATE GAME ============
elements.createRoomBtn.addEventListener('click', () => {
    playClickSound();
    
    // Check if dropdown is selected
    if (elements.gameModeSelect.value !== 'create') {
        showToast(translations[currentLanguage].selectOption, 'error');
        return;
    }
    
    const name = elements.playerNameInput.value.trim();
    
    // Validate name
    if (!name) {
        elements.nameError.textContent = translations[currentLanguage].nameRequired;
        elements.nameError.style.color = '#ff4757';
        elements.playerNameInput.focus();
        showToast(translations[currentLanguage].enterName, 'error');
        playErrorSound();
        return;
    }
    
    if (name.length < 2) {
        elements.nameError.textContent = translations[currentLanguage].nameTooShort;
        elements.nameError.style.color = '#ff4757';
        elements.playerNameInput.focus();
        playErrorSound();
        return;
    }
    
    elements.nameError.textContent = '✅';
    elements.nameError.style.color = '#4CAF50';
    
    myName = name;
    socket.emit('createRoom', { playerName: myName });
});

// ============ JOIN GAME ============
elements.joinRoomBtn.addEventListener('click', () => {
    playClickSound();
    
    // Check if dropdown is selected
    if (elements.gameModeSelect.value !== 'join') {
        showToast(translations[currentLanguage].selectOption, 'error');
        return;
    }
    
    const name = elements.joinNameInput.value.trim();
    const code = elements.roomCodeInput.value.trim().toUpperCase();
    
    // Validate name
    if (!name) {
        elements.joinNameError.textContent = translations[currentLanguage].nameRequired;
        elements.joinNameError.style.color = '#ff4757';
        elements.joinNameInput.focus();
        showToast(translations[currentLanguage].enterName, 'error');
        playErrorSound();
        return;
    }
    
    if (name.length < 2) {
        elements.joinNameError.textContent = translations[currentLanguage].nameTooShort;
        elements.joinNameError.style.color = '#ff4757';
        elements.joinNameInput.focus();
        playErrorSound();
        return;
    }
    
    elements.joinNameError.textContent = '✅';
    elements.joinNameError.style.color = '#4CAF50';
    
    // Validate code
    if (!code) {
        elements.codeError.textContent = '❌ Code is required!';
        elements.codeError.style.color = '#ff4757';
        elements.roomCodeInput.focus();
        playErrorSound();
        return;
    }
    
    if (code.length !== 6) {
        elements.codeError.textContent = translations[currentLanguage].enterValidCode;
        elements.codeError.style.color = '#ff4757';
        elements.roomCodeInput.focus();
        playErrorSound();
        return;
    }
    
    elements.codeError.textContent = '✅';
    elements.codeError.style.color = '#4CAF50';
    
    myName = name;
    socket.emit('joinRoom', { roomCode: code, playerName: myName });
});

// ============ INPUT LISTENERS ============
// Create name input
elements.playerNameInput.addEventListener('input', () => {
    if (elements.playerNameInput.value.trim().length > 0) {
        elements.nameError.textContent = '';
        elements.playerNameInput.style.borderColor = '';
    }
});

// Join name input
elements.joinNameInput.addEventListener('input', () => {
    if (elements.joinNameInput.value.trim().length > 0) {
        elements.joinNameError.textContent = '';
        elements.joinNameInput.style.borderColor = '';
    }
});

// Room code input
elements.roomCodeInput.addEventListener('input', (e) => {
    e.target.value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (e.target.value.length > 0) {
        elements.codeError.textContent = '';
        elements.roomCodeInput.style.borderColor = '';
    }
});

// Enter key handlers
elements.playerNameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') elements.createRoomBtn.click();
});

elements.joinNameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') elements.roomCodeInput.focus();
});

elements.roomCodeInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') elements.joinRoomBtn.click();
});

// ============ CHAT EVENTS ============
elements.sendMessageBtn.addEventListener('click', sendChatMessage);
elements.chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendChatMessage();
});
elements.toggleChatBtn.addEventListener('click', () => {
    elements.chatBody.classList.toggle('collapsed');
});

// ============ OTHER EVENTS ============
elements.copyCodeBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(elements.roomCodeDisplay.textContent);
    showToast(translations[currentLanguage].codeCopied, 'success');
});

elements.cancelWaitBtn.addEventListener('click', () => {
    socket.emit('leaveRoom', currentRoom);
    showScreen('menu');
});

elements.restartBtn.addEventListener('click', () => {
    socket.emit('restartGame', currentRoom);
    elements.restartBtn.disabled = true;
});

elements.leaveBtn.addEventListener('click', () => {
    if (confirm(translations[currentLanguage].leave + '?')) {
        socket.emit('leaveRoom', currentRoom);
        showScreen('menu');
    }
});

elements.playAgainBtn.addEventListener('click', () => {
    elements.gameOverModal.classList.remove('active');
    socket.emit('restartGame', currentRoom);
});

elements.backToMenuBtn.addEventListener('click', () => {
    elements.gameOverModal.classList.remove('active');
    socket.emit('leaveRoom', currentRoom);
    showScreen('menu');
});

// ============ SOCKET EVENTS ============
socket.on('connect', () => {
    elements.connectionStatus.textContent = translations[currentLanguage].connected;
    elements.connectionStatus.className = 'connection-status connected';
    setTimeout(() => elements.connectionStatus.style.display = 'none', 3000);
});

socket.on('disconnect', () => {
    elements.connectionStatus.textContent = translations[currentLanguage].disconnected;
    elements.connectionStatus.className = 'connection-status disconnected';
    elements.connectionStatus.style.display = 'block';
});

socket.on('roomCreated', (data) => {
    currentRoom = data.roomCode;
    myColor = data.color;
    elements.roomCodeDisplay.textContent = data.roomCode;
    showScreen('waiting');
});

socket.on('roomJoined', (data) => {
    currentRoom = data.roomCode;
    myColor = data.color;
    showScreen('game');
});

socket.on('gameStart', (data) => {
    gameState.board = data.board;
    gameState.currentPlayer = data.currentPlayer;
    gameState.gameActive = true;
    gameState.winner = null;
    gameState.winningCells = [];
    moveCount = 0;
    opponentNameStr = data.playerNames[myColor === 'red' ? 'yellow' : 'red'];
    elements.playerName.textContent = myName;
    elements.opponentName.textContent = opponentNameStr;
    elements.playerScore.textContent = data.yourScore !== undefined ? data.yourScore : 0;
    elements.opponentScore.textContent = data.opponentScore !== undefined ? data.opponentScore : 0;
    elements.playerAvatarLetter.textContent = myName.charAt(0).toUpperCase();
    elements.opponentAvatarLetter.textContent = opponentNameStr.charAt(0).toUpperCase();
    clearChat();
    updateBoard();
    updateTurnIndicator();
    showScreen('game');
});

socket.on('timerStart', (data) => startTimer(data.duration));

socket.on('pieceDropped', (data) => {
    playDropSound();
    gameState.board = data.board;
    gameState.currentPlayer = data.currentPlayer;
    moveCount++;
    updateBoard();
    updateTurnIndicator();
    elements.moveCount.textContent = translations[currentLanguage].moves + ' ' + moveCount;
    elements.lastMove.textContent = translations[currentLanguage].last + ' ' + translations[currentLanguage].column + ' ' + (data.column + 1);
    if (data.autoPlaced) showToast(translations[currentLanguage].autoPlaced, 'error');
});

socket.on('gameOver', (data) => {
    gameState.board = data.board;
    gameState.winner = data.winner;
    gameState.gameActive = false;
    gameState.winningCells = data.winningCells;
    updateBoard();
    updateTurnIndicator();
    elements.restartBtn.disabled = false;
    elements.playerScore.textContent = data.yourScore !== undefined ? data.yourScore : 0;
    elements.opponentScore.textContent = data.opponentScore !== undefined ? data.opponentScore : 0;
    
    if (data.winner === 'draw') {
        elements.gameOverEmoji.textContent = '🤝';
        elements.gameOverTitle.textContent = translations[currentLanguage].draw;
        elements.winnerName.textContent = '';
        elements.winnerAvatar.className = 'winner-avatar draw';
        elements.winnerAvatarLetter.textContent = '🤝';
    } else {
        const winnerNameStr = data.isWinner ? myName : data.winnerName;
        elements.winnerAvatar.className = 'winner-avatar ' + data.winner;
        elements.winnerAvatarLetter.textContent = winnerNameStr.charAt(0).toUpperCase();
        
        if (data.isWinner) {
            playWinSound();
            elements.gameOverEmoji.textContent = '🏆';
            elements.gameOverTitle.textContent = '🏆 ' + translations[currentLanguage].winner + ' 🏆';
            elements.winnerName.textContent = myName;
            elements.gameOverMessage.textContent = translations[currentLanguage].youWin + ' 🎉';
            createConfetti();
        } else {
            elements.gameOverEmoji.textContent = '😔';
            elements.gameOverTitle.textContent = data.winnerName + ' ' + translations[currentLanguage].youLose;
            elements.winnerName.textContent = data.winnerName;
        }
    }
    setTimeout(() => elements.gameOverModal.classList.add('active'), 1000);
});

socket.on('gameRestarted', (data) => {
    gameState.board = data.board;
    gameState.currentPlayer = data.currentPlayer;
    gameState.gameActive = true;
    gameState.winner = null;
    gameState.winningCells = [];
    moveCount = 0;
    if (data.scores) {
        elements.playerScore.textContent = myColor === 'red' ? data.scores.red : data.scores.yellow;
        elements.opponentScore.textContent = myColor === 'red' ? data.scores.yellow : data.scores.red;
    }
    updateBoard();
    updateTurnIndicator();
    elements.restartBtn.disabled = true;
    elements.gameOverModal.classList.remove('active');
});

socket.on('opponentLeft', () => {
    gameState.gameActive = false;
    updateTurnIndicator();
});

socket.on('chatMessage', (data) => addChatMessage(data));
socket.on('error', (message) => showToast(message, 'error'));

// ============ INITIALIZE ============
createBoard();
showScreen('menu');
loadLanguage();
console.log('Connect Four initialized with dropdown selection');
