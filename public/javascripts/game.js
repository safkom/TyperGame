document.addEventListener('DOMContentLoaded', () => {
    const wordListContainer = document.getElementById('wordList');
    const inputWord = document.getElementById('inputWord');
    let currentWordIndex = 0;
    let words = 0;
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
                        words = response.words; // Update the words
                        displayWords(words);
                    }
                } else {
                    console.error('Error fetching words:', xhr.status);
                }
            }
        };
        xhr.send();
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
    // Add event listener to the input field
inputWord.addEventListener('input', () => {
    const typedWord = inputWord.value.trim();
    const currentWordElement = wordListContainer.children[currentWordIndex];

    if (typedWord === currentWordElement.textContent.trim()) {
        // Clear the input field
        inputWord.value = '';

        // Apply animation class
        currentWordElement.classList.add('correct', 'blow-up');

        // Move to the next word
        currentWordIndex++;

        // Enter completed word
        enterWords(gameCode, getName(), currentWordIndex);

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

    async function updateProgressBars(game) {
        const playerName = getName();
        const progressBarContainer = document.getElementById('progressBars');
    
        if (game && game.players && playerName) {
            const totalWords = game.words.length;
    
            game.players.forEach(player => {
                const progress = (player.wordsCompleted / totalWords) * 100; // Calculate progress percentage
                const progressBarId = `progressBar-${player.name}`;
                const progressBar = document.getElementById(progressBarId);
    
                if (progressBar) {
                    // Update progress bar width
                    progressBar.style.width = `${progress}%`;
    
                    // Update progress label
                    const progressLabelId = `progressLabel-${player.name}`;
                    const progressLabel = document.getElementById(progressLabelId);
                    if (progressLabel) {
                        progressLabel.textContent = `${Math.round(progress)}%`;
                    }
                }
            });
        }
    }    
    

    async function enterWords(gameCode, playerName, currentWordIndex) {
        try {
            // Update the game with the winner and time taken
            const response = await fetch('/words', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    gameCode,
                    playerName,
                    wordsCompleted: currentWordIndex,
                })
            });
    
            if (!response.ok) {
                throw new Error('Failed to enter data');
            }
    
            console.log('Data saved:', playerName, currentWordIndex);
    
        } catch (error) {
            console.error('Error entering data:', error);
        }
    }
    

    async function fetchData(gameCode) {
        try {
            const response = await fetch(`/db?gameCode=${gameCode}`);
    
            if (!response.ok) {
                throw new Error('Failed to fetch game');
            }
            const game = await response.json();
            
            updateProgressBars(game);
            
        } catch (error) {
            console.error('Error fetching game:', error);
        }
    } 
    
    //fetch data frequently
    setInterval(() => {
        const gameCode = getGameCodeFromUrl();
        if (gameCode) {
            fetchData(gameCode);
        }
    }, 100);
});
