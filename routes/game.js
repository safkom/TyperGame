// routes/game.js
const express = require('express');
const router = express.Router();
const Game = require('../models/game');

router.post('/create', async (req, res) => {
    try {
        const createdBy = req.body.createdBy;

        // Create the game code
        const gameCode = generateGameCode();

        // Save the game to the database
        const game = new Game({
            createdBy,
            gameCode,
        });
        const savedGame = await game.save();

        res.json({
            gameCode: savedGame.gameCode,
            createdBy: savedGame.createdBy,
        });
    } catch (error) {
        console.error('Error creating game:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Add a function to generate the game code
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

module.exports = router;
