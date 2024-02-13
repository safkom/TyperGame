const mongoose = require('mongoose');

const gameSchema = new mongoose.Schema({
    createdBy: { type: String, required: true },
    gameCode: { type: String, required: true },
    gameStarted: { type: Boolean, default: false },
    players: [
        {
            name: { type: String }, // Ensure that the name property is defined as a string
            socketId: { type: String }, // Assuming socketId is also a string
        },
    ],
});

const Game = mongoose.model('Game', gameSchema);
module.exports = Game;
