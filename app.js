const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const app = express();
const port = 3000;

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

//listen at port
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
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
    await pool.query('INSERT INTO account(email, password) VALUES($1, $2)',[email, hashedPassword]);
    res.send('Account Created! proceed to login');
    } catch (err) {
        console.error('Error:',err);
        res.status(500).send('An error occurred while processing your request.');
    }
});

//login verification
app.post('/login', async (req, res) => {
    const { email, password} = req.body;
    try{
        const result = await pool.query('SELECT password FROM account WHERE email = $1',[email]);
        if (result.rows.length > 0) {
            const hashedPassword = result.rows[0].password;
            const match = await bcrypt.compare(password, hashedPassword);
            if (match) {
                return res.sendFile(path.join(__dirname, 'public','game.html')); 
            }
        } 
        res.send(`<p>Incorrect email or password. Try again.</p> <a href="/login">Go back to login</a>`);
    } catch (err) {
        console.error('Error:',err);
        res.status(500).send('An error occurred while processing your request.');
    }
});

