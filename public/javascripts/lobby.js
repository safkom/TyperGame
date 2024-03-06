document.addEventListener('DOMContentLoaded', () => {
    const socket = io('/game');
    const playerListContainer = document.getElementById('playerList');
    const startGameButton = document.getElementById('startGameButton');
    const gameCodeInput = document.getElementById('gameCode');
    const playerNameInput = document.getElementById('playerName');


    //check if cookie gamesWon exists
    if (getCookie("gamesWon") === "") {
        //if not, set cookie gamesWon to 0
        setCookie("gamesWon", 0, 365);
    }
    const gamesWon = getCookie("gamesWon");
    const currentPlayerName = playerNameInput.value;
    const gameCode = gameCodeInput.textContent;
    enterGamesWon(gameCode, currentPlayerName, gamesWon);

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

    function getCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
        return "";
    }

    function setCookie(name, value, days) {
        const date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        const expires = `expires=${date.toUTCString()}`;
        document.cookie = `${name}=${value};${expires};path=/`;
    }



    async function enterGamesWon(gameCode, playerName, gamesWon) {
        try {
            // Update the game with the winner and time taken
            const response = await fetch('/gamesWon', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    gameCode,
                    playerName,
                    gamesWon
                })
            });
    
            if (!response.ok) {
                throw new Error('Failed to enter winner data');
            }
    
            console.log('Win data saved:', playerName, gamesWon);
            // Redirect to the result page
            // window.location.href = `/result?gameCode=${gameCode}`;
    
        } catch (error) {
            console.error('Error entering winner data:', error);
        }
    }


    // Function to update the player list in the UI
    function updatePlayerList(players, gameStarted) {
        const currentPlayerName = playerNameInput.value;
        playerListContainer.innerHTML = ''; // Clear the current player list
        players.forEach(player => {
            const playerContainer = document.createElement('div');
            playerContainer.classList.add('player-container');
      
            const playerImage = document.createElement('img');
            playerImage.classList.add('player-image');
            if (player.name === currentPlayerName) {
            playerImage.src = 'img/thisPlayer.jpg';
            }
            else {
            playerImage.src = 'img/otherPlayer.jpg';
            }
            playerContainer.appendChild(playerImage);

            const playerName = document.createElement('div');
            playerName.classList.add('player-name');
            playerName.textContent = player.name;
            playerContainer.appendChild(playerName);

            const gamesWon = document.createElement('div');
            gamesWon.style = ('margin-left: auto;');
            gamesWon.textContent = "Games won: ";
            gamesWon.textContent += player.gamesWon;
            playerContainer.appendChild(gamesWon);

      
            playerListContainer.appendChild(playerContainer);
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