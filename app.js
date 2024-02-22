const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const mongoose = require('mongoose');
const path = require('path');
const ejs = require('ejs');
const Game = require('./models/game');
const axios = require('axios');
const app = express();
const server = http.createServer(app);
const io = socketIO(server);

const games = {};

// Connect to MongoDB
mongoose.connect('mongodb://server.safko.eu/my-typing-game');

// Set up view engine and static files
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Serve static files
app.use(express.static(path.join(__dirname, 'public'), {
  // Set the correct MIME type for .js files
  setHeaders: (res, path, stat) => {
    if (path.endsWith('.js')) {
      res.setHeader('Content-Type', 'text/javascript');
    }
  }
}));


// Routes
app.get('/', (req, res) => {
  res.render('index');
});

// Route to handle the result page
// Route to handle the result page
app.get('/result', async (req, res) => {
  try {
      // Render the result page
      res.render('result');
  } catch (error) {
      console.error('Error rendering result page:', error);
      res.render('error', { message: 'Internal Server Error', error: { status: 500 } });
  }
});

app.get('/game', async (req, res) => {
  try {
    const gameCode = req.query.gameCode;

    // Find the game in the database based on the provided game code
    const existingGame = await Game.findOne({ gameCode });

    if (!existingGame) {
      return res.status(404).json({ error: 'Game not found' });
    }

    // Extract the words and players from the existingGame object
    const words = existingGame.words;
    const players = existingGame.players; // Assuming each player has a 'name' property

    // Get the player's name from the query parameters
    const playerName = req.query.playerName;

    // Find the player's progress in the game
    const player = players.find(player => player.name === playerName);
    const currentWordIndex = player.wordsCompleted;

    // Render the game.ejs file with the words, players, playerName, and currentWordIndex
    res.render('game', { words, players, playerName, currentWordIndex });
  } catch (error) {
    console.error('Error rendering game:', error);
    res.render('error', { message: 'Internal Server Error', error: { status: 500 } });
  }
});



app.get('/game/words', async (req, res) => {
  try {
    const gameCode = req.query.gameCode;

    // Find the game in the database based on the provided game code
    const existingGame = await Game.findOne({ gameCode });

    if (!existingGame) {
      return res.status(404).json({ error: 'Game not found' });
    }

    // Assuming you have a field in your Game model called 'words'
    const words = existingGame.words;

    res.json({ words });
  } catch (error) {
    console.error('Error fetching words:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});



app.get('/lobby', async (req, res) => {
  const gameCode = req.query.gameCode; // Assuming you are passing gameCode as a query parameter
  const playerName = req.query.playerName; // Assuming you are passing playerName as a query parameter

  try {
    const existingGame = await Game.findOne({ gameCode });
    if (!existingGame) {
      return res.render('error', { message: 'Game not found', error: { status: 404 } });
    }

    res.render('lobby', { gameCode, playerName, players: existingGame.players });
  } catch (error) {
    console.error('Error rendering lobby:', error);
    res.render('error', { message: 'Internal Server Error', error: { status: 500 } });
  }
});

app.get('/game/players', async (req, res) => {
  try {
    const gameCode = req.query.gameCode;
    const existingGame = await Game.findOne({ gameCode });
    if (existingGame) {
      // Return players list and gameStarted status
      return res.json({ players: existingGame.players, gameStarted: existingGame.gameStarted });
    } else {
      return res.status(404).json({ error: 'Game not found' });
    }
  } catch (error) {
    console.error('Error fetching players:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/db', async (req, res) => {
  try {
      const gameCode = req.query.gameCode;
      const existingGame = await Game.findOne({ gameCode });
      
      if (existingGame) {
          // Return players list, winner, timeTakenByWinner, and gameStarted status
          return res.json({
              players: existingGame.players,
              timeTakenByWinner: existingGame.timeTakenByWinner,
              winner: existingGame.winner,
              gameStarted: existingGame.gameStarted,
              words: existingGame.words
          });
      } else {
          return res.status(404).json({ error: 'Game not found' });
      }
  } catch (error) {
      console.error('Error fetching game data:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
  }
});



app.post('/winner', async (req, res) => {
  const { gameCode, playerName, timeTaken } = req.body;

  try {
    // Find the game in the database
    const existingGame = await Game.findOne({ gameCode });

    if (!existingGame) {
      return res.status(404).send('Game not found');
    }

    // Check if winner and timeTakenByWinner are null
    if (existingGame.winner !== null && existingGame.timeTakenByWinner !== null) {
      return res.status(400).send('Winner data already entered');
    }

    // Update game with winner data
    existingGame.winner = playerName;
    existingGame.timeTakenByWinner = timeTaken;
    await existingGame.save();

    // Send response
    res.status(200).send('Winner data saved');
  } catch (error) {
    console.error('Error entering winner data:', error);
    res.status(500).send('Failed to enter winner data');
  }
});

app.post('/data', async (req, res) => {
  const { gameCode, playerName, timeTaken } = req.body;

  try {
    // Find the game in the database
    const existingGame = await Game.findOne({ gameCode });

    if (!existingGame) {
      return res.status(404).send('Game not found');
    }

    // Find the player who didn't win and update their time taken
    const playerIndex = existingGame.players.findIndex(player => player.name === playerName);
    if (playerIndex !== -1) {
      existingGame.players[playerIndex].timeTaken = timeTaken;
      await existingGame.save();
      return res.status(200).send('Player data updated');
    } else {
      return res.status(400).send('Player not found');
    }
  } catch (error) {
    console.error('Error updating player data:', error);
    res.status(500).send('Failed to update player data');
  }
});

app.post('/words', async (req, res) => {
  const { gameCode, playerName, wordsCompleted } = req.body;

  try {
    // Find the game in the database
    const existingGame = await Game.findOne({ gameCode });

    if (!existingGame) {
      return res.status(404).send('Game not found');
    }

    // Find the player who didn't win and update their time taken
    const playerIndex = existingGame.players.findIndex(player => player.name === playerName);
    if (playerIndex !== -1) {
      existingGame.players[playerIndex].wordsCompleted = wordsCompleted;
      await existingGame.save();
      return res.status(200).send('Player data updated');
    } else {
      return res.status(400).send('Player not found');
    }
  } catch (error) {
    console.error('Error updating player data:', error);
    res.status(500).send('Failed to update player data');
  }
});



// Game namespace
const gameNamespace = io.of('/game');

gameNamespace.on('connection', (socket) => {
  socket.on('createGame', async ({ createdBy, gameCode }) => {
    try {
      console.log(`Game created by ${createdBy}, code: ${gameCode}`);

      // Make a request to the quotes API to get 20 random words
      const response = await axios.get('https://api.quotable.io/quotes/random?minLength=100&maxLength=140');
      
      // Check if response data is available and has content property
      if (response.data && response.data.length > 0 && response.data[0].content) {
        const quoteContent = response.data[0].content;
        // Split the content into words
        const words = quoteContent.split(' '); // Extract the first 20 words from the response

        // Save the game data to the database
        const newGame = new Game({
          createdBy,
          gameCode,
          gameStarted: false,
          players: [{ name: createdBy, socketId: socket.id, wordsCompleted: 0, timeTaken: null}],
          words: words, // Add the words to the game

        });

        await newGame.save();

        // Join the socket to the game room
        socket.join(gameCode);

        console.log(`Player ${createdBy} added to the player list`);

        // Emit the updated player list to all clients in the game room
        gameNamespace.to(gameCode).emit('updatePlayerList', { players: [{ name: createdBy }] });

        // Redirect to the lobby with the necessary parameters
        gameNamespace.to(gameCode).emit('redirectToLobby', { createdBy, gameCode });
      } else {
        throw new Error('Response data or content property is undefined');
      }

    } catch (error) {
      console.error('Error creating game:', error);
      // Emit an error event to the client
      socket.emit('createGameError', { error: 'Error creating game' });
    }
  });

  socket.on('getPlayersInGame', async ({ gameCode }) => {
    try {
      // Find the game in the database
      const existingGame = await Game.findOne({ gameCode });

      if (existingGame) {
        // Emit the player list to the client
        gameNamespace.to(gameCode).emit('updatePlayerList', { players: existingGame.players });
      }
    } catch (error) {
      console.error('Error getting players in game:', error);
    }
  });

  // inside gameNamespace.on('connection', (socket) => { ... })

  // inside gameNamespace.on('connection', (socket) => { ... })

  socket.on('joinGame', async ({ playerName, gameCode }) => {
    try {
        // Find the game in the database
        const existingGame = await Game.findOne({ gameCode });

        if (!existingGame) {
            console.error('Game not found:', gameCode);
            return;
        }
        // Check if the lobby is full
        if (existingGame.players.length >= 2) {
            console.error('Lobby is full:', gameCode);
            // Emit an event to notify the client that the lobby is full
            socket.emit('lobbyFullError', { error: 'Lobby is full' });
            return;
        }

        // Check if the player already exists in the game
        const playerIndex = existingGame.players.findIndex(player => player.name === playerName);
        if (playerIndex !== -1) {
            // Player already exists, emit an event to notify the client
            socket.emit('playerExistsError', { error: 'Player with the same name already exists in the lobby' });
            return;
        }

        // Player doesn't exist, add them to the game
        existingGame.players.push({ name: playerName });
        await existingGame.save();

        // Emit the updated player list to all clients in the game room
        gameNamespace.to(gameCode).emit('updatePlayerList', { players: existingGame.players });

        // If there are two players, emit an event to enable the start game button
        if (existingGame.players.length === existingGame.maxPlayers) {
            gameNamespace.to(gameCode).emit('enableStartGameButton');
        }

        console.log(`Player ${playerName} added to the player list`);
    } catch (error) {
        console.error('Error joining game: ', error);
    }
});
});

app.post('/game/join', async (req, res) => {
  try {
      const playerName = req.body.playerName;
      const gameCode = req.body.gameCode;

      // Find the game in the database
      const existingGame = await Game.findOne({ gameCode });

      if (!existingGame) {
          // If the game is not found, return a JSON response
          return res.status(404).json({ error: 'Game not found' });
      }

      // Check if the lobby is full
      if (existingGame.players.length >= 2) {
          // If the lobby is full, return a JSON response
          return res.status(400).json({ error: 'Lobby is full' });
      }

      // Check if the playerName is the same as the createdBy name
      if (existingGame.createdBy === playerName) {
          // If the playerName is the same as the createdBy name, return a JSON response
          return res.status(400).json({ error: 'Player with the same name as the creator already exists in the lobby' });
      }

      // Check if the player already exists in the game
      const playerIndex = existingGame.players.findIndex(player => player.name === playerName);
      if (playerIndex !== -1) {
          // Player already exists, emit an event to notify the client
          return res.status(400).json({ error: 'Player with the same name already exists in the lobby' });
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

      // Emit an event to update the player list in the lobby
      io.to(gameCode).emit('updatePlayerList', { players: existingGame.players });

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

      // Find the game in the database
      const existingGame = await Game.findOne({ gameCode });

      if (existingGame) {
          // Update the gameStarted variable to true
          existingGame.gameStarted = true;
          await existingGame.save();

          // Respond with a JSON indicating the game has started
          res.json({ gameStarted: true });
      } else {
          // Respond with a JSON indicating the game was not found
          res.json({ gameStarted: false });
      }
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
const port = normalizePort(process.env.PORT || '9343');
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
