const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const mongoose = require('mongoose');
const path = require('path');
const ejs = require('ejs'); // Add ejs dependency
const gameRoutes = require('./routes/game');
const lobbyRoutes = require('./routes/lobby');
const Game = require('./models/game'); //

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

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs'); // Set view engine to ejs

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use('/game', gameRoutes);

app.get('/', (req, res) => {
  res.render('index'); // Use render instead of sendFile
});

app.get('/lobby', (req, res) => {
  // Assuming you have a lobby.ejs file in the views directory
  res.render('lobby');
});

app.post('/game/join', async (req, res) => {
  try {
    const { gameCode, playerName } = req.body;

    // Check if the game with the given code exists in the database
    const existingGame = await Game.findOne({ gameCode });

    if (!existingGame) {
      return res.status(404).json({ error: 'Game not found' });
    }

    // Check if the lobby is full (assuming maxPlayers is the limit)
    if (existingGame.players.length >= existingGame.maxPlayers) {
      return res.status(400).json({ error: 'Lobby is full' });
    }

    // Save the player's name in the database for the corresponding game
    existingGame.players.push({ name: playerName }); // Use an object to represent a player

    // Save the modified game to the database
    await existingGame.save();

    // Redirect to the lobby with the necessary parameters
    res.json({ redirectTo: `/lobby?gameCode=${gameCode}&playerName=${playerName}` });
  } catch (error) {
    console.error('Error joining game:', error);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
});



app.post('/game/create', async (req, res) => {
  const { createdBy } = req.body;
  const gameCode = generateGameCode();

  const gameData = {
    createdBy,
    gameCode,
    players: [{ name: createdBy, socketId: null }],
  };

  // Save game to database (update according to your MongoDB implementation)
  saveGameToDatabase(gameData);

  // Send the necessary parameters to the lobby
  res.json({ createdBy, gameCode });
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

    // Save game to database (update according to your MongoDB implementation)
    saveGameToDatabase(gameData);

    io.emit('gameCreated', { createdBy, gameCode });
    socket.emit('redirectToLobby', { createdBy, gameCode });
  });

  // Listen for 'playerJoinGame' events
  socket.on('playerJoinGame', (data) => {
    const { playerName, gameCode } = data;
    // Update the list of players in the lobby
    io.to(gameCode).emit('playerJoined', { name: playerName });
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

function saveGameToDatabase(gameData) {
  const newGame = new Game(gameData);
  newGame.save((err, savedGame) => {
    if (err) {
      console.error('Error saving game to database:', err);
    } else {
      console.log('Game saved to database:', savedGame);
    }
  });
}

const port = normalizePort(process.env.PORT || '3002');

server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
  app.set('port', port); // Move this line inside the callback
});

module.exports = app;
