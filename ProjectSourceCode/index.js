//dependencies the same as lab 8
const express = require('express');
const app = express();
const handlebars = require('express-handlebars');
const Handlebars = require('handlebars');
const path = require('path');
const pgp = require('pg-promise')();
const bodyParser = require('body-parser');
const session = require('express-session'); 
const bcrypt = require('bcryptjs'); 
const axios = require('axios');

//hbs build
const hbs = handlebars.create({
    extname: 'hbs',
    layoutsDir: __dirname + '/layouts',
    partialsDir: __dirname + '/pages',
  });

//db config will have to be updated when database is actually built
// database configuration
const dbConfig = {
    host: 'db', // the database server
    port: 5432, // the database port
    database: process.env.POSTGRES_DB, // the database name
    user: process.env.POSTGRES_USER, // the user account to connect with
    password: process.env.POSTGRES_PASSWORD, // the password of the user account
  };
  
  const db = pgp(dbConfig);
  
  // test your database
  db.connect()
    .then(obj => {
      console.log('Database connection successful'); // you can view this message in the docker compose logs
      obj.done(); // success, release the connection;
    })
    .catch(error => {
      console.log('ERROR:', error.message || error);
    });

//final hbs requirements
// Register `hbs` as our view engine using its bound `engine()` function.
app.engine('hbs', hbs.engine);
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));
app.use(bodyParser.json()); // specify the usage of JSON for parsing request body.

// initialize session variables
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    saveUninitialized: false,
    resave: false,
  })
);

app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);

//rough login/register API routes will have to be updated by group
// TODO - Include your API routes here
app.get('/', (req, res) => {
    res.redirect('/login'); 
});

app.get('/register', (req, res) => {
    res.render('pages/register');
});

app.post('/register', async (req, res) => {
    const { username, email, password } = req.body;

    if (!username || !password || !email) {
        return res.render('pages/register', { message: 'All fields are required' });
    }

    try {

        const hashedPassword = await bcrypt.hash(password, 10);
        //both username and email should be unique keys in database
        const query = 'INSERT INTO users (username, email, password) VALUES ($1, $2, $3)';
        await db.query(query, [username, email, hashedPassword]);

        res.redirect('/login'); 
    } catch (error) {
        console.error('Error inserting user:', error);
        res.render('pages/register', { message: 'Error registering user. Try again.' });
    }
});

app.get('/login', (req, res) => {
    res.render('pages/login', { message: req.session.message });
    req.session.message = null; 
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.render('pages/login', { message: 'All fields are required' });
    }

    try {
        const query = await db.one('SELECT * FROM users WHERE username = $1 LIMIT 1', [username]);

        console.log("Query Result:", query);

        const match = await bcrypt.compare(password, query.password);

        if (!match) {
            return res.render('pages/login', { message: 'Incorrect username or password.' });
        }

        req.session.user = query.username;
        req.session.save(() => {
            res.redirect('/discover');
        });

    } catch (error) {
        console.error('Login error:', error);
        res.render('pages/login', { message: 'Incorrect username or password' });
    }
});


//main page data
app.get('/home', auth, async (req, res) => {
    try {
        const query = 'SELECT * FROM trails'
        const response = await db.query();

        const trailsData = response.data|| [];

        const trails = trailsData.map(trailsData => ({
            name: trails.name,
        }));

        res.render('pages/discover', { trails });

    } catch (error) {
        console.error("Error fetching events:", error);
        res.render('discover', { trails: [], message: 'Failed to load events. Please try again later.' });
    }
});

