document.addEventListener('DOMContentLoaded', () => {
    const lobbyInfoContainer = document.getElementById('lobbyInfo');

    // Get data from URL
    const urlParams = new URLSearchParams(window.location.search);
    const createdBy = urlParams.get('createdBy');
    const gameCode = urlParams.get('gameCode');

    // Display game information
    displayGameInfo(createdBy, gameCode);

    // Function to display game information on the screen
    function displayGameInfo(createdBy, gameCode) {
        lobbyInfoContainer.innerHTML = `
            <p>Waiting for players to join...</p>
            <p>Game Code: ${gameCode}</p>
        `;
    }

    // Connect to WebSocket for real-time updates
    const socket = io();

    // Listen for 'playerJoined' events
    socket.on('playerJoined', (player) => {
        // Update the list of players in the lobby
        updatePlayerList(player.name);
    });

    // Function to update the player list
    function updatePlayerList(playerName) {
        const playerListContainer = document.getElementById('playerList');
        const listItem = document.createElement('li');
        listItem.textContent = playerName;
        playerListContainer.appendChild(listItem);
    }
});
