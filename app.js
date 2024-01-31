const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const mongoose = require('mongoose');
const path = require('path');
const ejs = require('ejs');
const Game = require('./models/game');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

// Connect to MongoDB
mongoose.connect('mongodb://server.safko.eu/my-typing-game', { useNewUrlParser: true });

// Set up view engine and static files
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Routes
app.get('/', (req, res) => {
  res.render('index');
});

app.get('/lobby', (req, res) => {
  const gameCode = req.query.gameCode; // Assuming you are passing gameCode as a query parameter
  res.render('lobby', { gameCode }); // Pass the gameCode to the template
});


// Game namespace
const gameNamespace = io.of('/game');

gameNamespace.on('connection', (socket) => {
  console.log('A user connected to /game namespace');

  socket.on('createGame', async ({ createdBy, gameCode }) => {
    try {
      // Save the game data to the database
      const newGame = new Game({
        createdBy,
        gameCode,
        players: [{ name: createdBy, socketId: socket.id }],
      });

      await newGame.save();

      // Join the socket to the game room
      socket.join(gameCode);

      // Redirect to the lobby with the necessary parameters
      gameNamespace.to(gameCode).emit('redirectToLobby', { createdBy, gameCode });

    } catch (error) {
      console.error('Error creating game:', error);
      // Emit an error event to the client
      socket.emit('createGameError', { error: 'Error creating game' });
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected from /game namespace');
  });
});

app.post('/game/join', async (req, res) => {
  try {
    const playerName = req.body.playerName;
    const gameCode = req.body.gameCode;

    // Find the game in the database
    const existingGame = await Game.findOne({ gameCode });

    if (!existingGame) {
      // If the game is not found, return an HTML response
      res.render('error', { message: 'Game not found', error: { status: 404 } });
      return;
    }

    // Check if the lobby is full
    if (existingGame.players.length >= existingGame.maxPlayers) {
      // If the lobby is full, return an HTML response
      res.render('error', { message: 'Lobby is full', error: { status: 400 } });
      return;
    }

    // Save the player's name in the database for the corresponding game
    existingGame.players.push({ name: playerName });
    await existingGame.save();

    // Emit socket events
    gameNamespace.to(gameCode).emit('playerJoined', { playerName });

    // If there are two players, emit an event to enable the start game button
    if (existingGame.players.length === 2) {
      gameNamespace.to(gameCode).emit('enableStartGameButton');
    }

    // Redirect to the lobby with the necessary parameters
    res.json({ redirectTo: `/lobby?gameCode=${gameCode}&playerName=${playerName}` });
  } catch (error) {
    console.error('Error joining game:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Add a new route to handle the start game action
app.post('/game/start', async (req, res) => {
  try {
    const gameCode = req.body.gameCode;

    // Emit an event to notify clients that the game is starting
    gameNamespace.to(gameCode).emit('startGame');

    res.json({ success: true });
  } catch (error) {
    console.error('Error starting game:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});
// New route for handling the POST request from the client to create a game
app.post('/game/create', async (req, res) => {
  try {
    const createdBy = req.body.createdBy;

    // Send success response
    res.json({ gameCode: generateGameCode() });
  } catch (error) {
    console.error('Error creating game:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Function to generate a game code
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

// Set up the server to listen on a port
const port = normalizePort(process.env.PORT || '3002');
server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
  app.set('port', port);
});

// Function to normalize the port
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

// Export the app for testing purposes
module.exports = app;
