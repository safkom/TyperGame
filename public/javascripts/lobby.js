document.addEventListener('DOMContentLoaded', () => {
    // Connect to the game namespace
    const socket = io('/game');

    const playerListContainer = document.getElementById('playerList');
    const startGameButton = document.getElementById('startGameButton');

    // Function to update the player list in the UI
    function updatePlayerList(playerList) {
        console.log('Updating player list:', playerList);
        console.log('Player list length:', playerList.length);
        playerListContainer.innerHTML = ''; // Clear the current player list
        playerList.forEach(player => {
            const playerListItem = document.createElement('li');
            playerListItem.textContent = player.name;
            playerListContainer.appendChild(playerListItem);
        });
    }

    // Listen for updatePlayerList event
    socket.on('updatePlayerList', ({ playerList }) => {
        console.log('Received updatePlayerList event:', playerList);
        updatePlayerList(playerList); // Update player list in UI
    });

    // Listen for enableStartGameButton event
    socket.on('enableStartGameButton', () => {
        console.log('Enabling start game button');
        startGameButton.removeAttribute('disabled'); // Enable start game button
    });

    // Trigger event to get players in the game
    socket.emit('getPlayersInGame', { gameCode: '<%= gameCode %>' }); // Assuming gameCode is provided in the EJS template
});
