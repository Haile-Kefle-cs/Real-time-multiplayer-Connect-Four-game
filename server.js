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
        createdAt: new Date().toISOString()
    };
}

function checkWinner(board, row, col, player) {
    const directions = [
        [0, 1], [1, 0], [1, 1], [1, -1]
    ];
    
    for (const [dx, dy] of directions) {
        const cells = [[row, col]];
        
        for (let i = 1; i < 4; i++) {
            const newRow = row + (dx * i);
            const newCol = col + (dy * i);
            if (newRow >= 0 && newRow < ROWS && newCol >= 0 && newCol < COLS && 
                board[newRow][newCol] === player) {
                cells.push([newRow, newCol]);
            } else break;
        }
        
        for (let i = 1; i < 4; i++) {
            const newRow = row - (dx * i);
            const newCol = col - (dy * i);
            if (newRow >= 0 && newRow < ROWS && newCol >= 0 && newCol < COLS && 
                board[newRow][newCol] === player) {
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
            
            // Send system message
            const systemMessage = {
                sender: 'System',
                senderColor: 'system',
                message: `${socket.playerName} joined the game!`,
                timestamp: new Date().toISOString()
            };
            gameRoom.chatMessages.push(systemMessage);
            io.to(normalizedCode).emit('chatMessage', systemMessage);
            
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
            
            if (gameRoom.winner) {
                socket.emit('error', 'Game is over');
                return;
            }
            
            if (column < 0 || column >= COLS) {
                socket.emit('error', 'Invalid column');
                return;
            }
            
            const row = findLowestEmptyRow(gameRoom.board, column);
            if (row === -1) {
                socket.emit('error', 'Column is full');
                return;
            }
            
            gameRoom.board[row][column] = socket.playerColor;
            gameRoom.moveHistory.push({ row, column, player: socket.playerColor });
            
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
                    scores: gameRoom.scores
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
                    scores: gameRoom.scores
                });
            } else {
                gameRoom.currentPlayer = gameRoom.currentPlayer === 'red' ? 'yellow' : 'red';
                
                io.to(roomCode).emit('pieceDropped', {
                    board: gameRoom.board,
                    currentPlayer: gameRoom.currentPlayer,
                    row: row,
                    column: column,
                    player: socket.playerColor
                });
            }
        } catch (error) {
            console.error('Error dropping piece:', error);
            socket.emit('error', 'Failed to drop piece');
        }
    });

    // Chat message handler
    socket.on('sendMessage', (data) => {
        try {
            const { roomCode, message, senderName } = data;
            const gameRoom = gameRooms.get(roomCode);
            
            if (!gameRoom) {
                socket.emit('error', 'Room not found');
                return;
            }
            
            if (!message || message.trim().length === 0) {
                return;
            }
            
            if (message.length > 200) {
                socket.emit('error', 'Message too long (max 200 characters)');
                return;
            }
            
            const chatMessage = {
                sender: socket.playerName || senderName || 'Unknown',
                senderColor: socket.playerColor || 'red',
                message: message.trim(),
                timestamp: new Date().toISOString()
            };
            
            gameRoom.chatMessages.push(chatMessage);
            
            // Keep only last 50 messages
            if (gameRoom.chatMessages.length > 50) {
                gameRoom.chatMessages = gameRoom.chatMessages.slice(-50);
            }
            
            io.to(roomCode).emit('chatMessage', chatMessage);
            
            console.log(`Chat [${roomCode}] ${chatMessage.sender}: ${chatMessage.message}`);
        } catch (error) {
            console.error('Error sending message:', error);
        }
    });

    socket.on('restartGame', (roomCode) => {
        try {
            const gameRoom = gameRooms.get(roomCode);
            if (!gameRoom) return;
            
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
            
            // Send system message
            const systemMessage = {
                sender: 'System',
                senderColor: 'system',
                message: 'Game restarted!',
                timestamp: new Date().toISOString()
            };
            io.to(roomCode).emit('chatMessage', systemMessage);
        } catch (error) {
            console.error('Error restarting game:', error);
        }
    });

    socket.on('leaveRoom', (roomCode) => {
        try {
            const gameRoom = gameRooms.get(roomCode);
            if (!gameRoom) return;
            
            const playerIndex = gameRoom.players.findIndex(p => p.id === socket.id);
            
            if (playerIndex !== -1) {
                const playerName = gameRoom.players[playerIndex].name;
                gameRoom.players.splice(playerIndex, 1);
                socket.leave(roomCode);
                
                if (gameRoom.players.length === 0) {
                    gameRooms.delete(roomCode);
                } else {
                    gameRoom.gameActive = false;
                    io.to(roomCode).emit('opponentLeft');
                    
                    // Send system message
                    const systemMessage = {
                        sender: 'System',
                        senderColor: 'system',
                        message: `${playerName} left the game!`,
                        timestamp: new Date().toISOString()
                    };
                    io.to(roomCode).emit('chatMessage', systemMessage);
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
                const playerName = room.players[playerIndex].name;
                room.players.splice(playerIndex, 1);
                
                if (room.players.length === 0) {
                    gameRooms.delete(roomCode);
                } else {
                    room.gameActive = false;
                    io.to(roomCode).emit('opponentLeft');
                    
                    const systemMessage = {
                        sender: 'System',
                        senderColor: 'system',
                        message: `${playerName} disconnected!`,
                        timestamp: new Date().toISOString()
                    };
                    io.to(roomCode).emit('chatMessage', systemMessage);
                }
            }
        });
    });
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`🎮 Connect Four server running on port ${PORT}`);
});
