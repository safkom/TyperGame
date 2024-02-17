const mongoose = require('mongoose');

const gameSchema = new mongoose.Schema({
    createdBy: { type: String, required: true },
    gameCode: { type: String, required: true },
    gameStarted: { type: Boolean, default: false },
    players: [
        {
            name: { type: String }, // Ensure that the name property is defined as a string
            socketId: { type: String }, // Assuming socketId is also a string
            timeTaken: { type: Number, default: null }, // Add a default value of null
            wordsCompleted: { type: Number, default: 0 },
        },
    ],
    words: [{ type: String, required: true, minlength: 1, maxlength: 50 }],
    winner: { type: String, default: null },
    timeTakenByWinner: { type: Number, default: null },
});

const Game = mongoose.model('Game', gameSchema);
module.exports = Game;
