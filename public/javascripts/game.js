document.addEventListener('DOMContentLoaded', () => {
    const wordListContainer = document.getElementById('wordList');
    const inputWord = document.getElementById('inputWord');
    let currentWordIndex = 0;
    let startTime = Date.now();

    // Function to fetch the words from the server
    function fetchWords(gameCode) {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', `/game/words?gameCode=${gameCode}`, true);
        xhr.onreadystatechange = function () {
            if (xhr.readyState === XMLHttpRequest.DONE) {
                if (xhr.status === 200) {
                    const response = JSON.parse(xhr.responseText);
                    if (response && response.words) {
                        displayWords(response.words);
                    }
                } else {
                    console.error('Error fetching words:', xhr.status);
                }
            }
        };
        xhr.send();
    }

    // Function to display the words in the UI
    function displayWords(words) {
        wordListContainer.innerHTML = ''; // Clear the current word list
        words.forEach(word => {
            const wordItem = document.createElement('span');
            wordItem.textContent = word + ' ';
            wordListContainer.appendChild(wordItem);
        });
    }

    // Function to get the value of the gameCode query parameter from the URL
    function getGameCodeFromUrl() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('gameCode');
    }

    function getName(){
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('playerName');
    }

    function updateStopwatch() {
        const currentTime = Date.now();
        return currentTime - startTime;
    }

    // Fetch words when the page loads
    const gameCode = getGameCodeFromUrl();
    if (gameCode) {
        fetchWords(gameCode);
    } else {
        console.error('Game code not found in URL');
    }

    // Add event listener to the input field
    inputWord.addEventListener('input', () => {
        const typedWord = inputWord.value.trim();
        const currentWord = wordListContainer.children[currentWordIndex].textContent.trim();

        if (typedWord === currentWord) {
            // Clear the input field
            inputWord.value = '';
            // Color the word green
            wordListContainer.children[currentWordIndex].classList.add('correct');
            // Move to the next word
            currentWordIndex++;

            // Check if all words are correct
            if (currentWordIndex === wordListContainer.children.length) {
                // All words are correct, check if there is a winner
                const playerName = getName();
                const timeTaken = updateStopwatch(); // Calculate elapsed time
                checkWinner(gameCode, playerName, timeTaken);
            }
        }
    });

    async function checkWinner(gameCode, playerName, timeTaken) {
        try {
            // Fetch the game from the server
            const response = await fetch(`/db/?gameCode=${gameCode}`);
            if (!response.ok) {
                throw new Error('Failed to fetch game');
            }
            const game = await response.json();

            if (game.winner === null && game.timeTakenByWinner === null) {
                // If no winner, enter winner data into the database
                enterWinnerData(gameCode, playerName, timeTaken);
                window.location.href = `/result?gameCode=${gameCode}&playerName=${playerName}`;
            } else {
                console.log('Winner exists');
                enterData(gameCode, playerName, timeTaken);
                window.location.href = `/result?gameCode=${gameCode}&playerName=${playerName}`;
            }

        } catch (error) {
            console.error('Error checking winner:', error);
        }
    }

    async function enterWinnerData(gameCode, playerName, timeTaken) {
        try {
            // Update the game with the winner and time taken
            const response = await fetch('/winner', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    gameCode,
                    playerName,
                    timeTaken
                })
            });
    
            if (!response.ok) {
                throw new Error('Failed to enter winner data');
            }
    
            console.log('Winner data saved:', playerName, timeTaken);
            // Redirect to the result page
            // window.location.href = `/result?gameCode=${gameCode}`;
    
        } catch (error) {
            console.error('Error entering winner data:', error);
        }
    }

    async function enterData(gameCode, playerName, timeTaken) {
        try {
            // Update the game with the winner and time taken
            const response = await fetch('/data', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    gameCode,
                    playerName,
                    timeTaken
                })
            });
    
            if (!response.ok) {
                throw new Error('Failed to enter winner data');
            }
    
            console.log('Winner data saved:', playerName, timeTaken);
            // Redirect to the result page
            // window.location.href = `/result?gameCode=${gameCode}`;
    
        } catch (error) {
            console.error('Error entering winner data:', error);
        }
    }
    
});
