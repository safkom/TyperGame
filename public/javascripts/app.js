// public/js/app.js
document.addEventListener('DOMContentLoaded', async () => {
    const createGameForm = document.getElementById('createGameForm');
    const gameInfoContainer = document.getElementById('gameInfo');

    createGameForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const createdBy = document.getElementById('createdBy').value;

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

                // Posodobitev prikaza informacij o igri
                gameInfoContainer.innerHTML = `
                    <p>Game Code: ${data.gameCode}</p>
                    <p>Created by: ${data.createdBy}</p>
                    <p>Waiting for players...</p>
                `;
            } else {
                console.error('Error creating game:', data.error);
            }
        } catch (error) {
            console.error('Error creating game:', error);
        }
    });
});

    socket.on('gameCreated', ({ createdBy, gameCode }) => {
        displayGameInfo(createdBy, gameCode, gameInfoContainer);
    });

    // Funkcija za prikaz informacij o igri na zaslonu
    function displayGameInfo(createdBy, gameCode, container) {
        if (createdBy && gameCode) {
            container.innerHTML = `
                <p>Waiting for another player to join...</p>
                <p>Created by: ${createdBy}</p>
                <p>Game Code: ${gameCode}</p>
            `;
        } else {
            console.error('Invalid data received for game info:', { createdBy, gameCode });
        }
    }

    // Funkcija za prikaz informacij o pridružitvi igri na zaslonu
    function displayJoinGameInfo(joinedBy, gameCode, container) {
        if (joinedBy && gameCode) {
            container.innerHTML = `
                <p>Joined the game!</p>
                <p>Joined by: ${joinedBy}</p>
                <p>Game Code: ${gameCode}</p>
            `;
        } else {
            console.error('Invalid data received for join game info:', { joinedBy, gameCode });
        }
    }
});
