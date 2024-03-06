document.addEventListener('DOMContentLoaded', () => {
    const wordListContainer = document.getElementById('wordList');
    const inputWord = document.getElementById('inputWord');
    let currentWordIndex = 0;
    let words = 0;
    let startTime = Date.now();

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
    let currentAudio = null; // Track the currently playing audio

    // Function to play a sound
    function playSound(soundUrl) {
        if (currentAudio) {
            currentAudio.pause(); // Pause the currently playing audio
        }
        
        currentAudio = new Audio(soundUrl);
        currentAudio.play();
    }

    // Fetch words when the page loads
    const gameCode = getGameCodeFromUrl();

    // Add event listener to the input field
    // Add event listener to the input field
    inputWord.addEventListener('input', () => {
        const typedWord = inputWord.value.trim();
        const currentWordElement = wordListContainer.children[currentWordIndex];
        const currentWord = currentWordElement.textContent.trim();
    
        let correctLetters = 0;
    
        for (let i = 0; i < typedWord.length; i++) {
            if (typedWord[i] === currentWord[i]) {
                correctLetters++;
            } else {
                // Apply error style if a letter is wrong
                currentWordElement.classList.add('error');
                currentWordElement.classList.remove('correct');
                return; // Exit the loop if there's an error
            }
        }
    
        // Remove error style if all letters are correct
        currentWordElement.classList.remove('error');
    
        // Apply correct style if all letters are typed correctly
        if (correctLetters === currentWord.length) {
            currentWordElement.classList.add('correct');
        } else {
            currentWordElement.classList.remove('correct');
        }
    
        // Check if the whole word is typed correctly
        if (typedWord === currentWord) {
            // Clear the input field
            inputWord.value = '';
            
            playSound('typing.mp3');
    
            // Move to the next word
            currentWordIndex++;
            if(currentWordIndex < wordListContainer.children.length){
                highlightCurrentWord(currentWordIndex);
            }
    
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
    

    function highlightCurrentWord(index) {
        // Remove the 'current-word' class from all words
        wordListContainer.querySelectorAll('.word').forEach(word => {
            word.classList.remove('current-word');
        });
        // Add the 'current-word' class to the current word
        const currentWordElement = wordListContainer.children[index];
        currentWordElement.classList.add('current-word');
    }


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
        let gamesWon = getCookie("gamesWon");
        gamesWon = gamesWon + 1;

        setCookie("gamesWon", gamesWon, 365);

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
                    timeTaken,
                    gamesWon
                })
            });
    
            if (!response.ok) {
                throw new Error('Failed to enter winner data');
            }
    
            console.log('Winner data saved:', playerName, timeTaken, gamesWon);
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
                let progress = (player.wordsCompleted / totalWords) * 100; // Calculate progress percentage
                if (progress >= 100) {
                    progress = 100; // Ensure progress is capped at 100%
                }
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
                //if the player is the current player, show this player's image
                if (player.name === playerName) {
                    const playerImage = document.getElementById(playerName);
                    playerImage.src = 'img/thisPlayer.jpg';
                }
                else {
                    const playerImage = document.getElementById(player.name);
                    playerImage.src = 'img/otherPlayer.jpg';
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
