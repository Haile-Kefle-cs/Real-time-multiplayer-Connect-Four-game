const socket = io();

// DOM Elements
const screens = {
    menu: document.getElementById('menu'),
    waiting: document.getElementById('waiting'),
    game: document.getElementById('game')
};

const elements = {
    playerNameInput: document.getElementById('playerNameInput'),
    nameError: document.getElementById('nameError'),
    createRoomBtn: document.getElementById('createRoomBtn'),
    joinRoomBtn: document.getElementById('joinRoomBtn'),
    roomCodeInput: document.getElementById('roomCodeInput'),
    roomCodeDisplay: document.getElementById('roomCodeDisplay'),
    copyCodeBtn: document.getElementById('copyCodeBtn'),
    cancelWaitBtn: document.getElementById('cancelWaitBtn'),
    howToPlayBtn: document.getElementById('howToPlayBtn'),
    howToPlayModal: document.getElementById('howToPlayModal'),
    closeHowToBtn: document.getElementById('closeHowToBtn'),
    closeHowToTopBtn: document.getElementById('closeHowToTopBtn'),
    board: document.getElementById('board'),
    columnIndicators: document.getElementById('columnIndicators'),
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
    gameMessage: document.getElementById('gameMessage'),
    restartBtn: document.getElementById('restartBtn'),
    leaveBtn: document.getElementById('leaveBtn'),
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
    toast: document.getElementById('toast'),
    connectionStatus: document.getElementById('connectionStatus')
};

// Language Management
let currentLanguage = 'en';

const translations = {
    en: {
        yourTurn: 'Your turn',
        opponentTurn: "'s turn",
        gameOver: 'Game Over',
        notYourTurn: "It's not your turn!",
        columnFull: 'Column is full!',
        gameNotActive: 'Game is not active',
        enterValidCode: 'Enter valid 6-character code',
        nameRequired: 'Name is required!',
        nameTooShort: 'Name must be at least 2 characters!',
        roomNotFound: 'Room not found',
        roomFull: 'Room is full',
        gameStarted: 'Game started!',
        pieceDropped: 'Piece dropped!',
        opponentDropped: 'dropped a piece!',
        youWin: 'Congratulations! You won!',
        youLose: 'wins! Better luck next time!',
        draw: "It's a Draw!",
        boardFull: 'Board is full!',
        opponentLeft: 'Opponent left!',
        gameRestarted: 'Game restarted!',
        codeCopied: 'Code copied!',
        connected: 'Connected',
        disconnected: 'Disconnected',
        moves: 'Moves:',
        last: 'Last:',
        column: 'Column',
        playAgain: 'Play Again',
        menu: 'Menu',
        leave: 'Leave',
        cancel: 'Cancel',
        copy: 'Copy',
        createGame: 'Create Game',
        joinGame: 'Join',
        howToPlay: 'How to Play',
        startPlaying: 'Start Playing',
        yourName: 'Your Name:',
        enterName: 'Enter your name',
        shareCode: 'Share this code:',
        waitingForOpponent: 'Waiting for Opponent',
        waitingForPlayer2: 'Waiting for player 2...',
        gotIt: "Got it! Let's Play!",
        winner: 'Winner!',
        you: 'You',
        opponent: 'Opponent'
    },
    am: {
        yourTurn: 'የእርስዎ ተራ',
        opponentTurn: ' ተራ',
        gameOver: 'ጨዋታ አብቅቷል',
        notYourTurn: 'የእርስዎ ተራ አይደለም!',
        columnFull: 'አምዱ ሞልቷል!',
        gameNotActive: 'ጨዋታው ንቁ አይደለም',
        enterValidCode: 'ትክክለኛ ባለ 6-ቁምፊ ኮድ ያስገቡ',
        nameRequired: 'ስም ያስፈልጋል!',
        nameTooShort: 'ስም ቢያንስ 2 ቁምፊዎች መሆን አለበት!',
        roomNotFound: 'ክፍሉ አልተገኘም',
        roomFull: 'ክፍሉ ሞልቷል',
        gameStarted: 'ጨዋታ ተጀምሯል!',
        pieceDropped: 'ዲስክ ተጥሏል!',
        opponentDropped: 'ዲስክ ጥሏል!',
        youWin: 'እንኳን ደስ አለዎት! አሸንፈዋል!',
        youLose: 'አሸንፏል! በሚቀጥለው ጊዜ መልካም ዕድል!',
        draw: 'አቻ ነው!',
        boardFull: 'ሰሌዳው ሞልቷል!',
        opponentLeft: 'ተቃዋሚዎ ወጥቷል!',
        gameRestarted: 'ጨዋታ እንደገና ተጀምሯል!',
        codeCopied: 'ኮድ ተቀድቷል!',
        connected: 'ተገናኝቷል',
        disconnected: 'ተቋርጧል',
        moves: 'እንቅስቃሴዎች:',
        last: 'የመጨረሻ:',
        column: 'አምድ',
        playAgain: 'እንደገና ይጫወቱ',
        menu: 'ምናሌ',
        leave: 'ይውጡ',
        cancel: 'ይቅር',
        copy: 'ቅዳ',
        createGame: 'ጨዋታ ይፍጠሩ',
        joinGame: 'ይቀላቀሉ',
        howToPlay: 'እንዴት መጫወት እንደሚቻል',
        startPlaying: 'መጫወት ይጀምሩ',
        yourName: 'ስምዎ:',
        enterName: 'ስምዎን ያስገቡ',
        shareCode: 'ይህን ኮድ ያጋሩ:',
        waitingForOpponent: 'ተቃዋሚን በመጠበቅ ላይ',
        waitingForPlayer2: 'ተጫዋች 2ን በመጠበቅ ላይ...',
        gotIt: 'ገባኝ! እንጫወት!',
        winner: 'አሸናፊ!',
        you: 'እርስዎ',
        opponent: 'ተቃዋሚ'
    }
};

function setLanguage(lang) {
    currentLanguage = lang;
    
    const langEn = document.getElementById('langEn');
    const langAm = document.getElementById('langAm');
    if (langEn && langAm) {
        langEn.classList.toggle('active', lang === 'en');
        langAm.classList.toggle('active', lang === 'am');
    }
    
    document.querySelectorAll('[data-en][data-am]').forEach(element => {
        element.textContent = element.getAttribute(`data-${lang}`);
    });
    
    const nameInput = document.getElementById('playerNameInput');
    if (nameInput) {
        nameInput.placeholder = nameInput.getAttribute(`data-${lang}-placeholder`) || '';
    }
    
    updateDynamicText();
    localStorage.setItem('connectFourLanguage', lang);
}

window.setLanguage = setLanguage;

function loadLanguage() {
    const saved = localStorage.getItem('connectFourLanguage');
    if (saved) setLanguage(saved);
}

function updateDynamicText() {
    const t = translations[currentLanguage];
    if (elements.turnText && gameState.gameActive && !gameState.winner) {
        if (gameState.currentPlayer === myColor) {
            elements.turnText.textContent = t.yourTurn;
        } else {
            elements.turnText.textContent = opponentNameStr + t.opponentTurn;
        }
    }
    if (elements.moveCount) {
        elements.moveCount.textContent = t.moves + ' ' + moveCount;
    }
}

// Audio Functions
let audioContext = null;
function initAudio() {
    if (!audioContext) audioContext = new (window.AudioContext || window.webkitAudioContext)();
}

function playDropSound() {
    try {
        initAudio();
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        osc.connect(gain); gain.connect(audioContext.destination);
        osc.frequency.setValueAtTime(400, audioContext.currentTime);
        osc.frequency.exponentialRampToValueAtTime(200, audioContext.currentTime + 0.1);
        gain.gain.setValueAtTime(0.3, audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
        osc.start(); osc.stop(audioContext.currentTime + 0.1);
    } catch(e) {}
}

function playWinSound() {
    try {
        initAudio();
        [523, 659, 784, 1047].forEach((freq, i) => {
            const osc = audioContext.createOscillator();
            const gain = audioContext.createGain();
            osc.connect(gain); gain.connect(audioContext.destination);
            osc.frequency.setValueAtTime(freq, audioContext.currentTime + i * 0.15);
            osc.type = 'sine';
            gain.gain.setValueAtTime(0.3, audioContext.currentTime + i * 0.15);
            gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + i * 0.15 + 0.3);
            osc.start(audioContext.currentTime + i * 0.15);
            osc.stop(audioContext.currentTime + i * 0.15 + 0.3);
        });
    } catch(e) {}
}

function playLoseSound() {
    try {
        initAudio();
        [400, 350, 300, 250].forEach((freq, i) => {
            const osc = audioContext.createOscillator();
            const gain = audioContext.createGain();
            osc.connect(gain); gain.connect(audioContext.destination);
            osc.frequency.setValueAtTime(freq, audioContext.currentTime + i * 0.15);
            osc.type = 'sawtooth';
            gain.gain.setValueAtTime(0.2, audioContext.currentTime + i * 0.15);
            gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + i * 0.15 + 0.2);
            osc.start(audioContext.currentTime + i * 0.15);
            osc.stop(audioContext.currentTime + i * 0.15 + 0.2);
        });
    } catch(e) {}
}

function playErrorSound() {
    try {
        initAudio();
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        osc.connect(gain); gain.connect(audioContext.destination);
        osc.frequency.setValueAtTime(100, audioContext.currentTime);
        osc.type = 'square';
        gain.gain.setValueAtTime(0.2, audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
        osc.start(); osc.stop(audioContext.currentTime + 0.2);
    } catch(e) {}
}

function playClickSound() {
    try {
        initAudio();
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        osc.connect(gain); gain.connect(audioContext.destination);
        osc.frequency.setValueAtTime(800, audioContext.currentTime);
        gain.gain.setValueAtTime(0.1, audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.05);
        osc.start(); osc.stop(audioContext.currentTime + 0.05);
    } catch(e) {}
}

// Game State
const ROWS = 6;
const COLS = 7;
let currentRoom = null;
let myColor = null;
let myName = '';
let opponentNameStr = '';
let moveCount = 0;

let gameState = {
    board: Array(ROWS).fill(null).map(() => Array(COLS).fill(null)),
    currentPlayer: 'red',
    gameActive: false,
    winner: null,
    winningCells: []
};

// Create Board
function createBoard() {
    elements.board.innerHTML = '';
    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
            const cell = document.createElement('div');
            cell.className = 'cell empty';
            cell.dataset.row = row;
            cell.dataset.col = col;
            cell.addEventListener('click', () => handleCellClick(col));
            elements.board.appendChild(cell);
        }
    }
    createColumnIndicators();
}

function createColumnIndicators() {
    elements.columnIndicators.innerHTML = '';
    for (let col = 0; col < COLS; col++) {
        const indicator = document.createElement('div');
        indicator.className = 'column-indicator';
        indicator.dataset.col = col;
        indicator.innerHTML = '<span class="arrow">⬇️</span>';
        indicator.addEventListener('click', () => handleCellClick(col));
        elements.columnIndicators.appendChild(indicator);
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
        if (gameState.winningCells.some(([r, c]) => r === row && c === col)) cell.classList.add('winner');
    });
}

function updatePlayerProfiles() {
    elements.playerProfile.classList.remove('active-turn');
    elements.opponentProfile.classList.remove('active-turn');
    if (!gameState.gameActive || gameState.winner) return;
    if (gameState.currentPlayer === myColor) elements.playerProfile.classList.add('active-turn');
    else elements.opponentProfile.classList.add('active-turn');
}

function updateTurnIndicator() {
    const t = translations[currentLanguage];
    if (!gameState.gameActive || gameState.winner) {
        elements.turnIndicator.style.background = '#95a5a6';
        elements.turnText.textContent = t.gameOver;
        elements.turnDot.className = 'turn-dot';
        return;
    }
    if (gameState.currentPlayer === myColor) {
        elements.turnIndicator.style.background = '#4CAF50';
        elements.turnText.textContent = t.yourTurn;
        elements.turnDot.className = 'turn-dot red';
    } else {
        elements.turnIndicator.style.background = '#FFA726';
        elements.turnText.textContent = opponentNameStr + t.opponentTurn;
        elements.turnDot.className = 'turn-dot yellow';
    }
}

function updatePlayerAvatars() {
    if (elements.playerAvatarLetter && myName) elements.playerAvatarLetter.textContent = myName.charAt(0).toUpperCase();
    if (elements.opponentAvatarLetter && opponentNameStr) elements.opponentAvatarLetter.textContent = opponentNameStr.charAt(0).toUpperCase();
}

function showScreen(screenName) {
    Object.keys(screens).forEach(key => screens[key].classList.remove('active'));
    screens[screenName].classList.add('active');
}

function showToast(message, type = '') {
    elements.toast.textContent = message;
    elements.toast.className = 'toast';
    if (type) elements.toast.classList.add(type);
    setTimeout(() => elements.toast.classList.add('show'), 100);
    setTimeout(() => elements.toast.classList.remove('show'), 3000);
}

function validateName() {
    const t = translations[currentLanguage];
    const name = elements.playerNameInput.value.trim();
    elements.nameError.textContent = '';
    if (!name) { elements.nameError.textContent = '❌ ' + t.nameRequired; return false; }
    if (name.length < 2) { elements.nameError.textContent = '❌ ' + t.nameTooShort; return false; }
    return true;
}

function createConfetti() {
    elements.confettiContainer.innerHTML = '';
    const colors = ['#FF4757', '#FFA502', '#4CAF50', '#6C63FF', '#FF6B81', '#FFC048'];
    for (let i = 0; i < 50; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.left = Math.random() * 100 + '%';
        confetti.style.background = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.animationDelay = Math.random() * 2 + 's';
        confetti.style.animationDuration = (Math.random() * 1 + 1) + 's';
        elements.confettiContainer.appendChild(confetti);
    }
}

function updateMoveInfo() {
    elements.moveCount.textContent = translations[currentLanguage].moves + ' ' + moveCount;
}

function resetGame() {
    currentRoom = null;
    myColor = null;
    opponentNameStr = '';
    moveCount = 0;
    gameState = {
        board: Array(ROWS).fill(null).map(() => Array(COLS).fill(null)),
        currentPlayer: 'red',
        gameActive: false,
        winner: null,
        winningCells: []
    };
    updateBoard();
}

// Event Listeners
elements.createRoomBtn.addEventListener('click', () => {
    playClickSound();
    if (validateName()) {
        myName = elements.playerNameInput.value.trim();
        socket.emit('createRoom', { playerName: myName });
    }
});

elements.joinRoomBtn.addEventListener('click', () => {
    playClickSound();
    if (!validateName()) return;
    const roomCode = elements.roomCodeInput.value.trim().toUpperCase();
    if (roomCode.length !== 6) {
        showToast(translations[currentLanguage].enterValidCode, 'error');
        return;
    }
    myName = elements.playerNameInput.value.trim();
    socket.emit('joinRoom', { roomCode, playerName: myName });
});

elements.copyCodeBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(elements.roomCodeDisplay.textContent).then(() => {
        showToast(translations[currentLanguage].codeCopied, 'success');
    });
});

elements.cancelWaitBtn.addEventListener('click', () => {
    socket.emit('leaveRoom', currentRoom);
    resetGame();
    showScreen('menu');
});

elements.restartBtn.addEventListener('click', () => {
    socket.emit('restartGame', currentRoom);
    elements.restartBtn.disabled = true;
});

elements.leaveBtn.addEventListener('click', () => {
    if (confirm(translations[currentLanguage].leave + '?')) {
        socket.emit('leaveRoom', currentRoom);
        resetGame();
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
    resetGame();
    showScreen('menu');
});

elements.howToPlayBtn.addEventListener('click', () => {
    playClickSound();
    elements.howToPlayModal.classList.add('active');
});

elements.closeHowToBtn.addEventListener('click', () => elements.howToPlayModal.classList.remove('active'));
if (elements.closeHowToTopBtn) elements.closeHowToTopBtn.addEventListener('click', () => elements.howToPlayModal.classList.remove('active'));

// Socket Events
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
    elements.playerScore.textContent = data.scores.red;
    elements.opponentScore.textContent = data.scores.yellow;
    updatePlayerAvatars();
    updateBoard();
    updateTurnIndicator();
    updatePlayerProfiles();
    updateMoveInfo();
    showScreen('game');
    elements.gameMessage.textContent = translations[currentLanguage].gameStarted + ' ' + myName + ' vs ' + opponentNameStr;
});

socket.on('pieceDropped', (data) => {
    playDropSound();
    gameState.board = data.board;
    gameState.currentPlayer = data.currentPlayer;
    moveCount++;
    updateBoard();
    updateTurnIndicator();
    updatePlayerProfiles();
    updateMoveInfo();
    if (data.player === myColor) {
        elements.gameMessage.textContent = '✅ ' + translations[currentLanguage].pieceDropped;
    } else {
        elements.gameMessage.textContent = '👀 ' + opponentNameStr + ' ' + translations[currentLanguage].opponentDropped;
    }
    elements.lastMove.textContent = translations[currentLanguage].last + ' ' + translations[currentLanguage].column + ' ' + (data.column + 1);
});

socket.on('gameOver', (data) => {
    gameState.board = data.board;
    gameState.winner = data.winner;
    gameState.gameActive = false;
    gameState.winningCells = data.winningCells;
    updateBoard();
    updateTurnIndicator();
    updatePlayerProfiles();
    elements.restartBtn.disabled = false;
    elements.playerScore.textContent = data.scores.red;
    elements.opponentScore.textContent = data.scores.yellow;
    
    if (data.winner === 'draw') {
        elements.gameOverEmoji.textContent = '🤝';
        elements.gameOverTitle.textContent = translations[currentLanguage].draw;
        elements.winnerName.textContent = '';
        elements.winnerAvatar.className = 'winner-avatar draw';
        elements.winnerAvatarLetter.textContent = '🤝';
        elements.gameOverMessage.textContent = translations[currentLanguage].boardFull;
    } else {
        const winnerNameStr = data.winner === myColor ? myName : data.winnerName;
        elements.winnerAvatar.className = 'winner-avatar ' + data.winner;
        elements.winnerAvatarLetter.textContent = winnerNameStr.charAt(0).toUpperCase();
        
        if (data.winner === myColor) {
            playWinSound();
            elements.gameOverEmoji.textContent = '🏆';
            elements.gameOverTitle.textContent = '🏆 ' + translations[currentLanguage].winner + ' 🏆';
            elements.winnerName.textContent = myName;
            elements.winnerName.style.color = myColor === 'red' ? '#FF4757' : '#FFA502';
            elements.gameOverMessage.textContent = translations[currentLanguage].youWin + ' 🎉';
            createConfetti();
        } else {
            playLoseSound();
            elements.gameOverEmoji.textContent = '😔';
            elements.gameOverTitle.textContent = data.winnerName + ' ' + translations[currentLanguage].youLose;
            elements.winnerName.textContent = data.winnerName;
            elements.winnerName.style.color = data.winner === 'red' ? '#FF4757' : '#FFA502';
            elements.gameOverMessage.textContent = data.winnerName + ' ' + translations[currentLanguage].youLose;
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
    updateBoard();
    updateTurnIndicator();
    updatePlayerProfiles();
    updateMoveInfo();
    elements.restartBtn.disabled = true;
    elements.gameOverModal.classList.remove('active');
    elements.gameMessage.textContent = '🔄 ' + translations[currentLanguage].gameRestarted;
});

socket.on('opponentLeft', () => {
    gameState.gameActive = false;
    elements.gameMessage.textContent = '⚠️ ' + translations[currentLanguage].opponentLeft;
    updateTurnIndicator();
});

socket.on('error', (message) => showToast(message, 'error'));

// Initialize
createBoard();
showScreen('menu');
loadLanguage();
elements.playerNameInput.focus();
console.log('Connect Four initialized');