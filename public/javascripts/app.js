document.addEventListener('DOMContentLoaded', () => {
    const createGameForm = document.getElementById('createGameForm');
    const joinGameForm = document.getElementById('joinGameForm');
    const gameInfoContainer = document.getElementById('gameInfo');
    const playerListContainer = document.getElementById('playerList');
    const startGameButton = document.getElementById('startGameButton');
    let createdBy;
    const errorBox = document.getElementById('errorBox');

    // Initialize the socket connection globally
    const socket = io('/game');
    

    // Listen for server events
    socket.on('redirectToLobby', ({ createdBy, gameCode }) => {
        console.log(`Received redirectToLobby event for ${createdBy} in game ${gameCode}`);
        // Redirect to the lobby with the necessary parameters
        window.location.href = `/lobby?gameCode=${gameCode}&playerName=${createdBy}`;
    });

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
            } else if (data.error === 'Lobby is full') { // Check if the error is "Lobby is full"
                console.error('Error joining game:', data.error);
                const message = 'Lobby is full!';
                showError(message);
            } else {
                console.error('Error joining game:', data.error);
                const message = 'Error joining game' + data.error;
                showError(message);
            }
        } catch (error) {
            console.error('Error joining game:', error);
            message = 'Error joining game' + error;
            showError(message);
        } finally {
            isJoiningGame = false;
        }
    });

    // Add an event listener for the start game button
    startGameButton.addEventListener('click', () => {
        // Send a request to start the game to the server
        socket.emit('startGame', { gameCode: createdBy }); // Assuming createdBy is the game code
    });

    // Function to show the error box with the given message
    function showError(message) {
        console.log('Box shown.');
        errorBox.textContent = message;
        errorBox.style.display = 'block';
        setTimeout(() => {
            errorBox.style.display = 'none';
        }, 5000);
    }
});
