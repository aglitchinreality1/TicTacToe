// const cells = document.querySelectorAll('.cell');
// let currentPlayer = 'X';  // This should change based on the player's role (e.g., fetched from the server)

// // Get the room code from the URL path
// const roomCode = window.location.pathname.split('/').pop();

// // Get player and image elements
// const p1 = document.getElementById('p1');
// const p2 = document.getElementById('p2');
// const xpl = document.getElementById('xpl');
// const opl = document.getElementById('opl');
// const xpm = document.getElementById('xpm');
// const opm = document.getElementById('opm');

// // Initialize socket connection
// const socket = io();

// socket.emit('joinRoom', roomCode);

// // Fetch room details and update UI
// fetch(`/api/${roomCode}/details`)
//     .then(response => response.json())
//     .then(data => {
//         p1.innerText = data.xname;
//         p2.innerText = data.oname;
//         updatePlayerImages(data.xgender, data.ogender);
//     })
//     .catch(error => console.error('Error fetching room details:', error));

// // Update player images based on gender
// function updatePlayerImages(xgender, ogender) {
//     const setImage = (gender, element) => {
//         if (gender === 'male') {
//             element.src = 'images/male.jpg';
//         } else if (gender === 'female') {
//             element.src = 'images/female.jpg';
//         } else {
//             element.src = 'images/default.png';
//         }
//     };

//     setImage(xgender, xpl);
//     setImage(xgender, xpm);
//     setImage(ogender, opl);
//     setImage(ogender, opm);
// }

// // Add event listeners to each cell
// cells.forEach(cell => {
//     cell.addEventListener('click', () => {
//         // Check if the cell is already occupied
//         if (!cell.classList.contains('clicked')) {
//             // Place the move locally and emit the move to the server
//             placeMove(cell.id, currentPlayer);
//             socket.emit('move', { cellId: cell.id, player: currentPlayer, roomCode });
//         }
//     });
// });

// // Function to place a move on the board
// function placeMove(cellId, player) {
//     const cell = document.getElementById(cellId);
//     cell.textContent = player;
//     cell.classList.add('clicked'); // Mark the cell as clicked to make it unclickable
//     cell.style.pointerEvents = 'none'; // Make the cell unclickable after placing a move
// }

// // Listen for move events from the server
// socket.on('move', ({ cellId, player }) => {
//     placeMove(cellId, player);
// });



const cells = document.querySelectorAll('.cell');
let currentPlayer = 'X';  // This should change based on the player's role (e.g., fetched from the server)
let gameActive = true;  // A flag to control the game state

// Get the room code from the URL path
const roomCode = window.location.pathname.split('/').pop();

// Get player and image elements
const p1 = document.getElementById('p1');
const p2 = document.getElementById('p2');
const xpl = document.getElementById('xpl');
const opl = document.getElementById('opl');
const xpm = document.getElementById('xpm');
const opm = document.getElementById('opm');
const ln = document.getElementById('xn');
const rn = document.getElementById('on');
const lh = document.getElementById('xh');
const rh = document.getElementById('oh');
// Initialize socket connection
const socket = io();
socket.emit('joinRoom', roomCode);
// Fetch room details and update UI
fetch(`/api/${roomCode}/details`)
    .then(response => response.json())
    .then(data => {
        ln.innerText = data.xname;
        rn.innerText = data.oname;
        first = data.first;
        if(first===1){
            lh.innerText = "X";
            rh.innerText = "O";
        }
        else{ 
            lh.innerText = "O";
            rh.innerText = "X";
    }
        p1.innerText = data.xname;
        p2.innerText = data.oname;
        updatePlayerImages(data.xgender, data.ogender);
    })
    .catch(error => console.error('Error fetching room details:', error));

// Update player images based on gender
function updatePlayerImages(xgender, ogender) {
    const setImage = (gender, element) => {
        if (gender === 'male') {
            element.src = 'images/male.jpg';
        } else if (gender === 'female') {
            element.src = 'images/female.jpg';
        } else {
            element.src = 'images/default.png';
        }
    };

    setImage(xgender, xpl);
    setImage(xgender, xpm);
    setImage(ogender, opl);
    setImage(ogender, opm);
}
let x;
let o;
function firstPlayer(){
    fetch(`/api/${roomCode}/details`)
    .then(response => response.json())
    .then(data => {
        let val = data.first;
        if(val===1){
            console.log(`${data.xname} is X`);
            alert(`Coin is tossed. ${data.xname} plays first as "X"`);
            x = data.xname;
            o = data.oname;
        }
        else{ 
            console.log(`${data.oname} is X`);
            alert(`Coin is tossed. ${data.oname} plays first as "X"`);
            x = data.oname;
            o = data.xname;
    }
        
    })
    .catch(error => console.error('Error fetching room details:', error));
}

firstPlayer();

// Add event listeners to each cell
cells.forEach(cell => {
    cell.addEventListener('click', () => {
        // Only proceed if the game is active and the cell is not occupied
        if (gameActive && !cell.classList.contains('clicked')) {
            placeMove(cell.id, currentPlayer);
            socket.emit('move', { cellId: cell.id, player: currentPlayer, roomCode });
            checkGameStatus(); // Check if the move results in a win or draw
            switchPlayer(); // Switch turns
        }
    });
});

// Function to place a move on the board
function placeMove(cellId, player) {
    const cell = document.getElementById(cellId);
    cell.textContent = player;
    cell.classList.add('clicked'); // Mark the cell as clicked to make it unclickable
    cell.style.pointerEvents = 'none'; // Make the cell unclickable after placing a move
}

// Listen for move events from the server
socket.on('move', ({ cellId, player }) => {
    placeMove(cellId, player);
    checkGameStatus(); // Check if the move results in a win or draw after a move is received
    switchPlayer(); // Switch turns for the remote player
});

// Function to switch the player turn
function switchPlayer() {
    currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
}

// Function to check for game status (win or draw)
function checkGameStatus() {
    const winPatterns = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
        [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
        [0, 4, 8], [2, 4, 6]             // Diagonals
    ];

    const board = Array.from(cells).map(cell => cell.textContent.trim());

    let winner = null;

    // Check for a win
    winPatterns.forEach(pattern => {
        const [a, b, c] = pattern;
        if (board[a] && board[a] === board[b] && board[a] === board[c]) {
            winner = board[a];
        }
    });

    // If a winner is found, end the game
    if (winner==="X") {
        gameActive = false;
        // Delay the alert to show the winner after the move is placed
        setTimeout(() => {
            alert(`${x} wins!`);
        }, 1000);
        return;
    }
    else if(winner==="O"){
        gameActive = false;
        // Delay the alert to show the winner after the move is placed
        setTimeout(() => {
            alert(`${o} wins!`);
        }, 1000);
        return;
    }

    // Check for a draw (no empty cells)
    if (!board.includes('')) {
        gameActive = false;
        // Delay the alert to show the draw message after the move is placed
        setTimeout(() => {
            alert("It's a draw!");
        }, 1000);
    }
}
