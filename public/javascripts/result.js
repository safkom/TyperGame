document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const gameCode = urlParams.get('gameCode');
    const playerName = urlParams.get('playerName');

    async function fetchGameData() {
        try {
            const response = await fetch(`/db?gameCode=${gameCode}`);
            if (!response.ok) {
                throw new Error('Failed to fetch game data');
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching game data:', error);
            return null;
        }
    }

    function displayLobbyInfo(gameData) {
        const winner = gameData.winner;
        const timeTakenByWinner = gameData.timeTakenByWinner;
        const players = gameData.players;
    
        const lobbyContainer = document.getElementById('lobbyContainer');
        lobbyContainer.innerHTML = '';
    
        if (winner) {
            if (winner === playerName) {
                lobbyContainer.innerHTML += '<p>Congratulations! You won!</p>';
                if (timeTakenByWinner) {
                    lobbyContainer.innerHTML += `<p>Your Time Taken: ${formatTime(timeTakenByWinner)}</p>`;
                }
            } else {
                lobbyContainer.innerHTML += `<p>The winner is ${winner}. Better luck next time!</p>`;
                if (timeTakenByWinner) {
                    lobbyContainer.innerHTML += `<p>Winner's Time Taken: ${formatTime(timeTakenByWinner)}</p>`;
                }
            }
        } else {
            lobbyContainer.innerHTML += '<p>Waiting for other player...</p>';
        }
    
        lobbyContainer.innerHTML += '<h2>Players</h2>';
    
        // Check if players array is defined and not empty
        if (Array.isArray(players) && players.length > 0) {
            players.forEach(player => {
                if (player.name !== winner) {
                    lobbyContainer.innerHTML += `<p>Name: ${player.name}</p>`;
                    if (player.timeTaken !== null) {
                        lobbyContainer.innerHTML += `<p>Time Taken: ${formatTime(player.timeTaken)}</p>`;
                    } else {
                        lobbyContainer.innerHTML += '<p>Still playing...</p>';
                    }
                }
            });
        } else {
            lobbyContainer.innerHTML += '<p>No other players in the game.</p>';
        }
    }
    
    // Function to format time from milliseconds to minutes, seconds, and milliseconds
    function formatTime(timeInMs) {
        if (!timeInMs) return 'Not available';

        const minutes = Math.floor(timeInMs / 60000);
        const seconds = Math.floor((timeInMs % 60000) / 1000);
        const milliseconds = Math.floor(timeInMs % 1000);

        if (minutes === 0) {
            return `${seconds} seconds, ${milliseconds} milliseconds`;
        } else {
            return `${minutes} minutes, ${seconds} seconds, ${milliseconds} milliseconds`;
        }
    }

    const gameData = await fetchGameData();
    setInterval(displayLobbyInfo(gameData), 1000);

    indexPageButton.addEventListener('click', () => {
        window.location.href = '/';
    });
});
