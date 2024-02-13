document.addEventListener('DOMContentLoaded', () => {
    const playerListContainer = document.getElementById('playerList');
    const startGameButton = document.getElementById('startGameButton');
    const gameCodeInput = document.getElementById('gameCode');
    const playerNameInput = document.getElementById('playerName');

    // Function to fetch updated player list from the server
    function fetchUpdatedPlayerList() {
        const gameCode = gameCodeInput.textContent;

        // Perform an AJAX request to fetch player names
        const xhr = new XMLHttpRequest();
        xhr.open('GET', `/game/players?gameCode=${gameCode}`, true);
        xhr.onreadystatechange = function () {
            if (xhr.readyState === XMLHttpRequest.DONE) {
                if (xhr.status === 200) {
                    const response = JSON.parse(xhr.responseText);
                    if (response && response.players) {
                        updatePlayerList(response.players);
                    }
                } else {
                    console.error('Error fetching player list:', xhr.status);
                }
            }
        };
        xhr.send();
    }

    // Function to update the player list in the UI
    function updatePlayerList(players) {
        const currentPlayerName = playerNameInput.value;
        playerListContainer.innerHTML = ''; // Clear the current player list
        players.forEach(player => {
            const playerListItem = document.createElement('li');
            playerListItem.textContent = player.name;
            if (player.name === currentPlayerName) {
                playerListItem.classList.add('current-player');
            }
            playerListContainer.appendChild(playerListItem);
        });
    }

    // Fetch updated player list periodically (every 5 seconds)
    setInterval(fetchUpdatedPlayerList, 500);
});
