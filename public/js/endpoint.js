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

const xoro1 = document.getElementById('xoro1');
const xoro2 = document.getElementById('xoro2');

const pturn1 = document.getElementById('pturn1');
const pturn2 = document.getElementById('pturn2');

let current1;
let current2;
let xid;
let oid;
let del;
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
            xoro1.innerHTML = 'You are <br>playing as "X"';
            xoro2.innerHTML = 'You are <br>playing as "O"';
            current1 = pturn1;
            current2 = pturn2;
            xid = data.id1;
            oid = data.id2;
            current1.style.display = 'flex';
            current2.style.display = 'none';
        }
        else{ 
            lh.innerText = "O";
            rh.innerText = "X";
            xoro1.innerHTML = 'You are <br>playing as "O"';
            xoro2.innerHTML = 'You are <br>playing as "X"';
            current1 = pturn2;
            current2 = pturn1;
            xid = data.id2;
            oid = data.id1;
            current1.style.display = 'flex';
            current2.style.display = 'none';
    }
        p1.innerText = data.xname;
        p2.innerText = data.oname;
        del = data.id1;
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
            displayToss(data.xname);
            x = data.xname;
            o = data.oname;
        }
        else{ 
            console.log(`${data.oname} is X`);
            displayToss(data.oname);
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


let temp;
// Function to switch the player turn
function switchPlayer() {
    temp = current1;
    current1 = current2;
    current2 = temp;
    current1.style.display = 'flex';
    current2.style.display = 'none';
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
    
    let wid;
    let lid;
    let d1;
    let d2;
    let win;
    // If a winner is found, end the game
    if (winner==="X") {
        win = `${x} Wins!`;
        wid = xid;
        lid = oid;
        sendGameResult('notdraw',wid,lid);
        displayPopup(win);
        gameActive = false;
        return;
    }
    else if(winner==="O"){
        win = `${o} Wins!`;
        wid = oid;
        lid = xid;
        sendGameResult('notdraw',wid,lid);
        displayPopup(win);
        gameActive = false;
        return;
    }

    // Check for a draw (no empty cells)
    if (!board.includes('')) {
        win = "It's a Draw";
        d1 = xid;
        d2 = oid;
        sendGameResult('draw',d1,d2);
        displayPopup(win);
        gameActive = false;  
        return;      
    }
}


// Display popup with the result and options
function displayPopup(message) {
    const popup = document.createElement('div');
    popup.className = 'winner-overlay';
    popup.innerHTML = `
        <div class="message">
            <h1 class="wh">${message}</h1>
            <div class="buttons">
                <button class="bt" id="playAgain">Play Again</button>
                <button class="bt" id="quit">Quit</button>
            </div>
        </div>
    `;

    document.body.appendChild(popup);

    // Play Again button functionality
    document.getElementById('playAgain').addEventListener('click', () => {
        document.body.removeChild(popup);
        window.location.href = `/${roomCode}`;
    });

    // Quit button functionality
    document.getElementById('quit').addEventListener('click', () => {
        wid = oid;
        lid = xid;
        sendGameResult('quit',del,0);
        // Emit the quitGame event to notify the server
        socket.emit('quitGame', roomCode);
        window.location.href = '/play'; // Redirect to the play route
    });
}



// Listen for the playerQuit event to hide the Play Again button
socket.on('playerQuit', () => {
    const playAgainButton = document.getElementById('playAgain');
    playAgainButton.style.display = 'none';
});


function displayToss(message) {
    const popup = document.createElement('div');
    popup.className = 'winner-overlay';
    popup.id = 'toss'
    popup.innerHTML = `
        <div class="message">
            <p class="wh">Coin is tossed. ${message} plays first as "X"</p>
            <div class="buttons">
                <button class="bt" id="start">Start</button>
            </div>
        </div>
    `;

    document.body.appendChild(popup);

    // Quit button functionality
    document.getElementById('start').addEventListener('click', () => {
        document.getElementById('toss').style.display = 'none';
    });
}


// This function is called when the game ends and the result is determined
function sendGameResult(result, wid, lid) {
    const data = { 
        result, 
        wid, 
        lid
    };

    fetch('/update-multi-result', {
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
