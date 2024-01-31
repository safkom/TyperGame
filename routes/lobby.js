// routes/lobby.js
const express = require('express');
const path = require('path'); // Add this line
const router = express.Router();

router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../views', 'lobby.ejs'));
});

module.exports = router;
