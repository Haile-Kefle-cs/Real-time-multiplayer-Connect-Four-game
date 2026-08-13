const socket = io();

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
    connectionStatus: document.getElementById('connectionStatus'),
    chatBody: document.getElementById('chatBody'),
    chatMessages: document.getElementById('chatMessages'),
    chatInput: document.getElementById('chatInput'),
    sendMessageBtn: document.getElementById('sendMessageBtn'),
    toggleChatBtn: document.getElementById('toggleChatBtn'),
    timerDisplay: document.getElementById('timerDisplay'),
    timerBar: document.getElementById('timerBar')
};

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

const translations = {
    en: {
        yourTurn: 'YOUR TURN', opponentTurn: "'s turn...", gameOver: 'Game Over',
        notYourTurn: "Not your turn!", columnFull: 'Column full!',
        gameNotActive: 'Game not active', enterValidCode: 'Enter valid code',
        nameRequired: 'Name is required!', nameTooShort: 'Min 2 characters!',
        enterName: 'Enter your name!', gameStarted: 'Game started!',
        youWin: 'You won!', youLose: 'wins!', draw: 'Draw!',
        opponentLeft: 'Opponent left!', gameRestarted: 'Game restarted!',
        codeCopied: 'Code copied!', connected: 'Connected', disconnected: 'Disconnected',
        moves: 'Moves:', last: 'Last:', column: 'Col', leave: 'Leave',
        winner: 'Winner!', autoPlaced: 'Auto-placed!'
    },
    am: {
        yourTurn: 'የእርስዎ ተራ', opponentTurn: ' ተራ...', gameOver: 'ጨዋታ አብቅቷል',
        notYourTurn: 'የእርስዎ ተራ አይደለም!', columnFull: 'አምዱ ሞልቷል!',
        gameNotActive: 'ጨዋታ ንቁ አይደለም', enterValidCode: 'ትክክለኛ ኮድ ያስገቡ',
        nameRequired: 'ስም ያስፈልጋል!', nameTooShort: 'ቢያንስ 2 ቁምፊዎች!',
        enterName: 'ስምዎን ያስገቡ!', gameStarted: 'ጨዋታ ተጀምሯል!',
        youWin: 'አሸንፈዋል!', youLose: 'አሸንፏል!', draw: 'አቻ!',
        opponentLeft: 'ተቃዋሚ ወጥቷል!', gameRestarted: 'እንደገና ተጀምሯል!',
        codeCopied: 'ኮድ ተቀድቷል!', connected: 'ተገናኝቷል', disconnected: 'ተቋርጧል',
        moves: 'እንቅስቃሴ:', last: 'የመጨረሻ:', column: 'አምድ', leave: 'ይውጡ',
        winner: 'አሸናፊ!', autoPlaced: 'በራስ-ሰር ተቀምጧል!'
    }
};

window.setLanguage = function(lang) {
    currentLanguage = lang;
    document.getElementById('langEn').classList.toggle('active', lang === 'en');
    document.getElementById('langAm').classList.toggle('active', lang === 'am');
    document.querySelectorAll('[data-en][data-am]').forEach(el => {
        el.textContent = el.getAttribute(`data-${lang}`);
    });
    updateTurnIndicator();
};

let audioContext;
function playSound(freq, duration, type = 'sine') {
    try {
        if (!audioContext) audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        osc.connect(gain); gain.connect(audioContext.destination);
        osc.frequency.value = freq; osc.type = type;
        gain.gain.setValueAtTime(0.2, audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
        osc.start(); osc.stop(audioContext.currentTime + duration);
    } catch(e) {}
}
function playDropSound() { playSound(300, 0.1); }
function playClickSound() { playSound(800, 0.05); }
function playErrorSound() { playSound(150, 0.3, 'square'); }

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
    if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
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
    if (!gameState.gameActive || gameState.winner) { showToast(t.gameNotActive); return; }
    if (gameState.currentPlayer !== myColor) { playErrorSound(); showToast(t.notYourTurn); return; }
    if (gameState.board[0][col] !== null) { playErrorSound(); showToast(t.columnFull); return; }
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
    const bubble = document.createElement('div');
    bubble.className = 'message-bubble' + (isSystem ? ' system-message' : '');
    bubble.textContent = (isSent ? '' : data.sender + ': ') + data.message;
    msgDiv.appendChild(bubble);
    elements.chatMessages.appendChild(msgDiv);
    elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
}

function clearChat() { elements.chatMessages.innerHTML = ''; }

function showToast(message, type = 'error') {
    elements.toast.textContent = message;
    elements.toast.className = 'toast';
    if (type) elements.toast.classList.add(type);
    void elements.toast.offsetWidth;
    elements.toast.classList.add('show');
    clearTimeout(elements.toast.timeout);
    elements.toast.timeout = setTimeout(() => elements.toast.classList.remove('show'), 3000);
}

function validateName() {
    const t = translations[currentLanguage];
    const name = elements.playerNameInput.value.trim();
    elements.nameError.textContent = '';
    elements.nameError.style.display = 'block';
    elements.playerNameInput.style.borderColor = '';
    
    if (!name) {
        elements.nameError.textContent = t.nameRequired;
        elements.nameError.style.color = '#ff4757';
        elements.playerNameInput.style.borderColor = '#ff4757';
        elements.playerNameInput.focus();
        showToast(t.enterName);
        playErrorSound();
        return false;
    }
    if (name.length < 2) {
        elements.nameError.textContent = t.nameTooShort;
        elements.nameError.style.color = '#ff4757';
        elements.playerNameInput.style.borderColor = '#ff4757';
        elements.playerNameInput.focus();
        showToast(t.nameTooShort);
        playErrorSound();
        return false;
    }
    elements.nameError.textContent = '✅';
    elements.nameError.style.color = '#4CAF50';
    elements.playerNameInput.style.borderColor = '#4CAF50';
    return true;
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

// Event Listeners
elements.createRoomBtn.addEventListener('click', () => {
    playClickSound();
    if (!validateName()) return;
    myName = elements.playerNameInput.value.trim();
    socket.emit('createRoom', { playerName: myName });
});

elements.joinRoomBtn.addEventListener('click', () => {
    playClickSound();
    if (!validateName()) return;
    const code = elements.roomCodeInput.value.trim().toUpperCase();
    if (code.length !== 6) { showToast(translations[currentLanguage].enterValidCode); return; }
    myName = elements.playerNameInput.value.trim();
    socket.emit('joinRoom', { roomCode: code, playerName: myName });
});

elements.playerNameInput.addEventListener('input', () => {
    if (elements.playerNameInput.value.trim().length > 0) {
        elements.nameError.textContent = '';
        elements.playerNameInput.style.borderColor = '';
    }
});

elements.sendMessageBtn.addEventListener('click', sendChatMessage);
elements.chatInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') sendChatMessage(); });
elements.toggleChatBtn.addEventListener('click', () => { elements.chatBody.classList.toggle('collapsed'); });

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
    if (confirm('Leave game?')) {
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

// Socket Events
socket.on('connect', () => {
    elements.connectionStatus.textContent = 'Connected';
    elements.connectionStatus.className = 'connection-status connected';
    setTimeout(() => elements.connectionStatus.style.display = 'none', 3000);
});

socket.on('disconnect', () => {
    elements.connectionStatus.textContent = 'Disconnected';
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
    elements.moveCount.textContent = 'Moves: ' + moveCount;
    elements.lastMove.textContent = 'Last: Col ' + (data.column + 1);
    if (data.autoPlaced) showToast(translations[currentLanguage].autoPlaced);
});

socket.on('gameOver', (data) => {
    gameState.board = data.board;
    gameState.winner = data.winner;
    gameState.gameActive = false;
    gameState.winningCells = data.winningCells;
    updateBoard();
    updateTurnIndicator();
    elements.restartBtn.disabled = false;
    elements.playerScore.textContent = data.scores.red;
    elements.opponentScore.textContent = data.scores.yellow;
    
    if (data.winner === 'draw') {
        elements.gameOverEmoji.textContent = '🤝';
        elements.gameOverTitle.textContent = 'Draw!';
        elements.winnerName.textContent = '';
        elements.winnerAvatar.className = 'winner-avatar draw';
        elements.winnerAvatarLetter.textContent = '🤝';
    } else {
        const winnerNameStr = data.winner === myColor ? myName : data.winnerName;
        elements.winnerAvatar.className = 'winner-avatar ' + data.winner;
        elements.winnerAvatarLetter.textContent = winnerNameStr.charAt(0).toUpperCase();
        if (data.winner === myColor) {
            elements.gameOverEmoji.textContent = '🏆';
            elements.gameOverTitle.textContent = '🏆 WINNER! 🏆';
            elements.winnerName.textContent = myName;
            elements.gameOverMessage.textContent = 'You won!';
            createConfetti();
        } else {
            elements.gameOverEmoji.textContent = '😔';
            elements.gameOverTitle.textContent = 'You Lost!';
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
socket.on('error', (message) => showToast(message));

// Initialize
createBoard();
showScreen('menu');
elements.playerNameInput.focus();
console.log('Game initialized with 10-second timer');
