const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql');
const { body, validationResult } = require('express-validator');
const helmet = require('helmet');
const bcrypt = require('bcrypt');

const app = express();
app.use(bodyParser.json());
app.use(helmet());

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
});

app.post('/register', [
    body('username').trim().escape(),
    body('email').isEmail().normalizeEmail(),
    body('password').trim().escape(),
    body('avatar_id').toInt(),
    body('lat').toFloat(),
    body('lon').toFloat()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const user = req.body;
    user.password = await bcrypt.hash(user.password, 10);
    const sql = 'INSERT INTO users SET username = ?, email = ?, password = ?, avatar_id = ?, lat = ?, lon = ?';
    db.query(sql, [user.username, user.email, user.password, user.avatar_id, user.lat, user.lon], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Server error');
        }
        res.send('User registered');
    });
});

app.post('/login', (req, res) => {
    const { email, password } = req.body;
    const sql = 'SELECT * FROM users WHERE email = ?';
    db.query(sql, [email], async (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Server error');
        }
        if (result.length > 0) {
            const match = await bcrypt.compare(password, result[0].password);
            if (match) {
                res.send('User logged in');
            } else {
                res.send('Invalid credentials');
            }
        } else {
            res.send('Invalid credentials');
        }
    });
});

app.get('/refresh', (req, res) => {
    const sql = 'SELECT username, lat, lon FROM users';
    db.query(sql, (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Server error');
        }
        res.json(result);
    });
});

app.listen(process.env.PORT || 3000, () => {
    console.log(`Server is running on port ${process.env.PORT || 3000}`);
});