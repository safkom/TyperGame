document.addEventListener('DOMContentLoaded', () => {
    const socket = io('/game');
    const playerListContainer = document.getElementById('playerList');
    const startGameButton = document.getElementById('startGameButton');
    const gameCodeInput = document.getElementById('gameCode');
    const playerNameInput = document.getElementById('playerName');

    // Function to fetch updated player list from the server
    function fetchUpdatedPlayerList() {
        const gameCode = gameCodeInput.textContent;

        // Perform an AJAX request to fetch player names and game status
        const xhr = new XMLHttpRequest();
        xhr.open('GET', `/game/players?gameCode=${gameCode}`, true);
        xhr.onreadystatechange = function () {
            if (xhr.readyState === XMLHttpRequest.DONE) {
                if (xhr.status === 200) {
                    const response = JSON.parse(xhr.responseText);
                    if (response && response.players) {
                        updatePlayerList(response.players, response.gameStarted);
                    }
                } else {
                    console.error('Error fetching player list:', xhr.status);
                }
            }
        };
        xhr.send();
    }


    // Function to update the player list in the UI
    function updatePlayerList(players, gameStarted) {
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

        if(players.length === 2) {
            //remove disabled
            startGameButton.removeAttribute('disabled');
        }

        // Check if the game has started and redirect if it has
        if (gameStarted) {
            const gameCode = gameCodeInput.textContent;
            window.location.href = `/game?gameCode=${encodeURIComponent(gameCode)}&playerName=${encodeURIComponent(currentPlayerName)}`;
        }
        
    }

    // Fetch updated player list periodically (every 5 seconds)
    setInterval(fetchUpdatedPlayerList, 500);

    startGameButton.addEventListener('click', () => {
        console.log('Starting game');
        // Perform an AJAX request to inform the server about the game start
        const xhr = new XMLHttpRequest();
        xhr.open('POST', '/game/start', true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.onreadystatechange = function () {
            if (xhr.readyState === XMLHttpRequest.DONE) {
                if (xhr.status === 200) {
                    // If the request is successful, check if the game has started
                    const response = JSON.parse(xhr.responseText);
                    if (!response.gameStarted) {
                        // If the game has started, redirect both players to the game page
                        console.error('Game start request was not successful');
                    }
                } else {
                    console.error('Error starting game:', xhr.status);
                }
            }
        };
        xhr.send(JSON.stringify({ gameCode: gameCodeInput.textContent }));
    });
});