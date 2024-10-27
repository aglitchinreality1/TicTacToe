

function handleClick() {
    const box = document.querySelector('.box');
    const newBox = document.querySelector('.board');
    const you = document.querySelector('.you');
    const opponent = document.querySelector('.opponent');
    const mobile = document.querySelector('.mobile');

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
            mobile.style.display = "none";
        }
        else{
            you.style.display = "none"; 
            opponent.style.display = "none";
            you.style.opacity = "0"; 
            opponent.style.opacity = "0";
            mobile.style.display = "flex"; 
        }

        // Fade in the new box
        setTimeout(() => {
            newBox.style.opacity = "1"; // Fade in the new box
            if (window.innerWidth > 768) {
                you.style.opacity = "1"; 
                opponent.style.opacity = "1";
            }
            else{
                mobile.style.opacity = "1";
            }
        }, 100); // A small delay to allow for the display change before fade-in
    }, 1000); // Wait 1 second for the fade-out transition to finish
}


let gen;
let uname;

document.addEventListener('DOMContentLoaded', () => {
    fetch('/api/user')
      .then(response => response.json())
      .then(data => {
        gen = data.gender;
        const av = document.getElementById('avatar');
        const av2 = document.getElementById('av2');
        if(gen === 'male'){
            av.src = 'images/male.jpg';
            av2.src = 'images/male.jpg';
        }
        else if(gen === 'female'){
            av.src = 'images/female.jpg';
            av2.src = 'images/female.jpg';
        }
        else if(gen === null){
            av.src = 'images/default.png';
            av2.src = 'images/default.png';
        }
        displayData('p1',data.name);
      })
  });

  function displayData(id, value) {
    const element = document.getElementById(id);
    if (element) {
        element.textContent = value;
    } else {
        console.error(`Element with id ${id} not found.`);
    }
}




// game logic
let currentPlayer;
let gameActive;
let board;

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

document.addEventListener('DOMContentLoaded', startGame);

function startGame() {
    currentPlayer = 'X';
    gameActive = true;
    board = ['', '', '', '', '', '', '', '', ''];
    setTurnIndicator();

    for (let i = 1; i <= 9; i++) {
        const cell = document.getElementById(i);
        cell.textContent = '';
        cell.style.pointerEvents = 'auto';
        cell.addEventListener('click', () => handleCellClick(i - 1), { once: true });
    }
}

function handleCellClick(index) {
    if (!gameActive || board[index]) return;

    board[index] = currentPlayer;
    document.getElementById(index + 1).textContent = currentPlayer;
    document.getElementById(index + 1).style.fontFamily = 'Orbitron';
    document.getElementById(index + 1).style.fontSize = '70%';
    checkResult();

    if (gameActive) {
        currentPlayer = 'O';
        setTurnIndicator();
        disableClicks();
        setTimeout(computerMove, 1000);
    }
}
function computerMove() {
    const bestMove = findBestMove();
    board[bestMove] = currentPlayer;

    // Place the 'O' in the UI
    document.getElementById(bestMove + 1).textContent = currentPlayer;
    document.getElementById(bestMove + 1).style.fontFamily = 'Orbitron';
    document.getElementById(bestMove + 1).style.fontSize = '70%';

    // Check result after placing 'O'
    setTimeout(() => {
        checkResult();

        if (gameActive) {
            currentPlayer = 'X';
            setTurnIndicator();
            enableClicks();
        }
    }, 500); 
}

// Call sendResultToServer inside checkResult when the game ends
function checkResult() {
    for (let combo of winningCombinations) {
        const [a, b, c] = combo;
        if (board[a] && board[a] === board[b] && board[a] === board[c]) {
            const result = board[a] === 'X' ? "WIN" : "LOST";
            if(board[a]==='X'){
                sendGameResult('win');
            }
            else if(board[a]==='O'){
                sendGameResult('lost');
            }
            displayPopup(result === "WIN" ? "YOU WIN :)" : "COMPUTER WINS :(");
            gameActive = false;
            return;
        }
    }
    if (!board.includes('')) {
        sendGameResult('draw');
        displayPopup("DRAW :|");
        gameActive = false;
    }
}



function setTurnIndicator() {
    const playerTurn = document.getElementById('pturn');
    const computerTurn = document.getElementById('comturn');
    if (currentPlayer === 'X') {
        playerTurn.style.opacity = "1";
        computerTurn.style.opacity = "0";
    } else {
        playerTurn.style.opacity = "0";
        computerTurn.style.opacity = "1";
    }
}

function disableClicks() {
    for (let i = 1; i <= 9; i++) {
        document.getElementById(i).style.pointerEvents = 'none';
    }
}

function enableClicks() {
    for (let i = 1; i <= 9; i++) {
        if (!board[i - 1]) {
            document.getElementById(i).style.pointerEvents = 'auto';
        }
    }
}

function findBestMove() {
    for (let i = 0; i < board.length; i++) {
        if (board[i] === '') {
            board[i] = 'O';
            if (checkWin() === 'O') {
                board[i] = '';
                return i;
            }
            board[i] = '';
        }
    }

    for (let i = 0; i < board.length; i++) {
        if (board[i] === '') {
            board[i] = 'X';
            if (checkWin() === 'X') {
                board[i] = '';
                return i;
            }
            board[i] = '';
        }
    }

    const availableMoves = board.map((cell, index) => cell === '' ? index : null).filter(val => val !== null);
    return availableMoves[Math.floor(Math.random() * availableMoves.length)];
}

function checkWin() {
    for (let combo of winningCombinations) {
        const [a, b, c] = combo;
        if (board[a] && board[a] === board[b] && board[a] === board[c]) {
            setInterval(2);
            return board[a];
        }
    }
    return null;
}



// Display popup with the result and options
function displayPopup(message) {
    const popup = document.createElement('div');
    popup.className = 'winner col-12';
    popup.innerHTML = `
        <div class="message col-sm-4 col-11 row">
            <h1 class="wh">${message}</h1>
            <div class="buttons col-12">
                <button class="bt col-5" id="playAgain">Play Again</button>
                <button class="bt col-5" id="quit">Quit</button>
            </div>
        </div>
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

// This function is called when the game ends and the result is determined
function sendGameResult(result) {
    const data = { result };

    fetch('/update-game-result', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data) // Ensure it's a JSON string
    })
    .then(response => response.json())
    .then(data => {
        console.log('Success:', data);
    })
    .catch((error) => {
        console.error('Error:', error);
    });
}
