document.addEventListener('DOMContentLoaded', () => {
    const createGameForm = document.getElementById('createGameForm');
    const joinGameForm = document.getElementById('joinGameForm');
    const gameInfoContainer = document.getElementById('gameInfo');
    const playerListContainer = document.getElementById('playerList');
    const startGameButton = document.getElementById('startGameButton');
    let createdBy;

    // Initialize the socket connection globally
    const socket = io('/game');

    // Listen for server events
    socket.on('redirectToLobby', ({ createdBy, gameCode }) => {
        console.log(`Received redirectToLobby event for ${createdBy} in game ${gameCode}`);
        // Redirect to the lobby with the necessary parameters
        window.location.href = `/lobby?gameCode=${gameCode}&playerName=${createdBy}`;
    });

    socket.on('playerJoined', ({ playerName }) => {
        console.log(`Player joined: ${playerName}`);
        // Update the player list in the UI
        updatePlayerList(playerName);
    });

    socket.on('enableStartGameButton', () => {
        console.log('Enabling start game button');
        // Enable the start game button in the UI
        startGameButton.removeAttribute('disabled');
    });

    socket.on('startGame', () => {
        console.log('Game starting');
        // Redirect or perform actions when the game starts
        // You can add more logic here based on your requirements
    });

    // Function to update the player list in the UI
    function updatePlayerList(playerName) {
        const playerListItem = document.createElement('li');
        playerListItem.textContent = playerName;
        playerListContainer.appendChild(playerListItem);
    }

    createGameForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        createdBy = document.getElementById('createdBy').value;

        try {
            const response = await fetch('/game/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ createdBy }),
            });

            const data = await response.json();

            if (data.gameCode) {
                console.log('Game created with code:', data.gameCode);

                // Use the global socket connection to emit the event
                socket.emit('createGame', { createdBy, gameCode: data.gameCode });
            } else {
                console.error('Error creating game:', data.error);
            }
        } catch (error) {
            console.error('Error creating game:', error);
        }
    });

    let isJoiningGame = false;

    joinGameForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        if (isJoiningGame) {
            return;
        }

        isJoiningGame = true;

        const gameCodeToJoin = document.getElementById('gameCodeToJoin').value;
        const playerName = document.getElementById('playerNameInput').value;

        try {
            const response = await fetch('/game/join', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ gameCode: gameCodeToJoin, playerName }),
            });

            const data = await response.json();

            if (data.redirectTo) {
                console.log('Joined the game!');

                // Use the global socket connection to emit the event
                socket.emit('joinGame', { playerName, gameCode: gameCodeToJoin });

                window.location.href = data.redirectTo;
            } else {
                console.error('Error joining game:', data.error);
                gameInfoContainer.innerHTML = `<p>Error joining game: ${data.error}</p>`;
            }
        } catch (error) {
            console.error('Error joining game:', error);
        } finally {
            isJoiningGame = false;
        }
    });

    // Add an event listener for the start game button
    startGameButton.addEventListener('click', () => {
        // Send a request to start the game to the server
        socket.emit('startGame', { gameCode: createdBy }); // Assuming createdBy is the game code
    });
});
