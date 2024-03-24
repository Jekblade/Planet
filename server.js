const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql');
const { body, validationResult } = require('express-validator');
const helmet = require('helmet');

const app = express();
app.use(bodyParser.json());
app.use(helmet());

const db = mysql.createConnection({
    host: 'your-rds-endpoint',
    user: 'your-username',
    password: 'your-password',
    database: 'your-database'
});

db.connect((err) => {
    if (err) throw err;
    console.log('Connected to the database.');
});

app.post('/register', [
    body('username').trim().escape(),
    body('email').isEmail().normalizeEmail(),
    body('password').trim().escape(),
    body('avatar_id').toInt(),
    body('lat').toFloat(),
    body('lon').toFloat()
], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const user = req.body;
    const sql = 'INSERT INTO users SET ?';
    db.query(sql, user, (err, result) => {
        if (err) throw err;
        res.send('User registered');
    });
});


app.post('/login', (req, res) => {
        const user = { email: req.body.email, password: req.body.password };
        const sql = 'SELECT * FROM users WHERE email = ? AND password = ?';
        db.query(sql, [user.email, user.password], (err, result) => {
            if (err) throw err;
            if (result.length > 0) {
                res.send('User logged in');
            } else {
                res.send('Invalid credentials');
            }
        });
    });
    
    app.get('/refresh', (req, res) => {
        const sql = 'SELECT username, lat, lon FROM users';
        db.query(sql, (err, result) => {
            if (err) throw err;
            res.json(result);
        });
    });
