// public/javascripts/lobby.js
document.addEventListener('DOMContentLoaded', () => {
    const lobbyInfoContainer = document.getElementById('lobbyInfo');

    // Pridobite podatke iz URL-ja
    const urlParams = new URLSearchParams(window.location.search);
    const createdBy = urlParams.get('createdBy');
    const gameCode = urlParams.get('gameCode');

    // Prikaz informacij o igri
    displayGameInfo(createdBy, gameCode);

    // Funkcija za prikaz informacij o igri na zaslonu
    function displayGameInfo(createdBy, gameCode) {
        lobbyInfoContainer.innerHTML = `
            <p>Waiting for another player to join...</p>
            <p>Created by: ${createdBy}</p>
            <p>Game Code: ${gameCode}</p>
        `;
    }
});
