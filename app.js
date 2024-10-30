const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');  // For handling CORS
const app = express();
const port = 3000;
const server = http.createServer(app);
const io = socketIo(server);

// CORS setup
app.use(cors());

// Middleware for serving static files
app.use(express.static('public'));
app.use(express.json());

// PostgreSQL connection
const pool = new Pool({
    user: "postgres",
    host: "localhost",
    database: "TicTacToeGame",
    password: "Your password",
    port: "5432",
});

// Middleware
app.use(bodyParser.urlencoded({ extended: false }));

// Session configuration for tracking user login state
app.use(session({
    secret: 'your secret',
    resave: false,
    saveUninitialized: true,
}));

// Initial login page display
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Redirect for sign in, if no account
app.get('/signin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'signin.html'));
});

// Redirect for login, if account exists
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Home by button
app.get('/home', (req, res) => {
    if (!req.session.userId) {
        return res.redirect('/login');
    }
    res.sendFile(path.join(__dirname, 'public', 'home.html'));
});

app.get('/play', (req, res) => {
    if (!req.session.userId) {
        return res.redirect('/login');
    }
    res.sendFile(path.join(__dirname, 'public', 'play.html'));
});

// Account page display
app.get('/account', (req, res) => {
    if (!req.session.userId) {
        return res.redirect('/login');
    }
    res.sendFile(path.join(__dirname, 'public', 'account.html'));
});

app.get('/about', (req, res) => {
    if (!req.session.userId) {
        return res.redirect('/login');
    }
    res.sendFile(path.join(__dirname, 'public', 'about.html'));
});

// API endpoint for user data
app.get('/api/user', async (req, res) => {
    if (!req.session.userId) {
        return res.status(401).send('Unauthorized');
    }

    try {
        const result = await pool.query(
            'SELECT name, gender, age, wins, loses, draws FROM userinfo WHERE id = $1',
            [req.session.userId]
        );

        if (result.rows.length > 0) {
            const userData = result.rows[0];
            res.json(userData);
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (err) {
        console.error('Error:', err);
        res.status(500).send('An error occurred while fetching user data.');
    }
});

// Sign in form submission
app.post('/signin', async (req, res) => {
    const { email, password } = req.body;
    try {
        const result = await pool.query('SELECT email FROM account WHERE email = $1', [email]);
        if (result.rows.length > 0) {
            res.send('<p>Email already exists</p> <a href="/signin">Go back to sign in</a>');
            return;
        }

        // Hash password
        const saltRounds = 7;
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        const insertResult = await pool.query('INSERT INTO account(email, password) VALUES($1, $2) RETURNING id', [email, hashedPassword]);
        const userId = insertResult.rows[0].id;

        // Create corresponding user info entry
        await pool.query('INSERT INTO userinfo(id) VALUES($1)', [userId]);
        res.redirect('/login');
    } catch (err) {
        console.error('Error:', err);
        res.status(500).send('An error occurred while processing your request.');
    }
});

// Login verification
app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const result = await pool.query('SELECT id, password FROM account WHERE email = $1', [email]);
        if (result.rows.length > 0) {
            const hashedPassword = result.rows[0].password;
            const userId = result.rows[0].id;
            const match = await bcrypt.compare(password, hashedPassword);

            if (match) {
                req.session.userId = userId;
                return res.redirect('/home');
            }
        }
        res.send('<p>Incorrect email or password. Try again.</p> <a href="/login">Go back to login</a>');
    } catch (err) {
        console.error('Error:', err);
        res.status(500).send('An error occurred while processing your request.');
    }
});

// Update user info
app.post('/update', async (req, res) => {
    const { name, age, gender } = req.body;
    try {
        await pool.query('UPDATE userinfo SET name = $1, age = $2, gender = $3 WHERE id = $4', [name, age, gender, req.session.userId]);
        res.redirect('/account');
    } catch (err) {
        console.error('Error:', err);
        res.status(500).send('An error occurred while updating user information.');
    }
});




app.post('/update-game-result', async (req, res) => {

    // Extract the game result from the request body
    const result = req.body.result;

    // Use the userId from the session
    const userId = req.session.userId;

    if (!userId) {
        return res.status(401).json({ message: 'User not authenticated' });
    }

    try {
        if(result==='win'){
            await pool.query('UPDATE userinfo SET wins = wins + 1 WHERE id = $1', [req.session.userId]);
        }
        else if(result==='lost'){
            await pool.query('UPDATE userinfo SET loses = loses + 1 WHERE id = $1', [req.session.userId]);
        }
        else if(result==='draw'){
            await pool.query('UPDATE userinfo SET draws = draws + 1 WHERE id = $1', [req.session.userId]);
        }
    } catch (err) {
        console.error('Error:', err);
        res.status(500).send('An error occurred while updating user information.');
    }

    res.json({ message: 'Game result updated successfully' });
});



app.post('/update-multi-result', async (req, res) => {

    // Extract the game result, wid, and lid from the request body
    const { result, wid, lid } = req.body;

    // Use the userId from the session
    const userId = req.session.userId;

    if (wid != userId) {
        return;
    }

    if(result==='notdraw'){
        await pool.query('UPDATE userinfo SET wins = wins + 1 WHERE id = $1', [wid]);
        await pool.query('UPDATE userinfo SET loses = loses + 1 WHERE id = $1', [lid]);
    }
    else if(result==='draw'){
        await pool.query('UPDATE userinfo SET draws = draws + 1 WHERE id = $1', [wid]);
        await pool.query('UPDATE userinfo SET draws = draws + 1 WHERE id = $1', [lid]);
    }
    else if(result === 'quit'){
        await pool.query('DELETE FROM rooms WHERE id1 = $1',[wid]);
        console.log("room deleted");
    }
    
    // Respond with success message
    res.json({ message: 'Game result received successfully' });
});


//online game logic//
app.get('/generate-room-code', async (req, res) => {
    // Check if the user is logged in
    if (!req.session.userId) {
        return res.status(401).send('Unauthorized');
    }

    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let roomCode = '';
    for (let i = 0; i < 6; i++) {
        roomCode += characters.charAt(Math.floor(Math.random() * characters.length));
    }

    // Generate a random number (1 or 2) for the first player
    const val = Math.floor(Math.random() * 2) + 1; // Generates 1 or 2


    try {
        // Retrieve the user's name and gender from the database
        const userResult = await pool.query(
            'SELECT name, gender FROM userinfo WHERE id = $1',
            [req.session.userId]
        );

        if (userResult.rows.length === 0) {
            return res.status(404).send('User not found');
        }

        const { name, gender } = userResult.rows[0];

        // Insert the new room code into the 'rooms' table along with name and gender
        await pool.query(
            `INSERT INTO rooms (roomcode, xname, xgender, first, id1) VALUES ($1, $2, $3, $4, $5)`,
            [roomCode, name, gender, val, req.session.userId]
        );

        // Dynamically create an endpoint for the roomCode
        app.get(`/${roomCode}`, (req, res) => {
            res.sendFile(path.join(__dirname, 'public', 'endpoint.html'));
        });

        // Send the generated room code to the client via SSE
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        // Send the room code to the client
        res.write(`data: ${roomCode}\n\n`);

        // Set up an interval to check the value of 'o'
        const intervalId = setInterval(async () => {
            const result = await pool.query(
                `SELECT o FROM rooms WHERE roomcode = $1`,
                [roomCode]
            );

            const oValue = result.rows[0].o; // Get the updated o value

            // Check if oValue is ready
            if (oValue === 'ready') {
                clearInterval(intervalId); // Stop checking
                res.write(`data: redirect\n\n`); // Send a signal to the client to redirect
                // Set a timeout before the actual redirection
                setTimeout(() => {
                    res.end(); // End the SSE connection
                    app.get(`/${roomCode}`, (req, res) => {
                        res.sendFile(path.join(__dirname, 'public', 'endpoint.html'));
                    });
                }, 1000); // Adjust delay as needed
            }
        }, 1000); // Check every 1 second

    } catch (error) {
        console.error('Error inserting or querying room code:', error);
        res.status(500).send('Server error');
    }
});




// Route to handle joining a room
app.post('/join-room', async (req, res) => {
    const { roomCode } = req.body;

    try {
        // Check if the room code exists in the rooms table
        const result = await pool.query(
            `SELECT * FROM rooms WHERE roomcode = $1`,
            [roomCode]
        );

        if (result.rows.length > 0) {
            if (!req.session.userId) {
                console.error('User ID not found in session');
                return res.status(401).send('Unauthorized');
            }

            // Fetch user's name and gender
            const userResult = await pool.query(
                'SELECT name, gender FROM userinfo WHERE id = $1',
                [req.session.userId]
            );

            if (userResult.rows.length === 0) {
                console.error('User not found');
                return res.status(404).send('User not found');
            }

            const { name, gender } = userResult.rows[0];

            // Update the room with player's name and gender
            await pool.query(
                `UPDATE rooms 
                 SET o = 'ready', oname = $1, ogender = $2, id2 = $3
                 WHERE roomcode = $4`,
                [name, gender, req.session.userId, roomCode]
            );

            res.redirect(`/${roomCode}`);
        } else {
            console.error('Room code does not exist');
            res.redirect('/play');
        }
    } catch (error) {
        console.error('Error joining room:', error);
        res.status(500).send('Server error');
    }
});


// Endpoint to get all details (xname, xgender, oname, ogender) and a random first player
app.get('/api/:roomCode/details', async (req, res) => {
    const { roomCode } = req.params;
    try {
        const result = await pool.query(
            'SELECT xname, xgender, oname, ogender, first, id1, id2 FROM rooms WHERE roomcode = $1',
            [roomCode]
        );

        if (result.rows.length > 0) {
            const { xname, xgender, oname, ogender, first, id1, id2 } = result.rows[0];
            res.json({ xname, xgender, oname, ogender, first, id1, id2});
        } else {
            res.status(404).send('Room not found');
        }
    } catch (error) {
        console.error('Error fetching room details:', error);
        res.status(500).send('Server error');
    }
});




io.on('connection', (socket) => {
 
    // Join a room based on room code
    socket.on('joinRoom', (roomCode) => {
        socket.join(roomCode);
    });

    // Listen for a move from a player
    socket.on('move', ({ cellId, player, roomCode }) => {
        socket.to(roomCode).emit('move', { cellId, player });
    });

    // Listen for the quit action
    socket.on('quitGame', (roomCode) => {
        // Broadcast the playerQuit event to all other clients in the room
        socket.to(roomCode).emit('playerQuit');
    });
});

app.get('/search-player', async (req, res) => {
    const email = req.query.email;
    
    try {
        // Query account table to find the ID by email
        const user = await pool.query('SELECT id FROM account WHERE email = $1', [email]);
        
        if (user.rows.length === 0) {
            return res.json({ success: false, message: 'Player not found' });
        }

        const userId = user.rows[0].id;
        
        // Query userinfo table to get details for the found userId
        const userInfo = await pool.query(
            'SELECT name, age, gender, wins, loses, draws FROM userinfo WHERE id = $1',
            [userId]
        );

        if (userInfo.rows.length === 0) {
            return res.json({ success: false, message: 'Player details not found' });
        }

        // Send back player details
        res.json({ success: true, player: userInfo.rows[0] });
        
    } catch (error) {
        console.error('Error fetching player data:', error);
        res.status(500).json({ success: false, message: 'An error occurred' });
    }
});





server.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
