const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const http = require('http');
const app = express();
const port = 3000;

var identify;
var gender;

app.use(express.static('public'));

//postgres connection
const pool = new Pool({
    user: "postgres",
    host: "localhost",
    database: "TicTacToeGame",
    password: "NewGen-123",
    port: "5432",
})

//middleware
app.use(bodyParser.urlencoded({extended: false}));

//initial login page display
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public','login.html'));
});

//redirect for sign in, if no account
app.get('/signin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'signin.html'));
});

//redirect for login, if account exist
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
})

//home by button
app.get('/home', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'home.html'));  
});

app.get('/play', (req, res) => {
    res.sendFile(path.join(__dirname, 'public','play.html'));
});

//account by button
app.get('/account', async (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'account.html')); 
    try{
        const result = await pool.query('SELECT name, gender, age, wins, loses, draws FROM userinfo WHERE id = $1', [identify]);
        u_name = result.rows[0].name;
        gender = result.rows[0].gender;
        age = result.rows[0].age;
        wins = result.rows[0].wins;
        loses = result.rows[0].loses;
        draws = result.rows[0].draws;
        app.get('/api/u_name', (req, res) => {
            res.json({ u_name: u_name });
          }); 
        app.get('/api/gender', (req, res) => {
            res.json({ gender: gender });
          });        
        app.get('/api/age', (req, res) => {
          res.json({ age: age });
        }); 
        app.get('/api/wins', (req, res) => {
            res.json({ wins: wins });
          }); 
        app.get('/api/loses', (req, res) => {
          res.json({ loses: loses });
        }); 
        app.get('/api/draws', (req, res) => {
            res.json({ draws: draws });
          }); 
    }
    catch(err){
    }
});


//sign in form submission
app.post('/signin', async (req, res) => {
    const { email, password} = req.body;
    try {
        const result = await pool.query('SELECT email FROM account WHERE email = $1',[email]);
        if (result.rows.length > 0) {
            res.send(`<p>Email already exists</p> <a href="/signin">Go back to sign in</a>`);
            return;
        }
    
    //hash password
    const saltRounds = 7;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    const insertResult = await pool.query('INSERT INTO account(email, password) VALUES($1, $2) RETURNING id', [email, hashedPassword]);
    const userId = insertResult.rows[0].id;
    await pool.query('INSERT INTO userinfo(id) VALUES($1)', [userId]);
    res.redirect('/login');
    } catch (err) {
        console.error('Error:',err);
        res.status(500).send('An error occurred while processing your request.');
    }
});

//login verification
app.post('/login', async (req, res) => {
    const { email, password} = req.body;
    try{
        const result = await pool.query('SELECT id, password FROM account WHERE email = $1',[email]);
        if (result.rows.length > 0) {
            const hashedPassword = result.rows[0].password;
            identify = result.rows[0].id;
            const match = await bcrypt.compare(password, hashedPassword);
            if (match) {
                return res.sendFile(path.join(__dirname, 'public','home.html')); 
            }
        } 
        res.send(`<p>Incorrect email or password. Try again.</p> <a href="/login">Go back to login</a>`);
    } catch (err) {
        console.error('Error:',err);
        res.status(500).send('An error occurred while processing your request.');
    }
});

app.post('/update', async (req,res) => {
    const {name, age, gender} = req.body;
    try{
        await pool.query('UPDATE userinfo SET name = $1, age = $2, gender = $3 WHERE id = $4',[name,age,gender,identify]);
        res.redirect('/account');
    }
    catch(err){
        res.status(500).send('An error occurred while processing your request.');
    }
})




//online game logic//
app.get('/generate-room-code', async (req, res) => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let roomCode = '';
    for (let i = 0; i < 6; i++) {
      roomCode += characters.charAt(Math.floor(Math.random() * characters.length));
    }
  
    try {
      // Insert the new room code into the 'rooms' table
      await pool.query(
        `INSERT INTO rooms (roomcode, x, o) VALUES ($1, 'ready', 'waiting')`,
        [roomCode]
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
        console.log(`Current value of 'o' for roomcode ${roomCode}:`, oValue);
  
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
            // Room code exists, update 'o' to 'ready'
            await pool.query(
                `UPDATE rooms SET o = 'ready' WHERE roomcode = $1`,
                [roomCode]
            );
            // Optionally, you can redirect to a room-specific page or send a success message
            res.redirect(`/${roomCode}`);
        } else {
            // Room code does not exist, redirect to /play
            res.redirect('/play');
        }
    } catch (error) {
        console.error('Error joining room:', error);
        res.status(500).send('Server error');
    }
});





//listen at port
app.listen(port,() => {
    console.log(`Server running at http://localhost:${port}`);
});

