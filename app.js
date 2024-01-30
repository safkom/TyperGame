// app.js
const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const mongoose = require('mongoose');
const path = require('path');
const gameRoutes = require('./routes/game');
const lobbyRoutes = require('./routes/lobby');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

mongoose.connect('mongodb://server.safko.eu/my-typing-game', { useNewUrlParser: true });

function normalizePort(val) {
  const port = parseInt(val, 10);

  if (isNaN(port)) {
    return val;
  }

  if (port >= 0) {
    return port;
  }

  return false;
}

app.use(express.static(path.join(__dirname, 'public')));
const socket = io();

app.use(express.json());
app.use('/game', gameRoutes);
app.use('/lobby', lobbyRoutes);

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

io.on('connection', (socket) => {
  console.log('A user connected');

  socket.on('createGame', (createdBy) => {
    const gameCode = generateGameCode();
    const gameData = {
      createdBy,
      gameCode,
      players: [{ name: createdBy, socketId: socket.id }],
    };

    // Shrani igro v bazo podatkov
    // Vaša logika shranjevanja v bazo podatkov bo odvisna od implementacije MongoDB
    // Spodnji primer je zgolj za ilustracijo
    saveGameToDatabase(gameData);

    io.emit('gameCreated', { createdBy, gameCode });
    socket.emit('redirectToLobby', { createdBy, gameCode });
  });

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

function generateGameCode(length = 6) {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let gameCode = '';

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    gameCode += characters.charAt(randomIndex);
  }
  console.log('Generated game code:', gameCode);
  return gameCode;
}

// Primer funkcije za shranjevanje igre v bazo podatkov (spremenite glede na vašo implementacijo MongoDB)
function saveGameToDatabase(gameData) {
  const Game = require('./models/Game'); // Predpostavljamo, da imate model Game

  const newGame = new Game(gameData);
  newGame.save((err, savedGame) => {
    if (err) {
      console.error('Error saving game to database:', err);
    } else {
      console.log('Game saved to database:', savedGame);
    }
  });
}

const port = normalizePort(process.env.PORT || '3001');
app.set('port', port);
server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

module.exports = app;
