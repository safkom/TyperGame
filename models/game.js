const mongoose = require('mongoose');

const gameSchema = new mongoose.Schema({
    createdBy: String,
    gameCode: String,
    players: [
        {
            name: String,
            socketId: String,
        },
    ],
});

const Game = mongoose.model('Game', gameSchema);

module.exports = Game;
