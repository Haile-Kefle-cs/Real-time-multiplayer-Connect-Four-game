const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

const PORT = process.env.PORT || 3000;
const TURN_TIMER = 5000; // 5 seconds

app.use(express.static(path.join(__dirname, 'public')));
app.get('/health', (req, res) => {
    res.json({ status: 'ok', message: 'Connect Four server running' });
});

const gameRooms = new Map();
const ROWS = 6;
const COLS = 7;

function generateRoomCode() {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    do {
        code = '';
        for (let i = 0; i < 6; i++) {
            code += characters.charAt(Math.floor(Math.random() * characters.length));
        }
    } while (gameRooms.has(code));
    return code;
}

function createGameRoom() {
    return {
        board: Array(ROWS).fill(null).map(() => Array(COLS).fill(null)),
        currentPlayer: 'red',
        players: [],
        playerNames: {},
        gameActive: false,
        winner: null,
        winningCells: [],
        moveHistory: [],
        scores: { red: 0, yellow: 0 },
        chatMessages: [],
        turnTimer: null,
        turnDeadline: null,
        createdAt: new Date().toISOString()
    };
}

function checkWinner(board, row, col, player) {
    const directions = [[0, 1], [1, 0], [1, 1], [1, -1]];
    for (const [dx, dy] of directions) {
        const cells = [[row, col]];
        for (let i = 1; i < 4; i++) {
            const newRow = row + (dx * i);
            const newCol = col + (dy * i);
            if (newRow >= 0 && newRow < ROWS && newCol >= 0 && newCol < COLS && board[newRow][newCol] === player) {
                cells.push([newRow, newCol]);
            } else break;
        }
        for (let i = 1; i < 4; i++) {
            const newRow = row - (dx * i);
            const newCol = col - (dy * i);
            if (newRow >= 0 && newRow < ROWS && newCol >= 0 && newCol < COLS && board[newRow][newCol] === player) {
                cells.unshift([newRow, newCol]);
            } else break;
        }
        if (cells.length >= 4) return cells;
    }
    return null;
}

function isBoardFull(board) {
    return board[0].every(cell => cell !== null);
}

function findLowestEmptyRow(board, col) {
    for (let row = ROWS - 1; row >= 0; row--) {
        if (board[row][col] === null) return row;
    }
    return -1;
}

function getAvailableColumns(board) {
    const columns = [];
    for (let col = 0; col < COLS; col++) {
        if (board[0][col] === null) columns.push(col);
    }
    return columns;
}

function autoPlaceDisc(roomCode) {
    const gameRoom = gameRooms.get(roomCode);
    if (!gameRoom || !gameRoom.gameActive || gameRoom.winner) return;
    
    const availableColumns = getAvailableColumns(gameRoom.board);
    if (availableColumns.length === 0) return;
    
    const randomCol = availableColumns[Math.floor(Math.random() * availableColumns.length)];
    const row = findLowestEmptyRow(gameRoom.board, randomCol);
    if (row === -1) return;
    
    const currentPlayerColor = gameRoom.currentPlayer;
    const playerName = gameRoom.playerNames[currentPlayerColor] || 'Player';
    
    gameRoom.board[row][randomCol] = currentPlayerColor;
    gameRoom.moveHistory.push({ row, column: randomCol, player: currentPlayerColor, autoPlaced: true });
    
    const winningCells = checkWinner(gameRoom.board, row, randomCol, currentPlayerColor);
    
    if (winningCells) {
        gameRoom.winner = currentPlayerColor;
        gameRoom.winningCells = winningCells;
        gameRoom.gameActive = false;
        gameRoom.scores[currentPlayerColor]++;
        clearTurnTimer(roomCode);
        
        io.to(roomCode).emit('gameOver', {
            board: gameRoom.board,
            winner: currentPlayerColor,
            winnerName: playerName,
            winningCells: winningCells,
            player: currentPlayerColor,
            scores: gameRoom.scores,
            autoPlaced: true
        });
        
        const systemMessage = {
            sender: 'System',
            senderColor: 'system',
            message: `⏱️ ${playerName} ran out of time! Auto-placed and won!`,
            timestamp: new Date().toISOString()
        };
        io.to(roomCode).emit('chatMessage', systemMessage);
    } else if (isBoardFull(gameRoom.board)) {
        gameRoom.winner = 'draw';
        gameRoom.gameActive = false;
        clearTurnTimer(roomCode);
        
        io.to(roomCode).emit('gameOver', {
            board: gameRoom.board,
            winner: 'draw',
            winnerName: 'Draw',
            winningCells: [],
            player: null,
            scores: gameRoom.scores,
            autoPlaced: true
        });
    } else {
        gameRoom.currentPlayer = gameRoom.currentPlayer === 'red' ? 'yellow' : 'red';
        
        io.to(roomCode).emit('pieceDropped', {
            board: gameRoom.board,
            currentPlayer: gameRoom.currentPlayer,
            row: row,
            column: randomCol,
            player: currentPlayerColor,
            autoPlaced: true
        });
        
        const systemMessage = {
            sender: 'System',
            senderColor: 'system',
            message: `⏱️ ${playerName} ran out of time! Auto-placed disc in column ${randomCol + 1}.`,
            timestamp: new Date().toISOString()
        };
        io.to(roomCode).emit('chatMessage', systemMessage);
        
        startTurnTimer(roomCode);
    }
}

function startTurnTimer(roomCode) {
    const gameRoom = gameRooms.get(roomCode);
    if (!gameRoom) return;
    
    clearTurnTimer(roomCode);
    
    gameRoom.turnDeadline = Date.now() + TURN_TIMER;
    
    io.to(roomCode).emit('timerStart', {
        duration: TURN_TIMER,
        deadline: gameRoom.turnDeadline
    });
    
    gameRoom.turnTimer = setTimeout(() => {
        autoPlaceDisc(roomCode);
    }, TURN_TIMER);
}

function clearTurnTimer(roomCode) {
    const gameRoom = gameRooms.get(roomCode);
    if (gameRoom && gameRoom.turnTimer) {
        clearTimeout(gameRoom.turnTimer);
        gameRoom.turnTimer = null;
        gameRoom.turnDeadline = null;
    }
}

io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    socket.on('createRoom', (data) => {
        try {
            const playerName = data.playerName || 'Player 1';
            const roomCode = generateRoomCode();
            const gameRoom = createGameRoom();
            
            socket.playerColor = 'red';
            socket.playerName = playerName;
            gameRoom.players.push({ id: socket.id, color: 'red', name: playerName });
            gameRoom.playerNames.red = playerName;
            gameRooms.set(roomCode, gameRoom);
            
            socket.join(roomCode);
            socket.emit('roomCreated', { roomCode, color: 'red' });
            console.log(`Room ${roomCode} created by ${playerName}`);
        } catch (error) {
            console.error('Error creating room:', error);
            socket.emit('error', 'Failed to create room');
        }
    });

    socket.on('joinRoom', (data) => {
        try {
            const { roomCode, playerName } = data;
            const normalizedCode = roomCode.toUpperCase().trim();
            const gameRoom = gameRooms.get(normalizedCode);
            
            if (!gameRoom) {
                socket.emit('error', 'Room not found');
                return;
            }
            if (gameRoom.players.length >= 2) {
                socket.emit('error', 'Room is full');
                return;
            }
            
            socket.playerColor = 'yellow';
            socket.playerName = playerName || 'Player 2';
            gameRoom.players.push({ id: socket.id, color: 'yellow', name: socket.playerName });
            gameRoom.playerNames.yellow = socket.playerName;
            gameRoom.gameActive = true;
            
            socket.join(normalizedCode);
            socket.emit('roomJoined', { roomCode: normalizedCode, color: 'yellow' });
            
            io.to(normalizedCode).emit('gameStart', {
                board: gameRoom.board,
                currentPlayer: gameRoom.currentPlayer,
                playerNames: gameRoom.playerNames,
                players: gameRoom.players.map(p => ({ color: p.color, name: p.name })),
                scores: gameRoom.scores,
                chatMessages: gameRoom.chatMessages
            });
            
            startTurnTimer(normalizedCode);
            console.log(`${socket.playerName} joined room ${normalizedCode}`);
        } catch (error) {
            console.error('Error joining room:', error);
            socket.emit('error', 'Failed to join room');
        }
    });

    socket.on('dropPiece', (data) => {
        try {
            const { roomCode, column } = data;
            const gameRoom = gameRooms.get(roomCode);
            
            if (!gameRoom || !gameRoom.gameActive) return;
            if (gameRoom.currentPlayer !== socket.playerColor) {
                socket.emit('error', 'It is not your turn');
                return;
            }
            if (gameRoom.winner) return;
            if (column < 0 || column >= COLS) return;
            
            const row = findLowestEmptyRow(gameRoom.board, column);
            if (row === -1) {
                socket.emit('error', 'Column is full');
                return;
            }
            
            clearTurnTimer(roomCode);
            
            gameRoom.board[row][column] = socket.playerColor;
            gameRoom.moveHistory.push({ row, column, player: socket.playerColor, autoPlaced: false });
            
            const winningCells = checkWinner(gameRoom.board, row, column, socket.playerColor);
            
            if (winningCells) {
                gameRoom.winner = socket.playerColor;
                gameRoom.winningCells = winningCells;
                gameRoom.gameActive = false;
                gameRoom.scores[socket.playerColor]++;
                
                const winnerName = gameRoom.playerNames[socket.playerColor];
                
                io.to(roomCode).emit('gameOver', {
                    board: gameRoom.board,
                    winner: socket.playerColor,
                    winnerName: winnerName,
                    winningCells: winningCells,
                    player: socket.playerColor,
                    scores: gameRoom.scores,
                    autoPlaced: false
                });
            } else if (isBoardFull(gameRoom.board)) {
                gameRoom.winner = 'draw';
                gameRoom.gameActive = false;
                
                io.to(roomCode).emit('gameOver', {
                    board: gameRoom.board,
                    winner: 'draw',
                    winnerName: 'Draw',
                    winningCells: [],
                    player: null,
                    scores: gameRoom.scores,
                    autoPlaced: false
                });
            } else {
                gameRoom.currentPlayer = gameRoom.currentPlayer === 'red' ? 'yellow' : 'red';
                
                io.to(roomCode).emit('pieceDropped', {
                    board: gameRoom.board,
                    currentPlayer: gameRoom.currentPlayer,
                    row: row,
                    column: column,
                    player: socket.playerColor,
                    autoPlaced: false
                });
                
                startTurnTimer(roomCode);
            }
        } catch (error) {
            console.error('Error dropping piece:', error);
            socket.emit('error', 'Failed to drop piece');
        }
    });

    socket.on('sendMessage', (data) => {
        try {
            const { roomCode, message, senderName } = data;
            const gameRoom = gameRooms.get(roomCode);
            if (!gameRoom) return;
            if (!message || message.trim().length === 0) return;
            if (message.length > 200) return;
            
            const chatMessage = {
                sender: socket.playerName || senderName || 'Unknown',
                senderColor: socket.playerColor || 'red',
                message: message.trim(),
                timestamp: new Date().toISOString()
            };
            
            gameRoom.chatMessages.push(chatMessage);
            if (gameRoom.chatMessages.length > 50) {
                gameRoom.chatMessages = gameRoom.chatMessages.slice(-50);
            }
            
            io.to(roomCode).emit('chatMessage', chatMessage);
        } catch (error) {
            console.error('Error sending message:', error);
        }
    });

    socket.on('restartGame', (roomCode) => {
        try {
            const gameRoom = gameRooms.get(roomCode);
            if (!gameRoom) return;
            
            clearTurnTimer(roomCode);
            
            gameRoom.board = Array(ROWS).fill(null).map(() => Array(COLS).fill(null));
            gameRoom.currentPlayer = 'red';
            gameRoom.gameActive = true;
            gameRoom.winner = null;
            gameRoom.winningCells = [];
            gameRoom.moveHistory = [];
            
            io.to(roomCode).emit('gameRestarted', {
                board: gameRoom.board,
                currentPlayer: gameRoom.currentPlayer,
                scores: gameRoom.scores
            });
            
            startTurnTimer(roomCode);
        } catch (error) {
            console.error('Error restarting game:', error);
        }
    });

    socket.on('leaveRoom', (roomCode) => {
        try {
            const gameRoom = gameRooms.get(roomCode);
            if (!gameRoom) return;
            
            clearTurnTimer(roomCode);
            
            const playerIndex = gameRoom.players.findIndex(p => p.id === socket.id);
            if (playerIndex !== -1) {
                gameRoom.players.splice(playerIndex, 1);
                socket.leave(roomCode);
                
                if (gameRoom.players.length === 0) {
                    gameRooms.delete(roomCode);
                } else {
                    gameRoom.gameActive = false;
                    io.to(roomCode).emit('opponentLeft');
                }
            }
        } catch (error) {
            console.error('Error leaving room:', error);
        }
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
        
        gameRooms.forEach((room, roomCode) => {
            const playerIndex = room.players.findIndex(p => p.id === socket.id);
            if (playerIndex !== -1) {
                clearTurnTimer(roomCode);
                room.players.splice(playerIndex, 1);
                
                if (room.players.length === 0) {
                    gameRooms.delete(roomCode);
                } else {
                    room.gameActive = false;
                    io.to(roomCode).emit('opponentLeft');
                }
            }
        });
    });
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`🎮 Connect Four server running on port ${PORT}`);
    console.log(`⏱️ Turn timer: ${TURN_TIMER/1000} seconds`);
});
