document.addEventListener('DOMContentLoaded', () => {
    const socket = io('/game');
    const playerListContainer = document.getElementById('playerList');
    const startGameButton = document.getElementById('startGameButton');

    socket.on('playerJoined', ({ playerName }) => {
        console.log(`Player joined: ${playerName}`);
        updatePlayerList(playerName);
    });

    socket.on('enableStartGameButton', () => {
        console.log('Enabling start game button');
        startGameButton.removeAttribute('disabled');
    });

    function updatePlayerList(playerName) {
        const playerListItem = document.createElement('li');
        playerListItem.textContent = playerName;
        playerListContainer.appendChild(playerListItem);
    }

    // Other existing code...
});
