document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const gameCode = urlParams.get('gameCode');
    const playerName = urlParams.get('playerName');
    let audioPlayed = false;

    function playAudio(url, boolWinner) {
        if (!audioPlayed) {
            const audio = new Audio(url);
            audio.play()
                .then(() => {
                    console.log('Audio played successfully');
                    audioPlayed = true;
                    fadeInImage(boolWinner);
                    setTimeout(fadeOutImage, 1000);
                })
                .catch(error => {
                    console.error('Error playing audio:', error);
                });
        }
    }

    function fadeInImage(boolWinner) {
        // Show the overlay by adding the 'show' class
        document.getElementById('overlay').classList.add('show');
        //set background image
        if(boolWinner == 1) {
            document.getElementById('overlay').style.backgroundImage = "url('img/check.png')";
            document.getElementById('overlay').style.backgroundSize = "contain";
        }
        else {
            document.getElementById('overlay').style.backgroundImage = "url('img/x.png')";
            //fit image to screen and stretch to fit
            document.getElementById('overlay').style.backgroundSize = "contain";
        }
    }
    
    function fadeOutImage() {
        // Hide the overlay by removing the 'show' class
        document.getElementById('overlay').classList.remove('show');
        const element = document.getElementById("overlay");
        setInterval(element.remove(), 1000);
    }

    async function fetchGameData() {
        try {
            const response = await fetch(`/db?gameCode=${gameCode}`);
            if (!response.ok) {
                throw new Error('Failed to fetch game data');
            }
            displayLobbyInfo(await response.json());
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
                lobbyContainer.innerHTML += `
                    <div class="winner-info">
                        <p>Congratulations! You won! 🥇</p>
                        ${timeTakenByWinner ? `<p>Your Time Taken: ${formatTime(timeTakenByWinner)}</p>` : ''}
                        <p>This was now your ${players.find(player => player.name === winner).gamesWon} win(s)</p>
                    </div>
                `;
                playAudio('success.mp3', 1);
            } else {
                lobbyContainer.innerHTML += `
                    <div class="loser-info">
                        <p>The winner is ${winner}. Better luck next time! ❌</p>
                        ${timeTakenByWinner ? `<p>Winner's Time Taken: ${formatTime(timeTakenByWinner)}</p>` : ''}
                        <p>${winner} has won ${players.find(player => player.name === winner).gamesWon} time(s)</p>
                    </div>
                `;
                playAudio('buzzer.mp3', 0);
            }
        } else {
            lobbyContainer.innerHTML += '<p>Waiting for other players...</p>';
        }
    
        lobbyContainer.innerHTML += '<h2>Players</h2>';
        const playersList = document.createElement('div');
        playersList.classList.add('players-list');
    
        // Check if players array is defined and not empty
        if (Array.isArray(players) && players.length > 0) {
            players.forEach(player => {
                if (player.name !== winner) {
                    const playerInfo = document.createElement('div');
                    playerInfo.classList.add('player-info');
                    playerInfo.innerHTML = `
                        <p class="player-name">Name: ${player.name}</p>
                        ${player.timeTaken !== null ? `<p class="time-taken">Time Taken: ${formatTime(player.timeTaken)}</p>` : `<p class="time-taken">Still playing...</p>`}
                    `;
                    playersList.appendChild(playerInfo);
                }
            });
        } else {
            const noPlayersInfo = document.createElement('p');
            noPlayersInfo.textContent = 'No other players in the game.';
            playersList.appendChild(noPlayersInfo);
        }
    
        lobbyContainer.appendChild(playersList);
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

    setInterval(fetchGameData, 100); // Corrected setInterval usage

    const indexPageButton = document.getElementById('indexPageButton'); // Define indexPageButton
    indexPageButton.addEventListener('click', () => {
        window.location.href = '/';
    });
});
