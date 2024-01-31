const mongoose = require('mongoose');

const gameSchema = new mongoose.Schema({
    createdBy: String,
    gameCode: String,
    maxPlayers: { type: Number, default: 1 }, // Set your desired maximum number of players
    players: [
        {
            name: String,
            socketId: String,
        },
    ],
});

const Game = mongoose.model('Game', gameSchema);

module.exports = Game;
