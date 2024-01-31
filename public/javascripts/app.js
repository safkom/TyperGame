document.addEventListener('DOMContentLoaded', async () => {
    const createGameForm = document.getElementById('createGameForm');
    const joinGameForm = document.getElementById('joinGameForm');
    const gameInfoContainer = document.getElementById('gameInfo');

    let createdBy; // Declare createdBy outside the event listeners

    createGameForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        createdBy = document.getElementById('createdBy').value;

        try {
            const response = await fetch('/game/create', {
                method: 'POST', // Change the method to POST
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ createdBy }),
            });

            const data = await response.json();

            if (data.gameCode) {
                console.log('Game created with code:', data.gameCode);

                // Redirect to the lobby
                window.location.href = `/lobby?createdBy=${createdBy}&gameCode=${data.gameCode}`;
            } else {
                console.error('Error creating game:', data.error);
            }
        } catch (error) {
            console.error('Error creating game:', error);
        }
    });

    joinGameForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const gameCodeToJoin = document.getElementById('gameCodeToJoin').value;
        const createdBy = document.getElementById('createdBy').value;

        try {
            const response = await fetch('/game/join', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ gameCode: gameCodeToJoin, playerName: createdBy }),
            });

            const data = await response.json();

            if (data.redirectTo) {
                console.log('Joined the game!');
                window.location.href = data.redirectTo;
                // Emit 'playerJoinGame' event to inform the server about the new player
                const socket = io();
                socket.emit('playerJoinGame', { playerName: createdBy, gameCode: gameCodeToJoin });
            } else {
                console.error('Error joining game:', data.error);
                // Handle the case where the lobby code is incorrect or doesn't exist
                gameInfoContainer.innerHTML = `<p>Error joining game: ${data.error}</p>`;
            }
        } catch (error) {
            console.error('Error joining game:', error);
        }
    });
});
