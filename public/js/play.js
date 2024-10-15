function handleClick() {
    const box = document.querySelector('.box');
    const newBox = document.querySelector('.board');
    const you = document.querySelector('.you');
    const opponent = document.querySelector('.opponent');

    // Fade out the box
    box.style.opacity = "0";

    // Wait for the fade-out transition to complete, then hide the box and show the new box
    setTimeout(() => {
        box.style.display = "none"; // Hide the old box
        newBox.style.display = "flex"; // Make the new box visible

        // Check if the viewport width is greater than 768px (tablet and up)
        if (window.innerWidth > 768) {
            you.style.display = "flex"; // Show the "you" component
            opponent.style.display = "flex"; // Show the "opponent" component
            you.style.opacity = "1"; // Set opacity to 1
            opponent.style.opacity = "1"; // Set opacity to 1
        }

        // Fade in the new box
        setTimeout(() => {
            newBox.style.opacity = "1"; // Fade in the new box
        }, 100); // A small delay to allow for the display change before fade-in
    }, 1000); // Wait 1 second for the fade-out transition to finish
}


let gen;
let uname;

document.addEventListener('DOMContentLoaded', () => {
    fetch('/api/gender')
      .then(response => response.json())
      .then(data => {
        gen = data.gender;
        const av = document.getElementById('avatar');
        if(gen === 'male'){
            av.src = 'images/male.jpg';
        }
        else if(gen === 'female'){
            av.src = 'images/female.jpg';
        }
        else if(gen === null){
            av.src = 'images/default.png';
        }
      })

      fetch('/api/u_name')
      .then(response => response.json())
      .then(data => {
        uname = data.u_name;
        const p1 = document.getElementById('p1');
        if(uname === null){
            p1.innerHTML = "Player";
        }
        else{
            p1.innerHTML = uname;
        }
      })
      .catch(error => console.error('Error fetching constant:', error));
  });








// game logic


let currentPlayer; // Current player ('X' for user, 'O' for computer)
let gameActive; // Flag to check if the game is ongoing
let board; // Game board

// Winning combinations
const winningCombinations = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
];

// Initialize game on page load
document.addEventListener('DOMContentLoaded', startGame);

function startGame() {
    currentPlayer = 'X'; // User starts first
    gameActive = true; // Game is active
    board = ['', '', '', '', '', '', '', '', '']; // Reset the board

    // Clear the UI
    for (let i = 1; i <= 9; i++) {
        const cell = document.getElementById(i);
        cell.textContent = ''; // Clear each cell
        cell.style.pointerEvents = 'auto'; // Re-enable all cells
        cell.addEventListener('click', () => handleCellClick(i - 1), { once: true });
    }
}

// Handle cell click event
function handleCellClick(index) {
    if (!gameActive || board[index]) return;

    // Update the board and UI
    board[index] = currentPlayer;
    document.getElementById(index + 1).textContent = currentPlayer; // Use IDs 1 to 9
    document.getElementById(index + 1).style.fontFamily = 'Orbitron';
    document.getElementById(index + 1).style.fontSize = '70%'; // Adjust font size to 70% of cell height
    checkResult();

    // Switch player to computer after user move
    if (gameActive) {
        currentPlayer = 'O'; // Switch to computer
        setTimeout(computerMove, 1000); // Computer moves after 1 second
    }
}

// Computer's move using improved logic
function computerMove() {
    // Disable user interaction while the computer is playing
    for (let i = 1; i <= 9; i++) {
        document.getElementById(i).style.pointerEvents = 'none';
    }

    // Find the best move using strategic play
    const bestMove = findBestMove();
    board[bestMove] = currentPlayer;

    // Fill the cell and then display the result
    document.getElementById(bestMove + 1).textContent = currentPlayer; // Use IDs 1 to 9
    document.getElementById(bestMove + 1).style.fontFamily = 'Orbitron';
    document.getElementById(bestMove + 1).style.fontSize = '70%'; // Adjust font size to 70% of cell height

    // Check result after placing O
    checkResult();

    // Switch back to user
    currentPlayer = 'X'; // Switch to user
    for (let i = 1; i <= 9; i++) {
        document.getElementById(i).style.pointerEvents = 'auto'; // Re-enable user interaction
    }
}

// Check the game result
function checkResult() {
    for (let combo of winningCombinations) {
        const [a, b, c] = combo;
        if (board[a] && board[a] === board[b] && board[a] === board[c]) {
            displayPopup(`${board[a]} wins!`);
            gameActive = false;
            return;
        }
    }
    if (!board.includes('')) {
        displayPopup("It's a draw!");
        gameActive = false;
    }
}

// Minimax algorithm to find the best move for the computer
function findBestMove() {
    // Check for winning move
    for (let i = 0; i < board.length; i++) {
        if (board[i] === '') {
            board[i] = 'O'; // Try the move
            if (checkWin() === 'O') {
                board[i] = ''; // Undo the move
                return i; // Return winning move
            }
            board[i] = ''; // Undo the move
        }
    }

    // Block opponent's winning move
    for (let i = 0; i < board.length; i++) {
        if (board[i] === '') {
            board[i] = 'X'; // Try the move
            if (checkWin() === 'X') {
                board[i] = ''; // Undo the move
                return i; // Return blocking move
            }
            board[i] = ''; // Undo the move
        }
    }

    // If no immediate win/block, pick random available spot
    const availableMoves = board.map((cell, index) => cell === '' ? index : null).filter(val => val !== null);
    return availableMoves[Math.floor(Math.random() * availableMoves.length)];
}

// Function to check the current win status
function checkWin() {
    for (let combo of winningCombinations) {
        const [a, b, c] = combo;
        if (board[a] && board[a] === board[b] && board[a] === board[c]) {
            return board[a]; // Return the winner ('X' or 'O')
        }
    }
    return null; // No winner yet
}

// Display popup with the result and options
function displayPopup(message) {
    const popup = document.createElement('div');
    popup.className = 'popup';
    popup.innerHTML = `
        <p>${message}</p>
        <button id="playAgain">Play Again</button>
        <button id="quit">Quit</button>
    `;
    document.body.appendChild(popup);

    // Play Again button functionality
    document.getElementById('playAgain').addEventListener('click', () => {
        document.body.removeChild(popup);
        startGame(); // Restart the game
    });

    // Quit button functionality
    document.getElementById('quit').addEventListener('click', () => {
        window.location.href = '/play'; // Redirect to the play route
    });
}

