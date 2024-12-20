import express from "express";
import { dirname } from "path";
import { fileURLToPath } from "url";
import open from "open";
import bodyParser from "body-parser";
import mysql from "mysql2";
import dotenv from 'dotenv';

dotenv.config();
const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const port = 3000;

// connection requirements
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  // Create env file to store below data with the same names 
  password: process.env.MSQLPASS,   // Replace with your MYSQL password
  database: process.env.DB,        // Replace with your own Database
  port: process.env.MSQLPORT      // Replace with port used on your system
});


// connection to mysql
connection.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL:', err);
    return;
  }
  console.log('Connected to MySQL database');
});

// Create table in db for storing users 
const createTable = `
  CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,     
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`;

// error handling for table creation
connection.query(createTable, (err) => {
  if (err) {
    console.error('Error creating table:', err);
  } else {
    console.log('Table is ready');
  }
});

app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));

// handling user registration
app.post("/submit", (req, res) => {
  const { email, password } = req.body;
  
  const query = 'INSERT INTO users (email, password) VALUES (?, ?)';
  connection.query(query, [email, password], (err, results) => {
    if (err) {
      console.error('Error saving to database:', err);
      res.status(500).send('Error saving data');
      return;
    }
    res.redirect(`/public/success.html?email=${encodeURIComponent(email)}`);
  });
});


// handling user login
app.post("/login", (req, res) => {
  const { email, password } = req.body;

  const query = 'SELECT * FROM users WHERE email = ? AND password = ?';
  connection.query(query, [email, password], (err, results) => {
    if (err) {
      console.error('Error fetching user:', err);
      res.status(500).send('Error fetching data');
      return;
    }

    if (results.length > 0) {
      res.redirect(`/public/success.html?email=${encodeURIComponent(email)}`);
    } else {
      res.redirect("/login.html?error=1");
    }
  });
});


//error handling for displaying registered users
app.get("/users", (req, res) => {
  connection.query('SELECT * FROM users', (err, results) => {
    if (err) {
      console.error('Error fetching users:', err);
      res.status(500).send('Error fetching data');
      return;
    }
    res.json(results);
  });
});


app.listen(port, () => {
  open(`http://localhost:${port}`);
  console.log(`Listening on port ${port}`);
});


process.on('SIGINT', () => {
  connection.end((err) => {
    console.log('MySQL connection closed');
    process.exit();
  });
});
